// Example: routes/adminRoutes.js
import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public admin login route
router.post("/login", adminLogin);

// Example of a protected route
router.get("/dashboard", protectAdmin, (req, res) => {
  res.status(200).json({ message: "Welcome to the admin dashboard" });
});

export default router;
