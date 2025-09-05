import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["PRODUCT", "CATEGORY"], required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: function() { return this.type === "PRODUCT"; } },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: function() { return this.type === "CATEGORY"; } },
    discount_type: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
    discount_value: { type: Number, required: true, min: 0 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);