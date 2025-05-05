import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", 
    allowed_formats: ["jpg", "jpeg", "png", "webp"], 
    transformation: [{ width: 500, height: 500, crop: "limit", format: "jpg", quality: 80 }], 
  },
});

export const uploadProductImages = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
}).array("images", 10); 

export const processProductImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images uploaded" });
  }

  try {
    const processedImages = [];

    const uploadPromises = req.files.map(async (file) => {
      processedImages.push(file.path); 
    });

    await Promise.all(uploadPromises);
    req.uploadedImages = processedImages; 

    next(); 
  } catch (err) {
    console.error("Error processing images:", err);
    res.status(500).json({ error: "Error processing images" });
  }
};
