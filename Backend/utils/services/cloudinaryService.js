import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, folder = "uploads") => {
  return await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
  });
};

const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

const generateImageUrl = (publicId, version) => {
  return cloudinary.url(publicId, {
    secure: true,
    version,
  });
};

export default {
  uploadImage,
  deleteImage,
  generateImageUrl,
  cloudinaryRaw: cloudinary, // for multer use
};
