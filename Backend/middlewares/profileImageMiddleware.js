// middlewares/profileImageUpload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary config for profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face", format: "jpg", quality: 80 },
    ],
  },
});

export const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
}).single("profileImage"); // accepts a single file under the field name "profileImage"
