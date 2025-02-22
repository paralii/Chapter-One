//userRoutes.js
import express from "express";
import { getUsers, blockUser, unblockUser } from "../controllers/userController.js";

const router = express.Router();

// GET: List users with search and pagination
router.get("/", getUsers);

// PATCH: Block a user by ID
router.patch("/:id/block", blockUser);

// PATCH: Unblock a user by ID
router.patch("/:id/unblock", unblockUser);

export default router;
