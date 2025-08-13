import adminAxios from "../adminAxios";

export const getAllCustomers = (params) => {
  return adminAxios.get("/customers", { params });
};

export const getCustomerById = (id) => {
  return adminAxios.get(`/customers/${id}`);
};

export const userCount = () => {
  return adminAxios.get("/customers/stats/count");
};

export const toggleBlockCustomer = (id) => {
  return adminAxios.patch(`/customers/${id}/toggle-block`);
};

export const updateCustomer = (id, userData) => {
  return adminAxios.put(`/customers/${id}`, userData);
};

export const deleteCustomer = (id) => {
  return adminAxios.delete(`/customers/${id}`);
};  