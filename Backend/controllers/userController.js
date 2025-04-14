import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP } from "../utils/otpGenerator.js";
import { sendOTPEmail, sendResetPasswordEmail } from "../utils/emailService.js";

export const userSignup = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists " });
    }

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

    res
      .status(200)
      .json({ message: "OTP verified, account created successfully" });
  } catch (err) {
    return res.status(400).json({ message: "OTP expired or invalid" });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = generateOTP();
    const otpToken = jwt.sign({ email, otp }, process.env.JWT_SECRET, {
      expiresIn: "2m",
    });

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
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = generateOTP();
    const otpToken = jwt.sign({ email, otp }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });

    console.log("forgotPassword OTP:", otp);
    await sendOTPEmail(email, otp);

    res
      .status(200)
      .json({ message: "OTP sent to email for password reset", otpToken });
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
    return res.status(400).json({ message: "OTP expired or invalid" });
  }
};

export const softDeleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeleted = true;
    await user.save();

    res.status(200).json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
