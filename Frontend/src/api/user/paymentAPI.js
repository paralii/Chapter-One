// API calls to interact with the backend for Razorpay
import userAxios from "../userAxios";

// Function to create Razorpay order
export const createRazorpayOrder = (data) => {
  return userAxios.post("/create-order", data);
};

// Function to verify Razorpay payment signature
export const verifyPaymentSignature = (data) => {
  return userAxios.post("/verify-payment", data);
};

export default { createRazorpayOrder, verifyPaymentSignature };
