import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (type = "user") => async (req, res, next) => {
  const tokenName = type === "admin" ? "accessToken_admin" : "accessToken_user";
  const token =
    req.cookies[tokenName] || req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (type === "admin") {
      const Admin = (await import("../models/Admin.js")).default;
      const admin = await Admin.findById(decoded.id);
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ message: "Unauthorized admin" });
      }
      req.user = admin;
    } else {
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }
      if (user.isBlock) {
        console.log("User account is blocked");
        return res.status(403).json({ message: "Blocked account" });
      }
      req.user = user;
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
      console.log("Admin access required");
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};
