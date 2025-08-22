import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderID: { type: String, unique: true, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], default: "ONLINE" },
    paymentStatus: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending"},
    status: { type: String, enum: ["Pending", "Shipped", "OutForDelivery", "Delivered", "Cancelled"], default: "Pending",},
    total: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping_chrg: { type: Number, default: 0 },
    taxes: { type: Number, default: 0, min: 0,},
    coupon: { type: String, default: null,},
    applied_offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Offer" }],
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
        status: { type: String, enum: ["Pending", "Shipped", "OutForDelivery", "Delivered", "Cancelled", "Returned"], default: "Pending",},
        refundProcessed: { type: Boolean, default: false },
        cancelReason: { type: String },
        returnReason: { type: String },
        returnVerified: { type: Boolean, default: false },
        returnDecision: { type: String, enum: ["approved", "rejected", null], default: null },
      },
    ],
    order_date: { type: Date, default: Date.now },
    payment_id: { type: String },
    delivery_date: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);


export default mongoose.model("Order", orderSchema);
