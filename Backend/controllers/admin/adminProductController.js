import Product from "../../models/Product.js";
import cloudinary from "../../config/cloudinary.js";
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  try {
    if (!req.uploadedImages || req.uploadedImages.length < 3) {
      return res
        .status(400)
        .json({ message: "At least 3 images are required" });
    }

    const productData = {
      ...req.body,
      product_imgs: req.uploadedImages,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prepare update data
    const updateData = { ...req.body };

    // Convert and validate numeric fields
    if (req.body.price !== undefined) {
      updateData.price = Number(req.body.price);
      if (isNaN(updateData.price) || updateData.price <= 0) {
        return res.status(400).json({ message: "Invalid or missing price" });
      }
    }
    if (req.body.available_quantity !== undefined) {
      updateData.available_quantity = Number(req.body.available_quantity);
      if (isNaN(updateData.available_quantity) || updateData.available_quantity < 0) {
        return res.status(400).json({ message: "Invalid available quantity" });
      }
    }
    if (req.body.discount !== undefined) {
      updateData.discount = Number(req.body.discount);
      if (isNaN(updateData.discount) || updateData.discount < 0 || updateData.discount > 100) {
        return res.status(400).json({ message: "Invalid discount (must be between 0 and 100)" });
      }
    }
    if (req.body.category_id) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category_id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      updateData.category_id = new mongoose.Types.ObjectId(req.body.category_id);
    }

    // Handle images
// Handle images
if (req.uploadedImages && req.uploadedImages.length >= 3) {
  // Delete old images from Cloudinary if new images are provided
  if (product.product_imgs && product.product_imgs.length > 0) {
    for (const imageUrl of product.product_imgs) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error(`Failed to delete image ${publicId}:`, err);
      });
    }
  }
  updateData.product_imgs = req.uploadedImages;
} else if (req.uploadedImages && req.uploadedImages.length > 0 && req.uploadedImages.length < 3) {
  return res.status(400).json({ message: "At least 3 images are required when updating images" });
} else {
  // Preserve existing images if no new images are provided
  updateData.product_imgs = product.product_imgs;
}

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("category_id");

    if (!updatedProduct) {
      return res.status(404).json({ message: "Failed to update product" });
    }

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Server error while updating product", details: err.message });
  }
};

export const toggleProductListing = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isDeleted = !product.isDeleted;
    product.isListed = !product.isListed;
    await product.save();

    res.status(200).json({
      message: `Product ${
        product.isDeleted ? "soft-deleted" : "restored"
      } successfully`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    for (const imageUrl of product.images) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  const { search = "", page = 1, limit = 10, isDeleted } = req.query;

  try {
    const query = { isDeleted: false };

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true";
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)
      .populate("category_id")
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({ products, total, totalPages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category_id"
    );
    if (!product || product.isDeleted) {
      return res.status(404).json({ message: "Product not available" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
