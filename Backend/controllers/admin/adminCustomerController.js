import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { validateUserInput } from "../../utils/validators/userValidator.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const createCustomer = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  const errors = validateUserInput({ firstname, lastname, email, password });

  if (errors.length > 0) {
    return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ errors });
  }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();

  try {

    let user = await User.findOne({ email:normalizedEmail });
    if (user) return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    user = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });
    await user.save();

    res.status(STATUS_CODES.SUCCESS.CREATED).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
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

    res.status(STATUS_CODES.SUCCESS.OK).json({ users, total });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(STATUS_CODES.SUCCESS.OK).json(user);
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const userCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch user count" });
  }
};

export const toggleBlockCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlock = !user.isBlock;
    await user.save();
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({
        message: `User ${user.isBlock ? "blocked" : "unblocked"} successfully`,
      });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(STATUS_CODES.SUCCESS.OK).json(user);
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const softDeleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeleted = true;
    await user.save();

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};
