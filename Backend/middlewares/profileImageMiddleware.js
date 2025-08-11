import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinaryService from "../utils/services/cloudinaryService.js";


const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinaryService.cloudinaryRaw,
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
  limits: { fileSize: 2 * 1024 * 1024 }, 
}).single("profileImage"); 
