import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { generateTokens, refreshAccessToken } from '../../utils/auth/generateTokens.js';
import setAuthCookies from '../../utils/setAuthCookies.js';
import { sendOTPEmail, resendOtpForVerifyEmail, sendForgotPasswordOTP } from '../../utils/services/emailService.js';
import Wallet from '../../models/Wallet.js';
import Cart from '../../models/Cart.js';
import Wishlist from '../../models/Wishlist.js';
import STATUS_CODES from '../../utils/constants/statusCodes.js';
import { generateOTP, storeOtpInRedis, getOtpFromRedis, deleteOtpFromRedis } from '../../utils/services/otpService.js';
import { creditWallet } from './userWalletController.js';
import { logger, errorLogger } from '../../utils/logger.js';
import { ensureUserOnboarding } from '../../utils/services/userOnboardingService.js';

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = password.trim();

  if (!email || !password) {
    return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ 
      message: 'Email and password are required' 
    });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      logger.warn(`Login attempt failed: User with email ${normalizedEmail} does not exist`);
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ 
        message: 'User with this email does not exist' 
      });
    }
    
    if (!user.isVerified) {
      return res.status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN).json({ 
        message: 'Please verify your email first' 
      });
    }

    if (user.isBlock) {
      return res.status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN).json({ 
        message: 'Your account is blocked' 
      });
    }

    const isMatch = await bcrypt.compare(normalizedPassword, user.password);
    if (!isMatch) {
      logger.warn(`Login attempt failed: Incorrect password for user ${normalizedEmail}`);
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ 
        message: 'Incorrect password, please try again' 
      });
    }

    const { accessToken, refreshToken } = generateTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, 'user');
    logger.info(`User ${user.email} logged in successfully`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ user, message: 'Login successful' });
  } catch (err) {
    errorLogger.error('User login error', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("accessToken_user");
    res.clearCookie("refreshToken_user");

    logger.info(`User logged out successfully`);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error("Logout failed", err);
    res.status(500).json({ error: "Logout failed" });
  }
};


export const refreshUserToken = (req, res) => refreshAccessToken(req, res, 'user');

