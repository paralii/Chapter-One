import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { generateTokens, refreshAccessToken } from "../utils/generateTokens.js";
import setAuthCookies from "../utils/setAuthCookies.js";

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

    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({ user, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

export const refreshUserToken = (req, res) => refreshAccessToken(req, res, "user");
