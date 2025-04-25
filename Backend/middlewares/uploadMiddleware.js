import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import sharp from "sharp";
import path from "path";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
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
    
    for (let file of req.files) {
      const buffer = await sharp(file.buffer)
        .resize({ width: 500, height: 500, fit: sharp.fit.inside }) 
        .toFormat("jpeg")
        .jpeg({ quality: 80 }) 
        .toBuffer();
        
      const uploaded = await cloudinary.uploader.upload_stream(
        { folder: "products", resource_type: "image" },
        (error, result) => {
          if (error) {
            return res.status(500).json({ error: error.message });
          }
          processedImages.push(result.secure_url);
        }
      );

      sharp(buffer).toBuffer().pipe(uploaded);
    }

    req.uploadedImages = processedImages;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing images" });
  }
};

