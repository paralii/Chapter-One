import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { sendChangeEmail } from "../../utils/services/emailService.js";
import { generateOTP, storeOtpInRedis, getOtpFromRedis, deleteOtpFromRedis } from "../../utils/services/otpService.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user)
      .select("-password");

    if (!user) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "User not found" });
    res.status(STATUS_CODES.SUCCESS.OK).json({ user });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.IN).json({ message: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { firstname, lastname } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      { firstname, lastname },
      { new: true }
    ).select("-password");

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.IN).json({ message: err.message });
  }
};

export const changeUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch)
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Incorrect old password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.IN).json({ message: err.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  if (!req.file || !req.file.path)
    return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "No image file uploaded" });

  try {
    const user = await User.findByIdAndUpdate(
      req.user,
      { profileImage: req.file.path },
      { new: true }
    ).select("-password");

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Profile image updated", user });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.IN).json({ message: err.message });
  }
};

export const requestEmailChange = async (req, res) => {
  const { newEmail } = req.body;

  try {
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    const otp = generateOTP();

    await storeOtpInRedis(`emailChange:${normalizedNewEmail}`, JSON.stringify({
      otp,
      userId: req.user
    }));

    await sendChangeEmail(normalizedNewEmail, otp);

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "OTP sent to new email" });
  } catch (err) {
    console.error("Request Email Change Error:", err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export const confirmEmailChange = async (req, res) => {
  const { otp, newEmail } = req.body;

  try {
    const normalizedEmail = newEmail.toLowerCase().trim();
    const storedData = await getOtpFromRedis(`emailChange:${normalizedEmail}`);

    if (!storedData) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "OTP expired or invalid" });
    }

    const parsedData = JSON.parse(storedData);

    if (parsedData.otp !== otp) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid OTP" });
    }

    const user = await User.findByIdAndUpdate(
      parsedData.userId,
      { email: normalizedEmail },
      { new: true }
    ).select("-password");

    await deleteOtpFromRedis(`emailChange:${normalizedEmail}`);

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Email updated successfully", user });
  } catch (err) {
    console.error("Confirm Email Change Error:", err.message);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};
