import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

export const processProfileImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No profile image uploaded" });
  }

  try {
    const file = req.files[0];

    // Resize and convert to buffer
    const buffer = await sharp(file.buffer)
      .resize(400, 400)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Cloudinary
    cloudinary.uploader
      .upload_stream(
        {
          folder: "profile_images",
          resource_type: "image",
          format: "jpeg",
        },
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: "Cloudinary upload failed", error: err });
          }
          req.profileImageUrl = result.secure_url;
          next();
        }
      )
      .end(buffer); // Pipe the processed image buffer to Cloudinary
  } catch (err) {
    console.error("Error processing profile image:", err);
    return res.status(500).json({ message: "Error processing profile image" });
  }
};
