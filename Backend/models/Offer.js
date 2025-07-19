import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["PRODUCT", "CATEGORY", "REFERRAL"], required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: function() { return this.type === "PRODUCT"; } },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: function() { return this.type === "CATEGORY"; } },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: function() { return this.type === "REFERRAL"; } },
    discount_type: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
    discount_value: { type: Number, required: true, min: 0 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
    referral_code: { type: String, unique: true, sparse: true, required: function() { return this.type === "REFERRAL"; } },
    block_message: { type: String, default: null } // Message shown to users if referral is blocked
  },
  { timestamps: true }
);

offerSchema.index(
  { user_id: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "REFERRAL" }
  }
);

export default mongoose.model("Offer", offerSchema);