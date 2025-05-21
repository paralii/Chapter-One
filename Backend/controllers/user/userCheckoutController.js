import Address from "../../models/Address.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import mongoose from "mongoose";

// Utility function to calculate the shipping cost (this can be    or static)
const calculateShippingCost = (city) => {
  // Example: Shipping cost based on city (can be enhanced)
  const shippingCosts = {
    "New York": 10,
    "Los Angeles": 15,
    "Chicago": 12,
  };
  return shippingCosts[city] || 20; // Default shipping cost
};

// Checkout for the authenticated user
export default async function checkout (req, res) {
  const { address_id, paymentMethod } = req.body; // Address ID for shipping

  try {

    if (paymentMethod && !["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const cart = await Cart.findOne({ user_id: req.user._id }).populate("items.product_id");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    
    // Get the user's selected address, ensure it's default if no specific address is selected
    let address = await Address.findById(address_id);
    if (!address) {
      address = await Address.findOne({ user_id: req.user._id, isDefault: true });
      if (!address) {
        return res.status(400).json({ message: "No address available" });
      }
    }

    // Calculate product prices, taxes, discounts, and shipping
    let subtotal = 0;
    let taxes = 0;
    let discount = 0; // You can adjust this based on the user's coupons or promo codes
    const itemsDetails = [];

    for (const item of cart.items) {
      const product = item.product_id;
            if (!product || product.isDeleted) {
        return res.status(400).json({ message: `Product not available: ${item.product_id}` });
      }

           if (product.available_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for: ${product.title}` });
      }

      product.available_quantity -= item.quantity;
      await product.save();
      const itemTotal = product.price * item.quantity;
      const itemTaxes = (itemTotal * 0.1); // 10% tax for simplicity
      const itemDiscount = 0; // Placeholder for discount logic
      const finalItemTotal = itemTotal + itemTaxes - itemDiscount;

      subtotal += itemTotal;
      taxes += itemTaxes;
      discount += itemDiscount;

      itemsDetails.push({
        product_id: product._id,
        title: product.title,
        quantity: item.quantity,
        itemTotal,
        taxes: itemTaxes,
        discount: itemDiscount,
        finalItemTotal,
        refundProcessed: false,
      });
    }

    // Calculate shipping cost
    const shippingCost = calculateShippingCost(address.city);

    // Calculate final price
    const finalPrice = subtotal + taxes + shippingCost - discount;

    // Return checkout summary
    res.status(200).json({
      message: "Checkout successful",
      checkoutDetails: {
        address,
        paymentMethod,
        items: itemsDetails,
        subtotal,
        taxes,
        discount,
        shippingCost,
        finalPrice,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during checkout process", error: err.message });
  }
};
