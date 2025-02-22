//userController.js
import User from "../models/User.js";
import crypto from "crypto";

// GET /api/users?search=...&page=...&limit=...
export const getUsers = async (req, res) => {
  try {
    // Get query parameters; default page=1, limit=10
    const { search = "", page = 1, limit = 10 } = req.query;
    
    // Build search query: filter by email using regex for case-insensitive search
    const query = { email: { $regex: search, $options: "i" } };

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // Find users with pagination and sort descending by creation date
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ users, totalCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/:id/block
export const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User blocked successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/:id/unblock
export const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User unblocked successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// In-memory store for OTPs (keyed by email)
const otpStore = {};

// Utility function to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/users/send-otp
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const otp = generateOTP();
    const expiry = Date.now() + 120 * 1000; // OTP valid for 120 seconds

    // Store OTP and expiry
    otpStore[email] = { otp, expiry };

    // For demo: log the OTP. Replace this with an email sending logic (e.g., using nodemailer)
    console.log(`OTP for ${email}: ${otp}`);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const record = otpStore[email];
    if (!record) {
      return res.status(400).json({ message: "No OTP found for this email" });
    }
    // Check if OTP is expired
    if (Date.now() > record.expiry) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP has expired" });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    // OTP is valid; remove it from store
    delete otpStore[email];
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // Set token expiry (15 minutes from now)
    const tokenExpiry = Date.now() + 15 * 60 * 1000;

    // Save token and expiry in the user's document (adjust your User model accordingly or use a separate collection)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Send the reset link via email (here, we simply log the link)
    const resetLink = `http://your-frontend-url/reset-password/${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);

    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // Find user by token and ensure token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Update password (hash it using bcrypt)
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};