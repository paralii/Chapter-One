import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Admin from "../../models/Admin.js";
import STATUS_CODES from "../constants/statusCodes.js";

dotenv.config();

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

export const refreshAccessToken = async (req, res, type = "user") => {
  const refreshCookieName = `refreshToken_${type}`;
  const accessCookieName = `accessToken_${type}`;
  const refreshToken = req.cookies[refreshCookieName];

  if (!refreshToken) {
    return res.status(STATUS_CODES.CLIENT_ERROR.UNAUTHORIZED).json({ message: "No refresh token provided" });
  }

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    async (err, decoded) => {
      if (err) {
        return res.status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN).json({ message: "Invalid refresh token" });
      }

      let entity;
      if (type === "admin") {
        entity = await Admin.findById(decoded.id);
        if (!entity || !entity.isAdmin) {
          return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Admin not found" });
        }
      } else {
        entity = await User.findById(decoded.id);
        if (!entity) {
          return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "User not found" });
        }
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        entity,
        type === "admin"
      );

      res.cookie(accessCookieName, accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      res.cookie(refreshCookieName, newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log(`New ${type} access token generated`);
      res.status(STATUS_CODES.SUCCESS.OK).json({ accessToken, message: "Token refreshed" });
    }
  );
};
