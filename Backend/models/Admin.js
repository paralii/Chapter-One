import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);