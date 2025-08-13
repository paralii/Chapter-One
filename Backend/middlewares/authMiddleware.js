import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import STATUS_CODES from "../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../utils/logger.js";


export const verifyToken = (type = "user") => async (req, res, next) => {
  const tokenName = type === "admin" ? "accessToken_admin" : "accessToken_user";
  const token = req.cookies[tokenName] || req.headers.authorization?.split(" ")[1];

  if (!token) {
    logger.warn(`Unauthorized: No token provided for ${type}`);
    return res
      .status(STATUS_CODES.CLIENT_ERROR.UNAUTHORIZED)
      .json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (type === "admin") {
      const admin = await Admin.findById(decoded.id);

      if (!admin || !admin.isAdmin) {
        logger.warn("Unauthorized admin access attempt");
        return res
          .status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN)
          .json({ message: "Unauthorized admin" });
      }
      req.user = admin;
    } else {
      const user = await User.findById(decoded.id);

      if (!user) {
        logger.warn("Unauthorized: User not found");
        return res
          .status(STATUS_CODES.CLIENT_ERROR.UNAUTHORIZED)
          .json({ message: "Unauthorized: User not found" });
      }

      if (user.isBlock) {
        logger.warn(`Blocked account: ${user._id}`);
        return res
          .status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN)
          .json({ message: "Blocked account" });
      }

      req.user = user;
    }

    next();
  } catch (err) {
    errorLogger.error("Token verification failed", err);
    return res
      .status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN)
      .json({ message: "Forbidden: Invalid or expired token" });
  }
};

// Middleware to ensure the user is an admin.
export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    logger.warn("Admin access required");
    return res
      .status(STATUS_CODES.CLIENT_ERROR.FORBIDDEN)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};