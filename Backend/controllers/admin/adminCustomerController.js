import User from "../../models/User.js";
import { validateUserInput } from "../../utils/validators/userValidator.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
<<<<<<< HEAD
import { forceLogoutUser } from "../../utils/socket.js";

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
=======
import { logger, errorLogger } from "../../utils/logger.js";
>>>>>>> 8bd0e5f74c3d7bd13ad95e5416f2dd86d39e9eb6

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
      .limit(parseInt(limit))
      .select("_id firstname lastname email isBlock isVerified isDeleted");
    logger.info(
      `Fetched ${users.length} customers with search: "${search}", page: ${page}, limit: ${limit}`
    );
    res.status(STATUS_CODES.SUCCESS.OK).json({ users, total });
  } catch (err) {
    errorLogger.error("Error fetching customers", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "_id firstname lastname email isBlock isVerified isDeleted"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    logger.info(`Fetched customer details for user ID: ${user._id}`);
    res.status(STATUS_CODES.SUCCESS.OK).json(user);
  } catch (err) {
    errorLogger.error("Error fetching customer by ID", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

export const userCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    logger.info(`Total users count: ${totalUsers}`);
    res.json({ totalUsers });
  } catch (error) {
    errorLogger.error("Error fetching user count", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch user count" });
  }
};

export const toggleBlockCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("_id isBlock firstname");
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlock = !user.isBlock;
    await user.save();
<<<<<<< HEAD

    if (user.isBlock) {
      forceLogoutUser(user._id.toString())
    };

    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({
        _id: user._id,
        firstname: user.firstname,
        isBlock: user.isBlock,
        message: `User ${user.isBlock ? "blocked" : "unblocked"} successfully`,
      });
=======
    logger.info(`User ${user._id} block status updated to ${user.isBlock}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({
      _id: user._id,
      firstname: user.firstname,
      isBlock: user.isBlock,
      message: `User ${user.isBlock ? "blocked" : "unblocked"} successfully`,
    });
>>>>>>> 8bd0e5f74c3d7bd13ad95e5416f2dd86d39e9eb6
  } catch (err) {
    errorLogger.error("Error toggling block status", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  const { firstname, lastname, email } = req.body;

  const validationErrors = validateUserInput({
    firstname,
    lastname,
    email,
    password: "Password@123",
  });

  if (validationErrors.length > 0) {
    return res
      .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
      .json({ errors: validationErrors });
  }

  try {
    const updateFields = {};

    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({ message: "Email already in use" });
      }

      updateFields.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { _id, firstname: fn, lastname: ln, email: em, isBlock } = user;
    logger.info(`Customer ${_id} updated successfully`);
    res.status(STATUS_CODES.SUCCESS.OK).json({
      _id,
      firstname: fn,
      lastname: ln,
      email: em,
      isBlock,
    });
  } catch (err) {
    errorLogger.error("Error updating customer", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    logger.info(`User ${user._id} deleted successfully`);
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ message: "User deleted successfully" });
  } catch (err) {
    errorLogger.error("Error deleting customer", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};
