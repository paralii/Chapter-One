import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import mongoose from "mongoose";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

const isProductInList = (list, productId) => {
  if (!Array.isArray(list)) {
    return false;
  }
  return list.some((item) => item.product_id && item.product_id.toString() === productId);
};

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    let wishlist = await Wishlist.findOne({ user_id: userId }).populate("products");
    if (!wishlist) {
      wishlist = new Wishlist({ user_id: userId, products: [] });
      await wishlist.save();
    }
    const formattedProducts = wishlist.products.map(product => ({
      product_id: {
        _id: product._id,
        title: product.title,
        product_imgs: product.product_imgs,
        price: product.price,
        discountPercentage: product.discountPercentage,
        author_name: product.author_name,
      }
    }));
    res.json({ success: true, wishlist: { products: formattedProducts } });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch wishlist" });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid product ID" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Product not found" });
    }
    let wishlist = await Wishlist.findOne({ user_id: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user_id: userId, products: [] });
    }
    const alreadyInWishlist = wishlist.products.some((pid) =>
      pid.toString() === productId
    );
    if (alreadyInWishlist) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Product already in wishlist" });
    }
    wishlist.products.push(productId);
    await wishlist.save();
    const updatedWishlist = await Wishlist.findOne({ user_id: userId }).populate("products");
    const formattedProducts = updatedWishlist.products.map(product => ({
      product_id: {
        _id: product._id,
        title: product.title,
        product_imgs: product.product_imgs,
        price: product.price,
        discountPercentage: product.discountPercentage,
        author_name: product.author_name,
      }
    }));
    res.json({ success: true, message: "Product added to wishlist", wishlist: { products: formattedProducts } });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to add product to wishlist" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const wishlist = await Wishlist.findOne({ user_id: userId });
    if (!wishlist) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Wishlist not found" });
    }
    wishlist.products = wishlist.products.filter(
      (product) => product.toString() !== productId
    );
    await wishlist.save();
    const updatedWishlist = await Wishlist.findOne({ user_id: userId }).populate("products");
    const formattedProducts = updatedWishlist.products.map(product => ({
      product_id: {
        _id: product._id,
        title: product.title,
        product_imgs: product.product_imgs,
        price: product.price,
        discountPercentage: product.discountPercentage,
        author_name: product.author_name,
      }
    }));
    res.json({ success: true, message: "Product removed from wishlist", wishlist: { products: formattedProducts } });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to remove product from wishlist" });
  }
};

export const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Product not found" });
    }
    const wishlist = await Wishlist.findOne({ user_id: userId });
    if (!wishlist) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Wishlist not found" });
    }
    const productIndex = wishlist.products.findIndex(
      (product) => product.toString() === productId
    );
    if (productIndex === -1) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Product not found in wishlist" });
    }
    wishlist.products.splice(productIndex, 1);
let cart = await Cart.findOne({ user_id: userId });
if (!cart) {
  cart = new Cart({ user_id: userId, items: [] });
}
if (!Array.isArray(cart.items)) {
  cart.items = [];
}
const alreadyInCart = isProductInList(cart.items, productId);
if (alreadyInCart) {
  return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Product already in cart" });
}
cart.items.push({ product_id: productId, quantity: 1 });
    await cart.save();
    await wishlist.save();
    const updatedWishlist = await Wishlist.findOne({ user_id: userId }).populate("products");
    const formattedProducts = updatedWishlist.products.map(product => ({
      product_id: {
        _id: product._id,
        title: product.title,
        product_imgs: product.product_imgs,
        price: product.price,
        discountPercentage: product.discountPercentage,
        author_name: product.author_name,
      }
    }));
    res.json({
      success: true,
      message: "Product moved to cart",
      cart,
      wishlist: { products: formattedProducts }
    });
  } catch (err) {
    console.error("Error moving product to cart:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to move product to cart" });
  }
};