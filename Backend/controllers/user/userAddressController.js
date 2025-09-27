import Address from "../../models/Address.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

export const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await Address.findOne({
      user_id: userId,
      place: req.body.place,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      pin: req.body.pin,
    });

    if (existing) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "This address already exists in your account." });
    } 

    if (req.body.isDefault) {
      await Address.updateMany({ user_id: userId }, { isDefault: false });
    }

    const newAddress = new Address({ ...req.body, user_id: userId });
    const saved = await newAddress.save();

    logger.info(`Address added successfully for user ${userId}`);
    res
      .status(STATUS_CODES.SUCCESS.CREATED)
      .json({ message: "Address added successfully", address: saved });
  } catch (error) {
    errorLogger.error("Error adding address", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to add address", error });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({
      _id: id,
      user_id: userId,
    })
    .select("-__v").populate("user_id", "name email");

    if (!address)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Address not found" });

    logger.info(`Fetched address ${id} for user ${userId}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ address });
  } catch (error) {
    errorLogger.error("Error fetching address by ID", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get address", error });
  }
};

export const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    const address = await Address.findOne({ user_id: userId, isDefault: true });
    if (!address) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Default address not found" });
    }
    logger.info(`Fetched default address for user ${userId}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ address });
  } catch (error) {
    errorLogger.error("Error fetching default address", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get default address", error });
  }
};

export const getAllUserAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const addresses = await Address.find({ user_id: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    logger.info(`Fetched all addresses for user ${userId}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ addresses });
  } catch (error) {
    errorLogger.error("Error fetching all user addresses", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get addresses", error });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (req.body.isDefault) {
      await Address.updateMany({ user_id: userId }, { isDefault: false });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: req.body },
      { new: true }
    );

    if (!updated)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Address not found" });

    logger.info(`Address ${id} updated successfully for user ${userId}`);
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ message: "Address updated", address: updated });
  } catch (error) {
    errorLogger.error("Error updating address", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to update address", error });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await Address.findOneAndDelete({
      _id: id,
      user_id: userId,
    });
    if (deleted.isDefault) {
      await Address.findOneAndUpdate(
        { user_id: userId },
        { isDefault: true },
        { sort: { createdAt: -1 } }
      );
    }

    if (!deleted)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Address not found" });

    logger.info(`Address ${id} deleted successfully for user ${userId}`);
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Address deleted" });
  } catch (error) {
    errorLogger.error("Error deleting address", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to delete address", error });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await Address.updateMany({ user_id: userId }, { isDefault: false });

    const updated = await Address.findOneAndUpdate(
      { _id: id, user_id: userId },
      { isDefault: true },
      { new: true }
    );

    if (!updated)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Address not found" });

    logger.info(`Set address ${id} as default for user ${userId}`);
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ message: "Default address set", address: updated });
  } catch (error) {
    errorLogger.error("Error setting default address", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to set default address", error });
  }
};
