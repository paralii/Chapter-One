import Product from "../models/Product.js";
import Category from "../models/Category.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/uploadMiddleware.js";

export const createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length < 3) {
      return res
        .status(400)
        .json({ message: "At least 3 images are required" });
    }

    const uploadPromises = req.files.map((file) =>
      cloudinary.uploader.upload(file.path, { folder: "products" })
    );
    const uploadResults = await Promise.all(uploadPromises);
    const images = uploadResults.map((result) => result.secure_url);

    const productData = {
      ...req.body,
      product_imgs: images,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProducts = async (req, res) => {
  const {
    search = "",
    sort = "new_arrivals",
    category,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    isDeleted,
  } = req.query;

  try {
    const query = { isDeleted: false };

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true" ? false : true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category_id = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    let sortOption = {};
    switch (sort) {
      case "price_low_high":
        sortOption.price = 1;
        break;
      case "price_high_low":
        sortOption.price = -1;
        break;
      case "a-z":
        sortOption.title = 1;
        break;
      case "z-a":
        sortOption.title = -1;
        break;
      case "new_arrivals":
      default:
        sortOption.created_at = -1;
        break;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)
      .populate("category_id")
      .collation({ locale: "en", strength: 2 })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);
      
      console.log("Sorting by:", sortOption);

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

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { price, stock } = req.body;
    if (price !== undefined && price <= 0)
      return res.status(400).json({ message: "Invalid price" });
    if (stock !== undefined && stock < 0)
      return res.status(400).json({ message: "Invalid stock quantity" });

    if (req.files && req.files.length >= 3) {
      const newImages = req.files.map((file) => file.path);
      req.body.product_imgs = newImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
