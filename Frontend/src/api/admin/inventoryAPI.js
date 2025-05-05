// src/api/admin/inventoryAPI.js
import adminAxios from "../adminAxios";

export const getInventory = () => {
  return adminAxios.get("/inventory");
};

export const updateStock = (id, stockData) => {
  return adminAxios.put(`/inventory/${id}`, stockData);
};

export const addStock = (id, data) => {
  return adminAxios.post(`/inventory/${id}/add-stock`, data);
};
