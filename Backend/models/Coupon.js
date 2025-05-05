import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    discountPercentage: { type: Number, required: true }, // e.g., 10 for 10%
    expirationDate: { type: Date },
    usageLimit: { type: Number, default: 1 }, // How many times a coupon can be used
    usedCount: { type: Number, default: 0 }, // How many times the coupon has been used
    isActive: { type: Boolean, default: true }, // Whether the coupon is active or not
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
