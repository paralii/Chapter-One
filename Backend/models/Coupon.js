import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    discountPercentage: { type: Number, required: true }, 
    expirationDate: { type: Date },
    usageLimit: { type: Number, default: 1 }, 
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxDiscountAmount: { type: Number, default: null, min: 0 }, 
    isActive: { type: Boolean, default: true }, 
    minOrderValue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);