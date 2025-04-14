import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Admin from "../../models/Admin.js";

dotenv.config();

// Generate access tokens
export const generateTokens = (user, isAdmin = false) => {
  const accessToken = jwt.sign(
    { id: user._id, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { id: user._id, isAdmin },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Refresh access token
export const refreshAccessToken = async (req, res, type = "user") => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      let entity;
      if (type === "admin") {
        entity = await Admin.findById(decoded.id);
        if (!entity || !entity.isAdmin) {
          return res.status(404).json({ message: "Admin not found" });
        }
      } else {
        entity = await User.findById(decoded.id);
        if (!entity) {
          return res.status(404).json({ message: "User not found" });
        }
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        entity,
        type === "admin"
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken, message: "Token refreshed" });
    }
  );
};
