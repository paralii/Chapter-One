//productController.js
import Product from "../models/Product.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

// Helper function to upload a file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "products", // Folder in Cloudinary
        transformation: [{ width: 800, height: 800, crop: "fill" }], // Crop/resize to 800x800 pixels
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// GET /api/products?search=&sort=&category=&brand=&minPrice=&maxPrice=&page=&limit=
export const getProducts = async (req, res) => {
  try {
    const { search = "", sort, category, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    // Build query object
    let query = { isDeleted: false };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort object based on query parameter
    let sortOptions = {};
    if (sort) {
      // Expected values: price_asc, price_desc, alphabetical_asc, alphabetical_desc,
      // popularity, averageRatings, newArrivals, featured
      if (sort === "price_asc") {
        sortOptions.price = 1;
      } else if (sort === "price_desc") {
        sortOptions.price = -1;
      } else if (sort === "alphabetical_asc") {
        sortOptions.name = 1;
      } else if (sort === "alphabetical_desc") {
        sortOptions.name = -1;
      } else if (sort === "newArrivals") {
        sortOptions.createdAt = -1;
      } else if (sort === "popularity") {
        // Assuming you add a popularity field later
        sortOptions.popularity = -1;
      } else if (sort === "averageRatings") {
        // Assuming you add an averageRatings field later
        sortOptions.averageRatings = -1;
      } else if (sort === "featured") {
        // Assuming you add a featured field later (boolean, sort featured first)
        sortOptions.featured = -1;
      }
    } else {
      // Default sort: descending by creation date
      sortOptions.createdAt = -1;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("category", "name"); // Populate category name if needed

    res.status(200).json({ products, totalCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products
export const createProduct = async (req, res) => {
  try {
    // Validate that at least 3 images are uploaded
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ message: "Minimum 3 images are required" });
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
    const imageUrls = await Promise.all(uploadPromises);

    // Combine request body with images array
    const productData = { ...req.body, images: imageUrls };

    // Create and save the product
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ product, message: "Product created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    let imageUrls;
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
      imageUrls = await Promise.all(uploadPromises);
    }
    const updatedData = { ...req.body };
    if (imageUrls) {
      updatedData.images = imageUrls;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product, message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id (Soft Delete)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product, message: "Product soft deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
