// uploadMiddleware.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloundinaryService from "../utils/services/cloudinaryService.js";
import STATUS_CODES from "../utils/constants/statusCodes.js";
import { errorLogger } from "../utils/logger.js";


// Configure Cloudinary storage for product images
const storage = new CloudinaryStorage({
  cloudinary: cloundinaryService.cloudinaryRaw,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "limit", format: "jpg", quality: 80 }
    ]
  }
});

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array("images", 10);

export const processProductImages = async (req, res, next) => {
  if (!req.files?.length) {
    req.uploadedImages = [];
    return next();
  }

  try {
    const processedImages = req.files.map(file => file.path);

    if (processedImages.some(url => !url.startsWith("https://res.cloudinary.com"))) {
      errorLogger.error("Invalid Cloudinary URLs", { urls: processedImages });
      return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json({ error: "Invalid image URLs from Cloudinary" });
    }

    req.uploadedImages = processedImages;
    next();
  } catch (err) {
    errorLogger.error("Error processing images", { error: err });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: "Error processing images", details: err.message });
  }
};
