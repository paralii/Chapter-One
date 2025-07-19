import Address from "../../models/Address.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import Offer from "../../models/Offer.js";
import Coupon from "../../models/Coupon.js";
import mongoose from "mongoose";

const calculateShippingCost = (city) => {
  const shippingCosts = {
    "New York": 10,
    "Los Angeles": 15,
    "Chicago": 12,
  };
  return shippingCosts[city] || 20;
};

const calculateDiscount = (offer, item, discountedPrice) => {
  const price = discountedPrice * item.quantity;
  if (offer.discount_type === "PERCENTAGE") {
    return (offer.discount_value / 100) * price;
  }
  return Math.min(offer.discount_value, price);
};

const selectBestOffer = (offers, item, discountedPrice) => {
  return offers.reduce((best, offer) => {
    const discount = calculateDiscount(offer, item, discountedPrice);
    return !best || discount > calculateDiscount(best, item, discountedPrice) ? offer : best;
  }, null);
};

export default async function checkout(req, res) {
  const { address_id, paymentMethod, orderId, referralCode } = req.body;

  try {
    if (!address_id || !orderId) {
      return res.status(400).json({ success: false, message: "Address ID and Order ID are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(address_id) || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid Address ID or Order ID format" });
    }
    if (paymentMethod && !["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const order = await Order.findById(orderId);
    if (!order || !order.address_id.equals(address_id)) {
      return res.status(404).json({ success: false, message: "Order not found or address mismatch" });
    }

    const cart = await Cart.findOne({ user_id: req.user._id }).populate("items.product_id");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let address = await Address.findById(address_id);
    if (!address) {
      address = await Address.findOne({ user_id: req.user._id, isDefault: true });
      if (!address) {
        return res.status(400).json({ success: false, message: "No address available" });
      }
    }

    let subtotal = 0;
    let taxes = 0;
    let totalOfferDiscount = order.discount || 0;
    const appliedOffers = [];
    const itemsDetails = [];

    let referralOffer = null;
    if (referralCode) {
      referralOffer = await Offer.findOne({
        type: "REFERRAL",
        referral_code: referralCode,
        is_active: true,
        end_date: { $gte: new Date() },
      });
      if (!referralOffer) {
        return res.status(400).json({ success: false, message: "Invalid or inactive referral code" });
      }
    }

    for (const item of cart.items) {
      const product = item.product_id;
      if (!product || product.isDeleted) {
        return res.status(400).json({ message: `Product not available: ${item.product_id}` });
      }

      if (product.available_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for: ${product.title}` });
      }

      const productOffers = await Offer.find({
        type: "PRODUCT",
        product_id: product._id,
        is_active: true,
        end_date: { $gte: new Date() },
      });
      const categoryOffers = await Offer.find({
        type: "CATEGORY",
        category_id: product.category_id,
        is_active: true,
        end_date: { $gte: new Date() },
      });

      const discountedPrice = product.price * (1 - (product.discount || 0) / 100);      
      let itemDiscount = 0;
      let appliedOffer = null;

      const allOffers = [...productOffers, ...categoryOffers];
      if (referralOffer) allOffers.push(referralOffer);

      const bestOffer = selectBestOffer(allOffers, item, discountedPrice);
      if (bestOffer) {
        itemDiscount = calculateDiscount(bestOffer, item, discountedPrice);
        appliedOffer = bestOffer;
      }

      const itemTotal = discountedPrice * item.quantity;
      const itemTaxes = (itemTotal * 0.1);
      const finalItemTotal = itemTotal + itemTaxes - itemDiscount;

      subtotal += itemTotal;
      taxes += itemTaxes;
      totalOfferDiscount += itemDiscount;
      if (appliedOffer) appliedOffers.push(appliedOffer._id);

      itemsDetails.push({
        product_id: product._id,
        title: product.title,
        quantity: item.quantity,
        itemTotal,
        taxes: itemTaxes,
        discount: itemDiscount,
        finalItemTotal,
        applied_offer: appliedOffer ? appliedOffer._id : null,
        refundProcessed: false,
      });
    }

    const shippingCost = calculateShippingCost(address.city);
    const finalPrice = subtotal + taxes + shippingCost - totalOfferDiscount;

    order.amount = subtotal;
    order.taxes = taxes;
    order.shipping_chrg = shippingCost;
    order.discount = totalOfferDiscount;
    order.netAmount = finalPrice;
    order.total = finalPrice;
    order.applied_offers = appliedOffers;
    order.coupon = referralOffer ? referralOffer.referral_code : order.coupon;
    await order.save();

    res.status(200).json({
      message: "Checkout details fetched successfully",
      checkoutDetails: {
        address,
        paymentMethod,
        items: itemsDetails,
        subtotal,
        taxes,
        discount: totalOfferDiscount,
        shippingCost,
        finalPrice,
      },
    });
  } catch (err) {
    console.error("Error fetching checkout details:", err);
    res.status(500).json({ message: "Error during checkout process", error: err.message });
  }
};