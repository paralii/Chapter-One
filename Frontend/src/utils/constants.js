// src/utils/constants.js

export const COUPON_MIN_AMOUNT = 50;
export const COUPON_MAX_DISCOUNT = 500;
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_ALLOWED = 5;
export const ORDER_STATUSES = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_METHODS = {
  COD: "Cash on Delivery",
  RAZORPAY: "Razorpay",
};
