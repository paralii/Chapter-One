import userAxios from "../userAxios";

export const createRazorpayOrder = (data) => {
  return userAxios.post("/create-order", data);
};

export const verifyPaymentSignature = (data) => {
  return userAxios.post("/verify-payment", data);
};

export default { createRazorpayOrder, verifyPaymentSignature };
