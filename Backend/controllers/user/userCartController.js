import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import Wishlist from "../../models/Wishlist.js";
import  Offer from "../../models/Offer.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { errorLogger } from "../../utils/logger.js";


      const MAX_LIMIT = 5;

async function calculateCartItems(items) {
  const currentDate = new Date();
  const cartItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product_id).populate("category_id");

    if (!product || product.isDeleted || product.isBlocked || !product.category_id?.isListed) {
      continue; 
    }

    const [productOffer, categoryOffer] = await Promise.all([
      Offer.findOne({
        type: "PRODUCT",
        product_id: item.product_id,
        is_active: true,
        start_date: { $lte: currentDate },
        end_date: { $gte: currentDate }
      }),
      Offer.findOne({
        type: "CATEGORY",
        category_id: product.category_id,
        is_active: true,
        start_date: { $lte: currentDate },
        end_date: { $gte: currentDate }
      })
    ]);

    const productDiscount = productOffer
      ? (productOffer.discount_type === "PERCENTAGE"
          ? product.price * (productOffer.discount_value / 100)
          : productOffer.discount_value)
      : 0;

    const categoryDiscount = categoryOffer
      ? (categoryOffer.discount_type === "PERCENTAGE"
          ? product.price * (categoryOffer.discount_value / 100)
          : categoryOffer.discount_value)
      : 0;

    let finalPrice = product.price;
    let appliedOffer = null;
    let offerId = null;
    
    if (productDiscount > categoryDiscount) {
      finalPrice -= productDiscount;
      appliedOffer = "PRODUCT";
      offerId = productOffer._id;
    } else if (categoryDiscount > 0) {
      finalPrice -= categoryDiscount;
      appliedOffer = "CATEGORY";
      offerId = categoryOffer._id;
    }

    if (finalPrice < 0) finalPrice = 0;

    cartItems.push({
      ...item.toObject(),
      product_id: product,
      final_price: finalPrice,
      applied_offer: appliedOffer,
      offer_id: offerId
    });
  }

  return cartItems;
}

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user._id, }).populate("items.product_id");

    if (!cart) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Cart not found" });
    }

    const calculatedItems = await calculateCartItems(cart.items);
    const total = calculatedItems.reduce((sum, item) => sum + item.final_price * item.quantity, 0);

    res.status(STATUS_CODES.SUCCESS.OK).json({ cart: { ...cart.toObject(), items: calculatedItems }, total });
  } catch (err) {
    errorLogger.error(err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
    const product = await Product.findById(product_id).populate("category_id");

    if (!product || product.isDeleted || product.isBlocked ) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product is unavailable" });
    }

    if (!product.category_id || !product.category_id.isListed) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product's category is not listed" });
    }

    if (quantity > product.available_quantity) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Exceeds available stock" });
    }

    if (quantity > MAX_LIMIT) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Max 5 units allowed" });
    }

    const userId = req.user._id;
    if (!userId) {
      return res.status(STATUS_CODES.CLIENT_ERROR.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.product_id.toString() === product_id.toString());

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      if (newQuantity > product.available_quantity || newQuantity > MAX_LIMIT) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Quantity exceeds available stock" });
      }

      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product_id, quantity });
    }

    await cart.save();
    await Wishlist.updateOne({ user_id: userId },{ $pull: { products: product_id } });

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Cart updated successfully", cart });
  } catch (err) {
    errorLogger.error(err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({  message: "An error occurred while adding the product to the cart",});}
};

export const removeCartItem = async (req, res) => {
  const { productId } = req.params;

  try {
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product_id.toString() !== productId);
    await cart.save();

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Product removed from cart", cart });
  } catch (err) {
    errorLogger.error(err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const incrementCartItemQuantity = async (req, res) => {
  const { product_id } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product_id.toString() === product_id);

    if (itemIndex === -1) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product/item not in cart" });
    }

    const product = await Product.findById(product_id);
    const currentQuantity = cart.items[itemIndex].quantity;

    if (currentQuantity >= product.available_quantity || currentQuantity >= MAX_LIMIT) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Quantity limit reached" });
    }

    cart.items[itemIndex].quantity += 1;
    await cart.save();

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Cart item quantity incremented successfully", cart });
  } catch (err) {
    errorLogger.error(err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const decrementCartItemQuantity = async (req, res) => {
  const { product_id } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product_id.toString() === product_id);

    if (itemIndex === -1) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product/item not in cart" });
    }

    if (cart.items[itemIndex].quantity <= 1) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Min 1 unit required" });
    }

    cart.items[itemIndex].quantity -= 1;
    await cart.save();

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Cart item quantity decremented successfully", cart });
  } catch (err) {
    errorLogger.error(err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};
