import userAxios from "../userAxios";

export const createRazorpayOrder = (data) => {
  return userAxios.post("/payment/create-order", data);
};

export const verifyPaymentSignature = (data) => {
  return userAxios.post("/payment/verify", data);
};

export default { createRazorpayOrder, verifyPaymentSignature };