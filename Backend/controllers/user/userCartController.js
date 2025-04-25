import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import Wishlist from "../../models/Wishlist.js";
import mongoose from "mongoose";

// Get cart for the authenticated user
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user_id: req.user._id,
    }).populate("items.product_id");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add product to cart
export const addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    // Fetch product details along with category information
    const product = await Product.findById(product_id).populate("category_id");

    // Check if product exists, is not blocked or deleted, and its category is listed
    if (!product || product.isDeleted || product.isBlocked) {
      return res.status(404).json({ message: "Product is unavailable" });
    }

    if (!product.category_id || !product.category_id.isListed) {
      return res.status(404).json({ message: "Product's category is not listed" });
    }

    // Validate the requested quantity does not exceed available stock
    const maxQuantityAllowed = product.available_quantity;
    if (quantity > maxQuantityAllowed) {
      return res.status(400).json({ message: "Exceeds available stock" });
    }

    // Ensure the user is authenticated
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find or create the user's cart
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
    }

    // Check if the product is already in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product_id.toString() === product_id.toString()
    );

    if (itemIndex > -1) {
      // If the product is already in the cart, update the quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (newQuantity > product.available_quantity) {
        return res.status(400).json({ message: "Quantity exceeds available stock" });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      // If the product is not in the cart, add it
      if (quantity > product.available_quantity) {
        return res.status(400).json({ message: "Exceeds available stock" });
      }
      cart.items.push({ product_id, quantity });
    }

    // Save the updated cart
    await cart.save();

    // Remove the product from the wishlist if it's added to the cart
    await Wishlist.findOneAndUpdate(
      { user_id: userId },
      { $pull: { products: new mongoose.Types.ObjectId(product_id) } }
    );

    // Return the updated cart information
    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ message: "An error occurred while adding the product to the cart" });
  }
};


// Update product quantity in cart
export const updateCartItemQuantity = async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    if (!product_id || isNaN(Number(quantity))) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const product = await Product.findById(product_id).populate("category_id");

    if (!product || product.isDeleted || product.isBlocked) {
      return res.status(404).json({ message: "Product not available" });
    }

    if (!product.category_id || !product.category_id.isListed) {
      return res.status(404).json({ message: "Product Category is not Listed" });
    }

    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product_id.toString() === product_id);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    const newQuantity = cart.items[itemIndex].quantity + Number(quantity);

    if (newQuantity < 1) {
      return res.status(400).json({ message: "Quantity cannot be less than 1" });
    }

    if (newQuantity > product.available_quantity) {
      return res.status(400).json({ message: "Exceeds available stock" });
    }

    cart.items[itemIndex].quantity = newQuantity;
    await cart.save();

    await cart.populate("items.product_id", "title price available_quantity product_imgs description");

    res.status(200).json({ message: "Cart item quantity updated successfully", cart });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// Remove product from cart
export const removeCartItem = async (req, res) => {
  const { product_id } = req.params;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== product_id
    );
    await cart.save();
    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Increment product quantity in cart
export const incrementCartItemQuantity = async (req, res) => {
  const { product_id } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product_id.toString() === product_id);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    const product = await Product.findById(product_id);

    if (product && product.available_quantity <= cart.items[itemIndex].quantity) {
      return res.status(400).json({ message: "Cannot increment. Stock is insufficient." });
    }

    cart.items[itemIndex].quantity += 1;
    await cart.save();

    res.status(200).json({ message: "Cart item quantity incremented successfully", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Decrement product quantity in cart
export const decrementCartItemQuantity = async (req, res) => {
  const { product_id } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product_id.toString() === product_id);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    if (cart.items[itemIndex].quantity <= 1) {
      return res.status(400).json({ message: "Cannot decrement quantity below 1" });
    }

    cart.items[itemIndex].quantity -= 1;
    await cart.save();

    res.status(200).json({ message: "Cart item quantity decremented successfully", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
