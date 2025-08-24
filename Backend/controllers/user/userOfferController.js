import Offer from "../../models/Offer.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const getActiveOffers = async (req, res) => {
  try {
    const { type, productId, categoryId } = req.query;
    const query = { is_active: true, end_date: { $gte: new Date() } };
    if (type && ["PRODUCT", "CATEGORY"].includes(type)) query.type = type;
    if (productId) query.product_id = productId;
    if (categoryId) query.category_id = categoryId;

    const offers = await Offer.find(query)
      .populate("product_id", "title price")
      .populate("category_id", "name")
    res.json({ success: true, offers });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error", error: err.message });
  }
};