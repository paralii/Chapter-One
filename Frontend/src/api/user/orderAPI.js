import userAxios from "../userAxios";

export const createOrder = (orderData) => {
  return userAxios.post("/orders", orderData, { withCredentials: true });
};

export const createTempOrder = async (orderData) => {
  try {
    const response = await userAxios.post("/orders/temp", orderData);
    return { data: { success: true, order: response.data.order } };
  } catch (err) {
    return { data: { success: false, message: err.response?.data?.message || "Failed to create temp order" } };
  }
};

export const listOrders = () => {
  return userAxios.get("/orders", { withCredentials: true });
};

export const getPendingOrder = async () => {
  try {
    const response = await userAxios.get("/orders/pending");
    return { data: { success: true, order: response.data.order } };
  } catch (err) {
    return { data: { success: false, order: null, message: err.response?.data?.message || "No pending order" } };
  }
};

export const getOrderDetails = (orderID) => {
  return userAxios.get(`/orders/${orderID}`, { withCredentials: true });
};

export const cancelOrder = (data) => {
  return userAxios.put("/orders/cancel", data, { withCredentials: true });
};

export const returnOrder = (data) => {
  return userAxios.put("/orders/return", data, { withCredentials: true });
};

export const downloadInvoice = (orderID) => {
  return userAxios.get(`/orders/invoice/${orderID}`, {
    responseType: "blob",
    withCredentials: true,
  });
};