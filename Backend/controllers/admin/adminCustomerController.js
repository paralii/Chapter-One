import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { validateUserInput } from "../../utils/validators/userValidator.js";

export const createCustomer = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  const errors = validateUserInput({ firstname, lastname, email, password });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();

  try {

    let user = await User.findOne({ email:normalizedEmail });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    user = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });
    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCustomers = async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  try {
    const query = {
      $or: [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ _id: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Count all users
export const userCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user count" });
  }
};

// Block/Unblock a user
export const toggleBlockCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlock = !user.isBlock; // Toggle the block status
    await user.save();
    res
      .status(200)
      .json({
        message: `User ${user.isBlock ? "blocked" : "unblocked"} successfully`,
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user details
export const updateCustomer = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const softDeleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeleted = true;
    await user.save();

    res.status(200).json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a user
export const deleteCustomer = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
