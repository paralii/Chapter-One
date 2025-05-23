import Product from "../../models/Product.js";

export const getProducts = async (req, res) => {
  const {
    search = "",
    sort = "new_arrivals",
    category,
    minPrice,
    maxPrice,
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
