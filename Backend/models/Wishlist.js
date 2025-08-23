import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,},
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", wishlistSchema);