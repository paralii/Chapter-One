import adminAxios from "../adminAxios";

export const getInventory = () => {
  return adminAxios.get("/inventory");
};

export const updateStock = (stockData) => {
  return adminAxios.post(`/inventory/update`, stockData);
};

export const lowStock = (data) => {
  return adminAxios.get(`/inventory/low-stock`, data);
};

export const inventoryReport = () => {
  return adminAxios.get("/inventory/report");
};