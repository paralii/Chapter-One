import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    phone: { type: Number, required: true },
    place: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pin: { type: Number, required: true },
    type: { type: String, enum: ["Home", "Work"], default: "Home" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Address", addressSchema);