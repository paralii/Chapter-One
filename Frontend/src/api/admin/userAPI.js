import adminAxios from "../adminAxios";

export const getAllUsers = (params) => {
  return adminAxios.get("/customers", { params });
};

export const createUser = (userData) => {
  return adminAxios.post("/customers", userData);
};

export const getUserCount = () => {
  return adminAxios.get("/customers/count");
};

export const getUserById = (id) => {
  return adminAxios.get(`/customers/${id}`);
};

export const updateUser = (id, userData) => {
  return adminAxios.put(`/customers/${id}`, userData);
};

export const toggleBlockUser = (id) => {
  return adminAxios.patch(`/customers/${id}/toggle-block`);
};

export const deleteUser = (id) => {
  return adminAxios.delete(`/customers/${id}`);
};