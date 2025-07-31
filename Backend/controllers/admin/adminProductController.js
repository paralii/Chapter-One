import Product from "../../models/Product.js";
import cloudinaryService from "../../utils/services/cloudinaryService.js";
import mongoose from "mongoose";
import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const createProduct = async (req, res) => {
  try {
    const existingProduct = await Product.findOne({ title: req.body.title });
      if (existingProduct) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Product title already exists" });
      }

    if (!req.uploadedImages || req.uploadedImages.length < 3) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "At least 3 images are required" });
    }

    const productData = {
      ...req.body,
      product_imgs: req.uploadedImages,
    };

    const product = new Product(productData);
    await product.save();

    res.status(STATUS_CODES.SUCCESS.CREATED).json({ message: "Product created successfully", product });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product not found" });

    const updateData = { ...req.body };

    if (req.body.price !== undefined) {
      updateData.price = Number(req.body.price);
      if (isNaN(updateData.price) || updateData.price <= 0) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid or missing price" });
      }
    }
    if (req.body.available_quantity !== undefined) {
      updateData.available_quantity = Number(req.body.available_quantity);
      if (isNaN(updateData.available_quantity) || updateData.available_quantity < 0) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid available quantity" });
      }
    }
    if (req.body.discount !== undefined) {
      updateData.discount = Number(req.body.discount);
      if (isNaN(updateData.discount) || updateData.discount < 0 || updateData.discount > 100) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid discount (must be between 0 and 100)" });
      }
    }
    if (req.body.category_id) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category_id)) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid category ID" });
      }
      updateData.category_id = new mongoose.Types.ObjectId(req.body.category_id);
    }


if (req.uploadedImages && req.uploadedImages.length >= 3) {
  if (product.product_imgs && product.product_imgs.length > 0) {
    for (const imageUrl of product.product_imgs) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinaryService.deleteImage(publicId).catch(err => {
        console.error(`Failed to delete image ${publicId}:`, err);
      });
    }
  }
  updateData.product_imgs = req.uploadedImages;
} else if (req.uploadedImages && req.uploadedImages.length > 0 && req.uploadedImages.length < 3) {
  return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "At least 3 images are required when updating images" });
} else {
  updateData.product_imgs = product.product_imgs;
}

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("category_id");

    if (!updatedProduct) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Failed to update product" });
    }

    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: "Server error while updating product", details: err.message });
  }
};

export const toggleProductListing = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product not found" });

    product.isDeleted = !product.isDeleted;
    product.isListed = !product.isListed;
    await product.save();

    res.status(STATUS_CODES.SUCCESS.OK).json({
      message: `Product ${
        product.isDeleted ? "soft-deleted" : "restored"
      } successfully`,
    });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product not found" });

    for (const imageUrl of product.images) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinaryService.deleteImage(publicId);
    }
    await Cart.updateMany(
      { "items.productId": req.params.id },
      { $pull: { items: { productId: req.params.id } } }
    );
    await Wishlist.updateMany(
      { "items.productId": req.params.id },
      { $pull: { items: { productId: req.params.id } } }
    );
    await Product.findByIdAndDelete(req.params.id);
    res.status(STATUS_CODES.SUCCESS.OK).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  const { search = "", page = 1, limit, isDeleted } = req.query;

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

    res.status(STATUS_CODES.SUCCESS.OK).json({ products, total, totalPages });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category_id"
    );
    if (!product || product.isDeleted) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product not available" });
    }
    res.status(STATUS_CODES.SUCCESS.OK).json(product);
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};
