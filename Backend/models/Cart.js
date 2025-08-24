import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true,},
        quantity: { type: Number, required: true, min: 1 },
      }],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);