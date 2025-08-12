import express from "express";
import passport from "passport";

import * as userAuthController from "../controllers/user/userAuthController.js";
import * as userProductController from "../controllers/user/userProductController.js";
import * as userCategoryController from "../controllers/user/userCategoryController.js";
import googleAuthCallback from "../controllers/user/googleAuthController.js";
import * as userProfileController from "../controllers/user/userProfileController.js";
import * as userAddressController from "../controllers/user/userAddressController.js";
import * as userCartController from "../controllers/user/userCartController.js";
import * as userOrderController from "../controllers/user/userOrderController.js";
import * as paymentController from "../controllers/user/paymentController.js";
import checkout from "../controllers/user/userCheckoutController.js";
import * as userCouponController from "../controllers/user/userCouponController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import * as userValidation from "../middlewares/validators.js";
import { uploadProfileImage } from "../middlewares/profileImageMiddleware.js";
import * as userWishlistController from "../controllers/user/userWishlistController.js";
import * as userWalletController from "../controllers/user/userWalletController.js";
import * as userOfferController from "../controllers/user/userOfferController.js";

const router = express.Router();

// ===================== USER AUTHENTICATION =====================
router.post("/auth/signup", userValidation.validateUserSignup , userAuthController.userSignup);
router.post("/auth/verify-otp", userAuthController.verifyOTP);
router.post("/auth/resend-otp-verify", userAuthController.resendOtpForVerify);
router.post("/auth/login", userValidation.validateUserLogin, userAuthController.login);
router.post("/auth/logout", userAuthController.logout);
router.post("/auth/refresh-token", userAuthController.refreshUserToken);
router.post("/auth/forgot-password", userValidation.validateForgotPassword, userAuthController.forgotPassword);
router.post("/auth/verify-forgot-password-otp", userAuthController.verifyForgotPasswordOTP);
router.post("/auth/resend-forgot-password-otp", userAuthController.resendForgotPasswordOTP);
router.post("/auth/reset-password", userValidation.validateResetPassword, userAuthController.resetPassword);

// ===================== USER SSO (google) AUTHENTICATION =====================
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { session: false }), googleAuthCallback);
router.get("/auth/me", verifyToken, (req, res) => {
    const { _id, firstname, lastname, email, profileImage, isVerified } = req.user;
    res.status(200).json({ _id, firstname, lastname, email, profileImage, isVerified });
  });

// ===================== PRODUCT =====================
router.get("/products", userProductController.getProducts);
router.get("/products/:id", userProductController.getProductById);

// ===================== CATEGORY =====================
router.get("/categories",  userCategoryController.getCategoriesUser);
router.get("/categories/:id",  userCategoryController.getBooksByCategory);

// ===================== PROFILE =====================
router.get("/profile", verifyToken("user"), userProfileController.getUserProfile);
router.put("/profile", verifyToken("user"), userValidation.validateProfileUpdate, userProfileController.updateUserProfile);
router.put("/profile/password", verifyToken("user"), userProfileController.changeUserPassword);
router.put("/profile/image", verifyToken("user"), uploadProfileImage, userProfileController.uploadProfileImage);
router.post("/profile/email/request", verifyToken("user"), userValidation.validateEmailChangeRequest, userProfileController.requestEmailChange);
router.post("/profile/email/resend-otp", userAuthController.resendOTP);
router.post("/profile/email/confirm", verifyToken("user"), userValidation.validateConfirmEmailChange, userProfileController.confirmEmailChange);

// ===================== ADDRESS =====================
router.post("/addresses", verifyToken("user"), userValidation.validateAddress, userAddressController.addAddress);
router.put("/addresses/:id", verifyToken("user"), userValidation.validateUpdateAddress, userAddressController.updateAddress);
router.delete("/addresses/:id", verifyToken("user"), userAddressController.deleteAddress);
router.get("/addresses", verifyToken("user"), userAddressController.getAllUserAddresses);
router.put("/addresses/:id/default", verifyToken("user"), userAddressController.setDefaultAddress);
router.get("/addresses/:id", verifyToken("user"), userAddressController.getAddressById);
router.get('/addresses/default', verifyToken('user'), userAddressController.getDefaultAddress);

// ===================== CART =====================
router.get("/cart", verifyToken("user"), userCartController.getCart);
router.post("/cart/add", verifyToken("user"), userCartController.addToCart);
router.patch("/cart/increment", verifyToken("user"), userCartController.incrementCartItemQuantity);
router.patch("/cart/decrement", verifyToken("user"), userCartController.decrementCartItemQuantity);
router.delete("/cart/:productId/remove", verifyToken("user"), userCartController.removeCartItem);

// ===================== CHECKOUT =====================
router.post("/checkout", verifyToken("user"), userValidation.validateCheckout, checkout);

// ===================== ORDERS =====================
router.get("/orders", verifyToken("user"), userOrderController.getUserOrders);
router.post("/orders/temp", verifyToken("user"), userOrderController.createTempOrder);
router.post("/orders", verifyToken("user"), userOrderController.placeOrder);
router.get("/orders/status/pending", verifyToken("user"), userOrderController.getPendingOrder);
router.get("/orders/:id", verifyToken("user"), userOrderController.getOrderDetails);
router.put("/orders/cancel", verifyToken("user"), userOrderController.cancelOrderOrItem);
router.put("/orders/return", verifyToken("user"), userOrderController.returnOrderItem);
router.get("/orders/:id/invoice", verifyToken("user"), userOrderController.downloadInvoice);

// ===================== RAZORPAY =====================
router.post("/payment/create-order", verifyToken("user"), paymentController.createRazorpayOrder);
router.post("/payment/verify", verifyToken("user"), paymentController.verifyPayment);

// ===================== COUPON ===================== 
router.get("/coupons", verifyToken("user"), userCouponController.getAvailableCoupons);
router.post("/coupons/apply", verifyToken("user"), userCouponController.applyCoupon);
router.post("/coupons/remove", verifyToken("user"), userCouponController.removeCoupon);

// ===================== WISHLIST ===================== 
router.get("/wishlist", verifyToken("user"), userWishlistController.getWishlist);
router.post("/wishlist/add/:productId", verifyToken("user"), userWishlistController.addToWishlist);
router.post("/wishlist/remove/:productId", verifyToken("user"), userWishlistController.removeFromWishlist);
router.post("/wishlist/move-to-cart/:productId", verifyToken("user"), userWishlistController.moveToCart);

// ===================== OFFERS =====================
router.get("/offers", userOfferController.getActiveOffers);
router.post("/offers/referral/apply", userOfferController.applyReferralOffer);
router.get("/offers/referral", verifyToken("user"), userOfferController.getReferralOffer);
router.get("/offers/referral/coupons", verifyToken("user"), userOfferController.getReferralCoupons);
router.get("/offers/referral/stats", verifyToken("user"), userOfferController.getReferralStats);

// ===================== WALLET =====================
router.get("/wallet/details", verifyToken("user"), userWalletController.getWalletDetails);
router.post("/wallet/credit", verifyToken("user"), userWalletController.creditWallet);
router.post("/wallet/debit", verifyToken("user"), userWalletController.debitWallet);
router.get("/wallet/balance", verifyToken("user"), userWalletController.checkWalletBalance);
router.post("/wallet/integrity-check", verifyToken("user"), userWalletController.ensureWalletIntegrity);


export default router;
