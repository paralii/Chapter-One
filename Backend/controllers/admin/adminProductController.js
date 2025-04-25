import Product from "../../models/Product.js";
import cloudinary from "../../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    if (!req.uploadedImages || req.uploadedImages.length < 3) {
      return res.status(400).json({ message: "At least 3 images are required" });
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

    const { price, stock } = req.body;
    if (price !== undefined && price <= 0)
      return res.status(400).json({ message: "Invalid price" });
    if (stock !== undefined && stock < 0)
      return res.status(400).json({ message: "Invalid stock quantity" });

    // If there are new images in the request, process them
    if (req.uploadedImages && req.uploadedImages.length >= 3) {
      req.body.product_imgs = req.uploadedImages; // Use processed image URLs from middleware
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({ message: "Product updated successfully", updatedProduct });
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
      message: `Product ${product.isDeleted ? "soft-deleted" : "restored"} successfully`,
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
    const {
      search = "",
      page = 1,
      limit = 10,
    } = req.query;
  
    try {
      const query = { isDeleted: false };
  
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
      const product = await Product.findById(req.params.id).populate("category_id");
      if (!product || product.isDeleted) {
        return res.status(404).json({ message: "Product not available" });
      }
      res.status(200).json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  