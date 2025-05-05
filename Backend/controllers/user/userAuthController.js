import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateTokens, refreshAccessToken } from "../../utils/auth/generateTokens.js";
import setAuthCookies from "../../utils/setAuthCookies.js";
import { generateOTP } from "../../utils/services/otpGenerator.js";
import { sendOTPEmail } from "../../utils/services/emailService.js";
import { validationResult } from "express-validator"; 

dotenv.config();

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = password.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "User with this email does not exist" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    if (user.isBlock) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    const isMatch = await bcrypt.compare(normalizedPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password, please try again" });
    }

    const { accessToken, refreshToken } = generateTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, "user");
    res.status(200).json({ user, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken_user");
  res.clearCookie("refreshToken_user");
  res.status(200).json({ message: "Logged out successfully" });
};

export const refreshUserToken = (req, res) => refreshAccessToken(req, res, "user");

export const userSignup = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const otpToken = jwt.sign(
      { firstname, lastname, email, password: hashedPassword, otp },
      process.env.JWT_SECRET,
      { expiresIn: "2m" }
    );

    console.log("SignUp OTP:", otp);
    await sendOTPEmail(email, otp);

    res.status(201).json({ message: "OTP sent to email", otpToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { otp, otpToken } = req.body;
  try {
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);

    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    let user = await User.findOne({ email: decoded.email });

    if (decoded.from === "forgot-password") {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      return res.status(200).json({
        message: "OTP verified successfully",
        resetToken,
      });
    }

    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (!user) {
      user = new User({
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        email: decoded.email,
        password: decoded.password,
        isVerified: true,
      });
    } else {
      user.isVerified = true;
    }

    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "OTP verified, account created successfully",
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
      token,
    });

  } catch (err) {
    return res.status(400).json({ message: "OTP expired or invalid" });
  }
};

export const resendOtpForVerify = async (req, res) => {
  const { otpToken } = req.body;
  if (!otpToken) return res.status(400).json({ message: "Missing OTP token" });

  try {
    const payload = jwt.verify(otpToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    const { firstname, lastname, email, password } = payload;

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const newOtp = generateOTP();
    console.log("Resend OTP:", newOtp);
    const newOtpToken = jwt.sign(
      { firstname, lastname, email, password, otp: newOtp },
      process.env.JWT_SECRET,
      { expiresIn: "2m" } 
    );

    await sendOTPEmail(email, newOtp);

    res.status(200).json({ message: "OTP resent successfully", otpToken: newOtpToken });
  } catch (error) {
    console.error("Resend OTP failed:", error.message);
    return res.status(400).json({ message: "Invalid or expired OTP token" });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = generateOTP();
    const otpToken = jwt.sign({ email, otp }, process.env.JWT_SECRET, { expiresIn: "2m" });

    console.log("resend OTP:", otp);
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP resent successfully", otpToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "OTP sent to email for password reset" });
    }    
    const otp = generateOTP();
    const otpToken = jwt.sign({ email, otp, from: "forgot-password" }, process.env.JWT_SECRET, { expiresIn: "5m" });

    console.log("forgotPassword OTP:", otp);
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent to email for password reset", otpToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  const { otp, otpToken } = req.body;

  try {
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const resetToken = jwt.sign({ email: decoded.email, otp: decoded.otp, from: "forgot-password" }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: "OTP verified, proceed to reset password", resetToken });
  } catch (err) {
    return res.status(400).json({ message: "OTP expired or invalid" });
  }
};

export const resendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpToken = jwt.sign(
      { email, otp, from: "forgot-password" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    console.log("Resend ForgotPassword OTP:", otp);
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP resent for password reset", otpToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { otp, otpToken, newPassword } = req.body;
  try {
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(400).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "OTP expired" });
    }
    
    return res.status(400).json({ message: "OTP expired or invalid" });
  }

};
