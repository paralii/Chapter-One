import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  userSignup,
  verifyOTP,
  forgotPassword,
  resetPassword,
  resendOTP,
} from "../controllers/userController.js";
import {
  validateForgotPassword,
  validateResetPassword,
  validateUserLogin,
  validateUserSignup,
} from "../middleware/validators.js";
import * as productController from "../controllers/productController.js";
import * as categoryController from "../controllers/categoryController.js";
import * as addressController from "../controllers/addressController.js";
import * as cartController from "../controllers/cartController.js";
import * as orderController from "../controllers/orderController.js";
import * as profileController from "../controllers/profileController.js";
import * as paymentController from "../controllers/paymentController.js";
import * as couponController from "../controllers/couponController.js";
import * as wishlistController from "../controllers/wishlistController.js";
import * as walletController from "../controllers/walletControllers.js";
import {
  login,
  logout,
  refreshAccessToken,
} from "../controllers/authController.js";
import { googleAuthCallback } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/signup", validateUserSignup, userSignup);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", validateUserLogin, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  googleAuthCallback
);

router.get("/profile", verifyToken, profileController.getProfile);
router.put("/profile", verifyToken, profileController.updateProfile);
router.put("/change-password", verifyToken, profileController.changePassword);
router.post(
  "/request-email-change",
  verifyToken,
  profileController.requestEmailChange
);
router.post(
  "/confirm-email-change",
  verifyToken,
  profileController.confirmEmailChange
);

router.get("/products", productController.getProducts);
router.get("/products/:id", productController.getProductById);

router.get("/categories", verifyToken, categoryController.getCategories);

router.get("/addresses", verifyToken, addressController.getAddresses);
router.post("/addresses", verifyToken, addressController.addAddress);
router.put("/addresses/:id", verifyToken, addressController.updateAddress);
router.delete("/addresses/:id", verifyToken, addressController.deleteAddress);
router.put(
  "/addresses/:id/default",
  verifyToken,
  addressController.setDefaultAddress
);

router.post("/cart", verifyToken, cartController.addToCart);
router.get("/cart", verifyToken, cartController.getCart);
router.patch("/cart", verifyToken, cartController.updateCartItemQuantity);
router.delete("/cart/:product_id", verifyToken, cartController.removeCartItem);

router.post("/orders", verifyToken, orderController.createOrder);
router.post("/place-order-cod", verifyToken, orderController.placeOrderCOD);
router.get("/orders", verifyToken, orderController.listOrders);
router.get("/orders/:orderID", verifyToken, orderController.getOrderDetails);
router.put("/orders/:orderID/cancel", verifyToken, orderController.cancelOrder);
router.put(
  "/orders/:orderID/cancel-product",
  verifyToken,
  orderController.cancelOrderProduct
);
router.put("/orders/:orderID/return", verifyToken, orderController.returnOrder);
router.get(
  "/orders/:orderID/invoice",
  verifyToken,
  orderController.downloadInvoice
);
router.post(
  "/create-order",
  verifyToken,
  paymentController.createRazorpayOrder
);
router.post(
  "/verify-payment",
  verifyToken,
  paymentController.verifyPaymentSignature
);

router.post("/apply", verifyToken, couponController.applyCoupon);
router.post("/remove", verifyToken, couponController.removeCoupon);
router.get("/list", verifyToken, couponController.listCoupons);

router.get("/wishlist", verifyToken, wishlistController.getWishlist);
router.post("/wishlist", verifyToken, wishlistController.addToWishlist);
router.delete(
  "/wishlist/:product_id",
  verifyToken,
  wishlistController.removeFromWishlist
);

router.get("/wallet", verifyToken, walletController.getWallet);

export default router;
