import Address from "../../models/Address.js";

// Add Address
export const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.body.isDefault) {
      await Address.updateMany({ user_id: userId }, { isDefault: false });
    }

    const newAddress = new Address({ ...req.body, user_id: userId });
    const saved = await newAddress.save();

    res.status(201).json({ message: "Address added successfully", address: saved });
  } catch (error) {
    res.status(500).json({ message: "Failed to add address", error });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Fetch address by address ID and ensure it belongs to the current user
    const address = await Address.findOne({ _id: id, user_id: userId })
      .populate('user_id', 'name email'); // populate user data (name, email, etc.)

    if (!address) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ address });
  } catch (error) {
    res.status(500).json({ message: "Failed to get address", error });
  }
};

// Modify API to get the default address by the user_id
export const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;  // Get user ID from auth middleware

    const address = await Address.findOne({ user_id: userId, isDefault: true });
    if (!address) {
      return res.status(404).json({ message: "Default address not found" });
    }

    res.status(200).json({ address });
  } catch (error) {
    res.status(500).json({ message: "Failed to get default address", error });
  }
};


// Get all addresses
export const getAllUserAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const addresses = await Address.find({ user_id: userId }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({ addresses });
  } catch (error) {
    res.status(500).json({ message: "Failed to get addresses", error });
  }
};

// Update Address
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

    if (!updated) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address updated", address: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update address", error });
  }
};

// Delete Address
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await Address.findOneAndDelete({ _id: id, user_id: userId });
    if (deleted.isDefault) {
      await Address.findOneAndUpdate(
        { user_id: userId },
        { isDefault: true },
        { sort: { createdAt: -1 } } // Most recent address becomes default
      );
    }
    
    if (!deleted) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete address", error });
  }
};

// Set Default Address
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

    if (!updated) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Default address set", address: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to set default address", error });
  }
};
