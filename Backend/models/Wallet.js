import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    balance: { type: Number, default: 0 },
    transactions: [{ 
      type: { type: String, 
      enum: ["credit", "debit"], 
      required: true }, 
      amount: { type: Number, required: true }, 
      description: { type: String }, 
      date: { type: Date, default: Date.now } 
    }],
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);