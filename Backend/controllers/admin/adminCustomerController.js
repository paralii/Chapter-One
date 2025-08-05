import User from "../../models/User.js";
import { validateUserInput } from "../../utils/validators/userValidator.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";


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

    res.status(STATUS_CODES.SUCCESS.OK).json({ users, total });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id firstname lastname email isBlock isVerified isDeleted");
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
    const user = await User.findById(id).select("_id isBlock firstname");
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlock = !user.isBlock;
    await user.save();
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({
        _id: user._id,
        firstname: user.firstname,
        isBlock: user.isBlock,
        message: `User ${user.isBlock ? "blocked" : "unblocked"} successfully`,
      });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  const { firstname, lastname, email } = req.body;

  // Only validate what's being updated
  const validationErrors = validateUserInput({
    firstname,
    lastname,
    email,
    password: "Password@123", // required by current validator logic
  });

  if (validationErrors.length > 0) {
    return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ errors: validationErrors });
  }

  try {
    const updateFields = {};

    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Email already in use" });
      }

      updateFields.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { _id, firstname: fn, lastname: ln, email: em, isBlock } = user;
    res.status(STATUS_CODES.SUCCESS.OK).json({
      _id,
      firstname: fn,
      lastname: ln,
      email: em,
      isBlock,
    });
  } catch (err) {
    console.error("Error in updateCustomer:", err);
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
