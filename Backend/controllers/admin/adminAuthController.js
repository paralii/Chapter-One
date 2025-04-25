import Admin from "../../models/Admin.js";
import bcrypt from "bcryptjs";
import { generateTokens, refreshAccessToken } from "../../utils/auth/generateTokens.js";
import setAuthCookies from "../../utils/setAuthCookies.js";

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = password.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  
  try {
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin || !admin.isAdmin) {
      return res.status(400).json({ message: "Admin with this email does not exist or is not an admin" });
    }

    const isMatch = await bcrypt.compare(normalizedPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password, please try again" });
    }

    const { accessToken, refreshToken } = generateTokens(admin, true);

    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({ admin, message: "Admin login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminLogout = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Admin logged out successfully" });
};

export const refreshAdminToken = (req, res) => refreshAccessToken(req, res, "admin");
