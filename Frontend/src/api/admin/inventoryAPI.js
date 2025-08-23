import adminAxios from "../adminAxios";

export const getAllInventory = () => {
  return adminAxios.get("/inventory");
};

export const updateProductStock = (stockData) => {
  return adminAxios.post(`/inventory/update`, stockData);
};

export const getLowStockProducts = (data) => {
  return adminAxios.get(`/inventory/low-stock`, data);
};

export const getInventoryReport = () => {
  return adminAxios.get("/inventory/report");
};