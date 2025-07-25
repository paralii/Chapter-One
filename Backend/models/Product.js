import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    author_name: { type: String },
    price: { type: Number, required: true },
    available_quantity: { type: Number, required: true },
    description: { type: String },
    publisher: { type: String },
    product_imgs: [String],
    isDeleted: { type: Boolean, default: false },
    ratings: { type: Number, default: 0 },
    highlights: { type: String },
    specs: { type: String },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
