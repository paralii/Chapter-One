import Product from "../../models/Product.js";
import Offer from '../../models/Offer.js';
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const getProducts = async (req, res) => {
  const { search = "", sort = "new_arrivals", category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

  try {
    const query = { isDeleted: false };

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

    res.status(STATUS_CODES.SUCCESS.OK).json({ products, total, totalPages });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category_id");
    if (!product || product.isDeleted) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Product not available" });
    }
    res.status(STATUS_CODES.SUCCESS.OK).json(product);
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    const limit = Number(req.query.limit) || 10;

    // Fetch the original product
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find related products in the same category, excluding the current product
    const relatedProducts = await Product.find({
      category_id: product.category_id,
      _id: { $ne: product._id },
      isDeleted: false,
    })
      .limit(limit)
      .sort({ createdAt: -1 }); // newest first

    res.status(STATUS_CODES.SUCCESS.OK).json({
      success: true,
      data: relatedProducts,
    });
  } catch (err) {
    console.error("Error fetching related products:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductsWithActiveDiscounts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    const now = new Date();
    const productIds = products.map(p => p._id);

    // Fetch active product offers
    const offers = await Offer.find({
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
      product_id: { $in: productIds }
    });

    const productsWithDiscount = products.map(p => {
      const offer = offers.find(o => o.product_id?.toString() === p._id.toString());
      const discount = offer ? offer.discount_value : 0;
      const discountedPrice =
        discount > 0 && offer?.discount_type === "PERCENTAGE"
          ? p.price - (p.price * discount) / 100
          : p.price;

      return {
        ...p._doc,
        activeDiscount: discount,
        discountedPrice
      };
    });

    res.json({ success: true, products: productsWithDiscount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};