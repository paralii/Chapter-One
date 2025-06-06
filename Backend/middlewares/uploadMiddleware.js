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
  // If no files are uploaded, proceed without processing images
  if (!req.files || req.files.length === 0) {
    req.uploadedImages = []; // Set empty array to indicate no new images
    return next();
  }

  try {
    const processedImages = req.files.map(file => file.path); // Cloudinary URLs are already in file.path

    // Optional: Validate Cloudinary URLs if needed
    if (processedImages.some(url => !url.startsWith('https://res.cloudinary.com'))) {
      console.error("Invalid Cloudinary URLs:", processedImages);
      return res.status(500).json({ error: "Invalid image URLs from Cloudinary" });
    }

    req.uploadedImages = processedImages;
    next();
  } catch (err) {
    console.error("Error processing images:", err);
    res.status(500).json({ error: "Error processing images", details: err.message });
  }
};
