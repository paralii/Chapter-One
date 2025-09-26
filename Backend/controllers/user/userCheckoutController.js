import Address from "../../models/Address.js";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import Coupon from "../../models/Coupon.js";
import Offer from "../../models/Offer.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

const calculateShippingCost = (state) => {
  const shippingCosts = {
    "Kerala": 30,
    "Karnataka": 40,
    "Tamil Nadu": 35,
    "Maharashtra": 50,
    "Delhi": 60,
    "West Bengal": 45,
    "Gujarat": 55,
    "Uttar Pradesh": 50,
    "Andhra Pradesh": 40,
    "Telangana": 40,
  };
  return shippingCosts[state] || shippingCosts["Kerala"];
};

const generateOrderID = () => {
  return "CHAP" + Date.now() + Math.floor(Math.random() * 1000);
};

export const checkout = async (req, res) => {
  const { address_id, paymentMethod } = req.body;
  console.log(`add`,address_id,`pay`,paymentMethod,);
  try {
    if (!address_id) {
      return res.status(400).json({ success: false, message: "Address ID is required" });
    }

    if (!paymentMethod || !["COD", "ONLINE", "Wallet"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Payment method must be COD, ONLINE, or Wallet" });
    }

    let order = await Order.findOne({
      user_id: req.user._id,
      status: "Pending",
      paymentStatus: "Pending",
      isDeleted: false,
    });

    const cart = await Cart.findOne({ user_id: req.user._id }).populate("items.product_id");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let baseAmount = 0;
    let productDiscountTotal = 0;

    const productIds = cart.items.map((item) => item.product_id._id);
    const categoryIds = cart.items.map((item) => item.product_id.category_id);
    const now = new Date();

    // Fetch active PRODUCT offers
    const productOffers = await Offer.find({
      type: "PRODUCT",
      product_id: { $in: productIds },
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
    });

    // Fetch active CATEGORY offers
    const categoryOffers = await Offer.find({
      type: "CATEGORY",
      category_id: { $in: categoryIds },
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
    });

    const validatedItems = cart.items.map((item) => {
      const product = item.product_id;
      if (!product) return null;

      const basePrice = product.price  * item.quantity ;

      const productDiscount = product.discount || 0;

      const prodOffer = productOffers.find(
        (o) => o.product_id.toString() === product._id.toString()
      );
      const productOffer =
        prodOffer?.discount_type === "PERCENTAGE"
          ? prodOffer.discount_value
          : (prodOffer?.discount_value / product.price) * 100 || 0;

      // CATEGORY offer
      const catOffer = categoryOffers.find(
        (o) => o.category_id.toString() === product.category_id.toString()
      );
      const categoryOffer =
        catOffer?.discount_type === "PERCENTAGE"
          ? catOffer.discount_value
          : (catOffer?.discount_value / product.price) * 100 || 0;

      const bestOffer = Math.max(productOffer, categoryOffer, productDiscount);
      const discountAmount = (basePrice * bestOffer) / 100;

      baseAmount += basePrice;
      productDiscountTotal += discountAmount;

      return {
        product_id: product._id,
        quantity: item.quantity,
        price: product.price,
        total: basePrice,
        discountApplied: bestOffer,
        discountAmount,
        finalPrice: basePrice - discountAmount,
      };
    }).filter(Boolean);

    const subtotal = baseAmount - productDiscountTotal; 
    const shipping_chrg = subtotal > 500 ? 0 : 50;
    const taxes = +(subtotal * 0.18);  

    const existingCouponDiscount = order && (order.coupon 
    ? (order.discount - productDiscountTotal) 
    : 0);

    const netAmount = +(subtotal + taxes + shipping_chrg) -(existingCouponDiscount);
    if (paymentMethod === "COD" && netAmount > 1000) {
      return res.status(400).json({ success: false, message: "Cash on Delivery is not allowed for orders above Rs 1000" });
    }
    if (order) {
      const existingCouponDiscount = order.coupon 
    ? (order.discount - productDiscountTotal) 
    : 0;

      order.address_id = address_id;
      order.paymentMethod = paymentMethod;
      order.items = validatedItems;
      order.amount = baseAmount;
      order.discount = productDiscountTotal + existingCouponDiscount ;
      order.shipping_chrg = shipping_chrg;
      order.taxes = taxes;
      order.total = baseAmount - productDiscountTotal;
      order.netAmount = netAmount;

      await order.save();

      return res.json({
        success: true,
        message: "Checkout updated successfully",
        order,
      });
    } else {
      order = new Order({
        orderID: generateOrderID(),
        user_id: req.user._id,
        address_id,
        items: validatedItems,
        shipping_chrg,
        discount: productDiscountTotal,
        paymentMethod,
        amount: baseAmount,
        taxes,
        total: subtotal,
        netAmount,
        status: "Pending",
        paymentStatus: "Pending",
        isDeleted: false,
      });
      await order.save();
      return res.json({
        success: true,
        message: "Checkout created successfully",
        order,
      });
    }
  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).json({ success: false, message: "Checkout failed", error: err.message });
  }
};
