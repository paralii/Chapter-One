//userController.js
import User from "../models/User.js";

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
