import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderID: { type: String, unique: true, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "out for delivery", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["COD", "Online"], default: "COD" },
    payment_id: { type: String }, // optional, for online payments
    shipping_chrg: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }, // total without discount
    netAmount: { type: Number, required: true }, // final payable
    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // single price at order time
        total: { type: Number, required: true }, // price * quantity
        status: {
          type: String,
          enum: ["ordered", "cancelled", "returned", "delivered"],
          default: "ordered",
        },
        refundProcessed: { type: Boolean, default: false },
        cancelReason: { type: String },
        returnReason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
