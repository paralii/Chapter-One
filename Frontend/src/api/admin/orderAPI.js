import adminAxios from "../adminAxios";

// List orders for admin with search, filter, sort, and pagination
export const listOrdersAdmin = (params) => {
  return adminAxios.get("/orders", { params });
};


export const updateOrderStatus = (orderID, status) => {
  return adminAxios.put(`/orders/${orderID}/status`, { status });
};

// Verify a return request (admin-only)
// Expects orderID and a boolean value "accept" indicating if the return is accepted
export const verifyReturnRequest = (orderID, accept) => {
  return adminAxios.put(`/orders/${orderID}/verify-return`, { accept });
};

// Optional: Get detailed order info for admin (if needed)
export const getOrderDetailsAdmin = (orderID) => {
  return adminAxios.get(`/orders/${orderID}`);
};