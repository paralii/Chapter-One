// src/api/orderAPI.js
import userAxios from "../userAxios";

// Place a new order (COD or Online)
export const createOrder = (orderData) => {
  return userAxios.post("/orders", orderData, { withCredentials: true });
};

// Get all orders for the logged-in user
export const listOrders = () => {
  return userAxios.get("/orders", { withCredentials: true });
};

// Get details of a specific order
export const getOrderDetails = (orderID) => {
  return userAxios.get(`/orders/${orderID}`, { withCredentials: true });
};

// Cancel entire order or a product (backend handles both)
export const cancelOrder = (data) => {
  return userAxios.put("/orders/cancel", data, { withCredentials: true });
};

// Return a product from an order
export const returnOrder = (data) => {
  return userAxios.put("/orders/return", data, { withCredentials: true });
};

// Download invoice PDF
export const downloadInvoice = (orderID) => {
  return userAxios.get(`/orders/invoice/${orderID}`, {
    responseType: "blob",
    withCredentials: true,
  });
};