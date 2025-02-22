//userRoutes.js
import express from "express";
import passport from "passport";
import { getUsers, blockUser, unblockUser, sendOTP, verifyOTP, forgotPassword, resetPassword } from "../controllers/userController.js";

const router = express.Router();

// Existing routes for user management
router.get("/", getUsers);
router.patch("/:id/block", blockUser);
router.patch("/:id/unblock", unblockUser);

// OTP endpoints
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);


// Google Auth routes
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  
  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect or send token
      res.redirect("/"); // Adjust redirection as needed
    }
  );

  // Forgot Password endpoints
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
