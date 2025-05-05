import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    isBlock: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/chapter-one/image/upload/v1746419585/uploads/niizxavwwvje8ji82hmi.jpg",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
