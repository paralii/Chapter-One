import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderID: { type: String, unique: true, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date },

    status: { type: String, 
        enum: ["Pending", "Processing", "Shipped", "OutForDelivery", "Delivered", "Cancelled"], default: "Pending" },
    paymentMethod: { type: String, 
        enum: ["COD", "ONLINE", "Wallet"], default: "ONLINE" },
    paymentStatus: { type: String,
        enum: ["Pending", "Completed", "Failed"],default: "Pending"},
    payment_id: { type: String },
    
    amount: {type:Number, default: 0},
    total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    productDiscount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    shipping_chrg: { type: Number, default: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true },
    coupon: { type: String, default: null,},
    applied_offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Offer" }],

    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },

        status: { type: String,
            enum: ["Pending", "Shipped", "OutForDelivery", "Delivered", "Cancelled", "Returned"], default: "Pending" },
        cancelReason: { type: String },
        returnReason: { type: String },
        returnDecision: { type: String, 
            enum: ["approved", "rejected", null], default: null },
        returnVerified: { type: Boolean, default: false },
        refundProcessed: { type: Boolean, default: false },
      },
    ],

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);