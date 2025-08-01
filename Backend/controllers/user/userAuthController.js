import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateTokens, refreshAccessToken } from "../../utils/auth/generateTokens.js";
import setAuthCookies from "../../utils/setAuthCookies.js";
import { sendOTPEmail, resendOtpForVerifyEmail, sendForgotPasswordOTP } from "../../utils/services/emailService.js";
import Wallet from "../../models/Wallet.js";
import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { generateOTP, storeOtpInRedis, getOtpFromRedis, deleteOtpFromRedis } from "../../utils/services/otpService.js";
import { creditWallet } from "./userWalletController.js";



export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = password.trim();

  if (!email || !password) {
    return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
       console.log(`Login attempt failed: User not found for email ${normalizedEmail}`);
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User with this email does not exist" });
}
    if (!user.isVerified) {
      return res.status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN).json({ message: "Please verify your email first" });
    }

    if (user.isBlock) {
      return res.status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN).json({ message: "Your account is blocked" });
    }

    const isMatch = await bcrypt.compare(normalizedPassword, user.password);
    if (!isMatch) {
        console.log(`Login attempt failed: Incorrect password for email ${normalizedEmail}`);
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Incorrect password, please try again" });
    }

    const { accessToken, refreshToken } = generateTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, "user");
    res.status(STATUS_CODES.SUCCESS.OK).json({ user, message: "Login successful" });
  } catch (err) {
    console.error(`Login error for ${normalizedEmail}:`, err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken_user");
  res.clearCookie("refreshToken_user");
  res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Logged out successfully" });
};

export const refreshUserToken = (req, res) => refreshAccessToken(req, res, "user");

export const userSignup = async (req, res) => {
  const { firstname, lastname, email, password, referral_code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email : normalizedEmail });
    if (user) return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let referred_by = null;
    if (referral_code && referral_code.trim()) {
      const referrer = await User.findOne({ referral_code: referral_code.trim().toUpperCase() });
      if (!referrer) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid referral code" });
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
    console.log("SignUp OTP:", otp);

    res.status(STATUS_CODES.SUCCESS.CREATED).json({ message: "OTP sent to email", email: normalizedEmail });
  } catch (err) {
   console.error("Signup error:", err.message);
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
      
      const ops = [
        Wallet.create({ user_id: user._id, balance: 0 }),
        Cart.create({ user_id: user._id, items: [] }),
        Wishlist.create({ user_id: user._id, products: [] })
      ];

      if (parsedData.referred_by) {
        ops.push(
          creditWallet(user._id, 50, "Referral bonus for signing up"),
          creditWallet(parsedData.referred_by, 100, `Referral reward for inviting ${parsedData.firstname}`)
        );
      }  
        await Promise.all(ops);

    } else {
      user.isVerified = true;
      await user.save();
    }

    await deleteOtpFromRedis(`signup:${normalizedEmail}`);

    const { accessToken, refreshToken } = generateTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, "user");

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
    console.error("Verify OTP error:", err.message);
    return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export const resendOtpForVerify = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    await storeOtpInRedis(`signup:${normalizedEmail}`, JSON.stringify({ otp }));

    await resendOtpForVerifyEmail(normalizedEmail, otp);
    console.log("Resend OTP:", otp);

    return res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP failed:", err.message);
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

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP resent successfully" });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
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

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP sent to email for password reset", email: normalizedEmail });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
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

    return res.status(STATUS_CODES.SUCCESS.OK).json({
      message: "OTP verified, proceed to reset password",
      resetToken
    });
  } catch (err) {
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

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP resent for password reset" });
  } catch (err) {
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


    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Password has been reset successfully" });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "OTP expired" });
    }
    
    return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "OTP expired or invalid" });
  }

};
