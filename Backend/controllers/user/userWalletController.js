import Wallet from "../../models/Wallet.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId });
    }

    res.status(STATUS_CODES.SUCCESS.OK).json({
      balance: wallet.balance,
      transactions: wallet.transactions,
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to fetch wallet details" });
  }
};

export const creditWallet = async (userId, amount, description) => {
  try {
    if (amount <= 0) throw new Error("Amount must be greater than zero");
    if (amount > 100000) throw new Error("Exceeds max credit limit");

    let wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId });
    }

    wallet.balance += amount;
    wallet.transactions.push({
      type: "credit",
      amount,
      description,
    });

    await wallet.save();

    return { success: true };
  } catch (err) {
    console.error("Wallet credit failed:", err);
    return { success: false, message: err.message };
  }
};

export const debitWallet = async (userId, amount, description) => {
  try {
    if (amount <= 0) throw new Error("Amount must be greater than zero");
    if (amount > 50000) throw new Error("Exceeds max debit limit");

    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) throw new Error("Wallet not found");

    if (wallet.balance < amount) throw new Error("Insufficient balance");

    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      description,
    });

    await wallet.save();

    return { success: true };
  } catch (err) {
    console.error("Wallet debit failed:", err);
    return { success: false, message: err.message };
  }
};

export const checkWalletBalance = async (userId) => {
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) throw new Error("Wallet not found");
    return wallet.balance;
  } catch (err) {
    console.error("Error checking balance:", err);
    throw new Error("Balance check failed");
  }
};

export const ensureWalletIntegrity = async (userId) => {
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) throw new Error("Wallet not found");

    if (wallet.balance < 0) {
      wallet.balance = 0;
      wallet.transactions.push({
        type: "correction",
        amount: Math.abs(wallet.balance),
        description: "Corrected negative balance",
      });
      await wallet.save();
    }

    return { success: true };
  } catch (err) {
    console.error("Wallet integrity check failed:", err);
    return { success: false, message: err.message };
  }
};
