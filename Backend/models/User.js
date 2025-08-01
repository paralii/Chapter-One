import mongoose from "mongoose";
import { DEFAULT_PROFILE_IMAGE } from "../utils/constants/constants.js";
import { generateReferralCode } from "../utils/services/referralService.js";

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index:true },
    password: { type: String, required: false },
    isBlock: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    profileImage: { type: String, default: DEFAULT_PROFILE_IMAGE },
    referral_code: { type: String, unique: true, default: generateReferralCode},
    referred_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);