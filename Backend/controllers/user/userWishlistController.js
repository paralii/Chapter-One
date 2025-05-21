import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";  // Assuming you have a Cart model
import Product from "../../models/Product.js";  // Assuming you have a Product model
import mongoose from "mongoose";
import User from "../../models/User.js";  // Assuming you have a User model
// Helper function to check if product exists in a list
const isProductInList = (list, productId) => {
  return list.some((product) => product.product_id.toString() === productId);
};

// Get user's wishlist
export const getWishlist = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Try to find the wishlist for the user
      const wishlist = await Wishlist.findOne({ user_id: userId }).populate("products");
  
      if (!wishlist) {
        // If no wishlist is found, create a new one
        wishlist = new Wishlist({ user_id: userId, products: [] });
        await wishlist.save();
      }
  
      res.json({ success: true, wishlist });
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
    }
  };

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    let wishlist = await Wishlist.findOne({ user_id: userId });

    if (!wishlist) {
      wishlist = new Wishlist({ user_id: userId, products: [] });
    }

    // Check if product is already in wishlist
    const alreadyInWishlist = wishlist.products.some((pid) =>
      pid.toString() === productId
    );

    if (alreadyInWishlist) {
      return res.status(400).json({ success: false, message: "Product already in wishlist" });
    }

    wishlist.products.push(productId); // ✅ Push ObjectId directly
    await wishlist.save();

    res.json({ success: true, message: "Product added to wishlist", wishlist });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to add product to wishlist" });
  }
};


// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user_id: userId });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    // Remove the product from wishlist
    wishlist.products = wishlist.products.filter(
      (product) => product.product_id.toString() !== productId
    );

    await wishlist.save();

    res.json({ success: true, message: "Product removed from wishlist", wishlist });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to remove product from wishlist" });
  }
};

// Move product from wishlist to cart
export const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user_id: userId });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    // Check if the product exists in the wishlist
    const productIndex = wishlist.products.findIndex(
      (product) => product.product_id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in wishlist" });
    }

    // Remove the product from wishlist
    const product = wishlist.products[productIndex];
    wishlist.products.splice(productIndex, 1);

    // Check if the product is already in the cart
    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      cart = new Cart({ user_id: userId, products: [] });
    }

    const alreadyInCart = isProductInList(cart.products, productId);
  
    if (alreadyInCart) {
      return res.status(400).json({ success: false, message: "Product already in cart" });
    }

    // Add the product to the cart
    cart.products.push({ product_id: product.product_id });
    await cart.save();
    await wishlist.save();

    res.json({ success: true, message: "Product moved to cart", cart });
  } catch (err) {
    console.error("Error moving product to cart:", err);
    res.status(500).json({ success: false, message: "Failed to move product to cart" });
  }
};
