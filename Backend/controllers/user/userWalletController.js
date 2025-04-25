import Wallet from "../../models/Wallet.js";
import mongoose from "mongoose";

// 1. Get Wallet Balance & Transactions
export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user_id: userId });

    // If wallet doesn't exist, create one (fallback)
    if (!wallet) {
      wallet = new Wallet({ user_id: userId, balance: 0, transactions: [] });
      await wallet.save();
    }

    res.json({ balance: wallet.balance, transactions: wallet.transactions });
  } catch (err) {
    console.error("Error fetching wallet details:", err);
    res.status(500).json({ message: "Failed to fetch wallet details" });
  }
};

// 2. Internal Function - Credit Wallet (e.g., on Cancel or Return)
export const creditWallet = async (userId, amount, description) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Input validation
    if (amount <= 0) {
      throw new Error("Credit amount must be greater than zero");
    }

    // Ensure the amount is within acceptable limits (example max limit)
    const MAX_CREDIT_AMOUNT = 100000; // Define max credit limit
    if (amount > MAX_CREDIT_AMOUNT) {
      throw new Error(`Credit amount exceeds the maximum limit of ${MAX_CREDIT_AMOUNT}`);
    }

    let wallet = await Wallet.findOne({ user_id: userId }).session(session);
    if (!wallet) {
      wallet = new Wallet({ user_id: userId, balance: 0, transactions: [] });
    }

    wallet.balance += amount;
    wallet.transactions.push({
      type: "credit",
      amount,
      description,
      date: new Date().toISOString(), // ISO 8601 date format
    });

    await wallet.save({ session });
    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Wallet credit failed:", err);
    return { success: false, message: err.message };
  }
};

// 3. Internal Function - Debit Wallet (e.g., if user uses wallet for payment)
export const debitWallet = async (userId, amount, description) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Input validation
    if (amount <= 0) {
      throw new Error("Debit amount must be greater than zero");
    }

    // Ensure the amount is within acceptable limits (example max limit)
    const MAX_DEBIT_AMOUNT = 50000; // Define max debit limit
    if (amount > MAX_DEBIT_AMOUNT) {
      throw new Error(`Debit amount exceeds the maximum limit of ${MAX_DEBIT_AMOUNT}`);
    }

    let wallet = await Wallet.findOne({ user_id: userId }).session(session);
    if (!wallet) {
      throw new Error("Wallet not found for the user");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      description,
      date: new Date().toISOString(), // ISO 8601 date format
    });

    await wallet.save({ session });
    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Wallet debit failed:", err);
    return { success: false, message: err.message };
  }
};

// 4. Check Wallet Balance & Ensure No Negative Balance
export const checkWalletBalance = async (userId) => {
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      throw new Error("Wallet not found for the user");
    }
    return wallet.balance;
  } catch (err) {
    console.error("Error checking wallet balance:", err);
    throw new Error("Failed to check wallet balance");
  }
};

// 5. Handle Edge Case for Wallet Integrity Check
export const ensureWalletIntegrity = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let wallet = await Wallet.findOne({ user_id: userId }).session(session);

    if (!wallet) {
      throw new Error("Wallet not found for the user");
    }

    // If wallet balance is negative, reset it to zero (integrity check)
    if (wallet.balance < 0) {
      wallet.balance = 0;
      wallet.transactions.push({
        type: "correction",
        amount: Math.abs(wallet.balance),
        description: "Corrected negative balance",
        date: new Date().toISOString(),
      });
      await wallet.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Wallet integrity check failed:", err);
    return { success: false, message: err.message };
  }
};
