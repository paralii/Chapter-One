import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cloudinary from "../../config/cloudinary.js";
import { sendOTPEmail } from "../../utils/services/emailService.js";
import { generateOTP } from "../../utils/services/otpGenerator.js";

dotenv.config();

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user)
      .select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile details (excluding email)
export const updateUserProfile = async (req, res) => {
  try {
    const { firstname, lastname } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      { firstname, lastname },
      { new: true }
    ).select("-password");

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change password
export const changeUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch)
      return res.status(400).json({ message: "Incorrect old password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload/Update profile image
// controllers/userProfileController.js

export const uploadProfileImage = async (req, res) => {
  if (!req.file || !req.file.path)
    return res.status(400).json({ message: "No image file uploaded" });

  try {
    const user = await User.findByIdAndUpdate(
      req.user,
      { profileImage: req.file.path },
      { new: true }
    ).select("-password");

    res.status(200).json({ message: "Profile image updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Request email change
export const requestEmailChange = async (req, res) => {
  const { newEmail } = req.body;
  try {
    const otp = generateOTP();
    console.log("Generated OTP:", otp);
    
    const emailChangeToken = jwt.sign(
      { newEmail, otp, userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    await sendOTPEmail(newEmail, otp);
    res.status(200).json({ message: "OTP sent", emailChangeToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Confirm email change
export const confirmEmailChange = async (req, res) => {
  const { otp, emailChangeToken } = req.body;
  try {
    const decoded = jwt.verify(emailChangeToken, process.env.JWT_SECRET);

    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { email: decoded.newEmail.toLowerCase().trim() },
      { new: true }
    ).select("-password");
    res.status(200).json({ message: "Email updated", user });
  } catch (err) {
    res.status(400).json({ message: "OTP expired or invalid" });
  }
};
