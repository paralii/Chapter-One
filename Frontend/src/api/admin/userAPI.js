import adminAxios from "../adminAxios";

export const getAllUsers = (params) => {
  return adminAxios.get("/users", { params });
};

export const createUser = (userData) => {
  return adminAxios.post("/users", userData);
};

export const getUserCount = () => {
  return adminAxios.get("/users/count");
};

export const getUserById = (id) => {
  return adminAxios.get(`/users/${id}`);
};

export const updateUser = (id, userData) => {
  return adminAxios.put(`/users/${id}`, userData);
};

export const toggleBlockUser = (id) => {
  return adminAxios.patch(`/users/${id}/toggle-block`);
};

export const deleteUser = (id) => {
  return adminAxios.delete(`/users/${id}`);
};