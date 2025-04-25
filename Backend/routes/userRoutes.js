import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { verifyToken } from "../middleware/authMiddleware.js";

import * as userAuthController from "../controllers/user/userAuthController.js";
import * as userValidation from "../middleware/validators.js";
import * as userProductController from "../controllers/user/userProductController.js";
import * as userCategoryController from "../controllers/user/userCategoryController.js";
import googleAuthCallback from "../controllers/user/googleAuthController.js";
import * as userProfileController from "../controllers/user/userProfileController.js";
import * as userAddressController from "../controllers/user/userAddressController.js";
import { processProfileImage } from "../../middlewares/profileImageMiddleware.js";
import * as userCartController from "../controllers/user/userCartController.js";
import * as userOrderController from "../controllers/user/userOrderController.js";
import checkout from "../controllers/user/userCheckoutController.js";

import * as orderController from "../controllers/orderController.js";
import * as paymentController from "../controllers/paymentController.js";
import * as couponController from "../controllers/couponController.js";
import * as wishlistController from "../controllers/wishlistController.js";
import * as walletController from "../controllers/walletControllers.js";


const router = express.Router();

// ===================== USER AUTHENTICATION =====================
router.post("/signup", userValidation.validateUserSignup , userAuthController.userSignup);
router.post("/verify-otp", userAuthController.verifyOTP);
router.post("/resend-otp", userAuthController.resendOTP);
router.post("/login", userValidation.validateUserLogin, userAuthController.login);
router.post("/logout", userAuthController.logout);
router.post("/refresh-token", userAuthController.refreshUserToken);
router.post("/forgot-password", userValidation.validateForgotPassword, userAuthController.forgotPassword);
router.post("/reset-password", userValidation.validateResetPassword, userAuthController.resetPassword);

// ===================== USER SSO (google) AUTHENTICATION =====================
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { session: false }), googleAuthCallback);


// ===================== PRODUCT =====================
router.get("/products", userProductController.getProducts);
router.get("/products/:id", userProductController.getProductById);

// ===================== CATEGORY =====================
router.get("/categories", verifyToken, userCategoryController.getCategoriesUser);
router.get("/categories/:id", verifyToken, userCategoryController.getBooksByCategory);

// ===================== PROFILE =====================
router.get("/profile", verifyToken, userProfileController.getUserProfile);
router.put("/profile", verifyToken, userValidation.validateProfileUpdate, processProfileImage, userProfileController.updateUserProfile);
router.put("/change-password", verifyToken, userValidation.validateChangePassword, userProfileController.changeUserPassword);
router.post("/request-email-change", verifyToken, userValidation.validateEmailChangeRequest, userProfileController.requestEmailChange);
router.post("/confirm-email-change", verifyToken, userValidation.validateConfirmEmailChange, userProfileController.confirmEmailChange);

// ===================== ADDRESS =====================
router.post("/addresses", verifyToken, userValidation.validateAddAddress, userAddressController.addAddress);
router.put("/addresses/:id", verifyToken, userValidation.validateUpdateAddress, userAddressController.updateAddress);
router.delete("/addresses/:id", verifyToken, userAddressController.deleteAddress);
router.get("/addresses", verifyToken, userAddressController.getAllUserAddresses);
router.put("/addresses/default/:id", verifyToken, userAddressController.setDefaultAddress);

// ===================== CART =====================
router.get("/", verifyToken, userCartController.getCart);
router.post("/add", verifyToken, userCartController.addToCart);
router.patch("/update", verifyToken, userCartController.updateCartItemQuantity);
router.patch("/increment", verifyToken, userCartController.incrementCartItemQuantity);
router.patch("/decrement", verifyToken, userCartController.decrementCartItemQuantity);
router.delete("/remove/:product_id", verifyToken, userCartController.removeCartItem);

// ===================== CHECKOUT =====================
router.post("/checkout", verifyToken, userValidation.validateCheckout, checkout);

// ===================== ORDERS =====================
router.post("/orders", verifyToken, userOrderController.placeOrder);
router.get("/orders", verifyToken, userOrderController.getUserOrders);
router.get("/orders/:id", verifyToken, userOrderController.getOrderDetails);
router.put("/orders/cancel", verifyToken, userOrderController.cancelOrderOrItem);
router.put("/orders/return", verifyToken, userOrderController.returnOrderItem);
router.get("/orders/invoice/:id", verifyToken, userOrderController.downloadInvoice);


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
