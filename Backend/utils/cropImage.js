import sharp from "sharp";

export const cropAndResizeImage = async (buffer, width = 500, height = 500) => {
  try {
    const processedImage = await sharp(buffer)
      .resize(width, height, {
        fit: "cover",
      })
      .toBuffer();
    return processedImage;
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};