export const userSignup = async (req, res) => {
  const { firstname, lastname, email, password, referral_code } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ 
        message: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let referred_by = null;
    if (referral_code && referral_code.trim()) {
      const referrer = await User.findOne({ referral_code: referral_code.trim().toUpperCase() });
      if (!referrer) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ 
          message: 'Invalid referral code' 
        });
      }
      referred_by = referrer._id;
    }

    const otp = generateOTP();
    await storeOtpInRedis(`signup:${normalizedEmail}`, JSON.stringify({
      otp,
      firstname,
      lastname,
      hashedPassword,
      referred_by
    }));

    await sendOTPEmail(normalizedEmail, otp);
    console.log('SignUp OTP:', otp);

    logger.info(`OTP sent to ${normalizedEmail} for signup`);
    res.status(STATUS_CODES.SUCCESS.CREATED).json({ 
      message: 'OTP sent to email', 
      email: normalizedEmail 
    });
  } catch (err) {
    errorLogger.error('User signup error', {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const otpData = await getOtpFromRedis(`signup:${normalizedEmail}`);
    if (!otpData) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "OTP expired or invalid" });
    }

    const parsedData = JSON.parse(otpData);

    if (parsedData.otp !== otp) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid OTP" });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User already verified" });
    }

    if (!user) {
      user = new User({
        firstname: parsedData.firstname,
        lastname: parsedData.lastname,
        email: normalizedEmail,
        password: parsedData.hashedPassword,
        isVerified: true,
        referred_by: parsedData.referred_by || null
      });

      await user.save();

      await ensureUserOnboarding(user, {
        referred_by: parsedData.referred_by,
        firstNameForMessage: parsedData.firstname,
      });
    } else {
      user.isVerified = true;
      await user.save();

      // Ensure existing users also have wallet/cart/wishlist
      await ensureUserOnboarding(user);
    }

    await deleteOtpFromRedis(`signup:${normalizedEmail}`);

    const { accessToken, refreshToken } = generateTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, "user");

    logger.info(`User ${user.email} verified and signed up successfully`);
    res.status(STATUS_CODES.SUCCESS.OK).json({
      message: "OTP verified, account created successfully",
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });
  } catch (err) {
    errorLogger.error("User OTP verification error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export const resendOtpForVerify = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const otpData = await getOtpFromRedis(`signup:${normalizedEmail}`);
    if (!otpData) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "No signup session found for this email" });
    }

    const parsed = JSON.parse(otpData);

    const otp = generateOTP();
    parsed.otp = otp;

    await storeOtpInRedis(`signup:${normalizedEmail}`, JSON.stringify(parsed));

    await resendOtpForVerifyEmail(normalizedEmail, otp);
    console.log("Resend OTP:", otp);

    logger.info(`OTP resent to ${normalizedEmail} for verification`);
    return res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP resent successfully" });
  } catch (err) {
    errorLogger.error("User resend OTP error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const otpData = await getOtpFromRedis(`signup:${normalizedEmail}`);

    if (!otpData) {
      return res.status(400).json({ message: "No signup session found for this email" });
    }

    const parsed = JSON.parse(otpData);
    const otp = generateOTP();

    parsed.otp = otp;
    await storeOtpInRedis(`signup:${normalizedEmail}`, JSON.stringify(parsed));

    await resendOtpForVerifyEmail(email, otp);
    console.log("resend OTP:", otp);

    logger.info(`OTP resent to ${normalizedEmail} for signup`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP resent successfully" });
  } catch (err) {
    errorLogger.error("User resend OTP error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP sent to email for password reset" });
    }    
    const otp = generateOTP();
    await storeOtpInRedis(`forgot:${normalizedEmail}`,otp);

    await sendForgotPasswordOTP(normalizedEmail, otp);
    console.log("forgotPassword OTP:", otp);

    logger.info(`Forgot password OTP sent to ${normalizedEmail}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP sent to email for password reset", email: normalizedEmail });
  } catch (err) {
    errorLogger.error("User forgot password error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const storedOtp = await getOtpFromRedis(`forgot:${normalizedEmail}`);
    
    if (!storedOtp || storedOtp !== otp) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User not found" });
    }

    await deleteOtpFromRedis(`forgot:${normalizedEmail}`);

    const resetToken = jwt.sign(
      { email: normalizedEmail },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    logger.info(`Forgot password OTP verified for ${normalizedEmail}`);
    return res.status(STATUS_CODES.SUCCESS.OK).json({
      message: "OTP verified, proceed to reset password",
      resetToken
    });
  } catch (err) {
    errorLogger.error("User verify forgot password OTP error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    console.error("Verify Forgot Password OTP error:", err.message);
    return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export const resendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User not found" });
    }

    const otp = generateOTP();
    await storeOtpInRedis(`forgot:${normalizedEmail}`, otp);

    await sendForgotPasswordOTP(normalizedEmail, otp);
    console.log("Resend Forgot Password OTP:", otp);

    logger.info(`Forgot password OTP resent to ${normalizedEmail}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP resent for password reset" });
  } catch (err) {
    errorLogger.error("User resend forgot password OTP error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    console.error("Resend Forgot Password OTP error:", err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
const { token, newPassword } = req.body;
console.log("Reset Password Request:", { token, newPassword });
try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const normalizedEmail = decoded.email.toLowerCase(); 
    console.log("Decoded email:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User not found" });

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "New password cannot be the same as the old password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    logger.info(`Password reset successfully for user ${normalizedEmail}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Password has been reset successfully" });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      errorLogger.error("Invalid token for password reset", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      console.error("Invalid token for password reset:", err.message);
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      errorLogger.error("Token expired for password reset", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      console.error("Token expired for password reset:", err.message);
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Token expired" });
    }
    errorLogger.error("Error resetting password", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "OTP expired" });
    }
};
