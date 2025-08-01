import userAxios from "../userAxios";

export const addAddress = (addressData) => {
  return userAxios.post("/addresses", addressData);
};

export const getAddresses = () => {
  return userAxios.get("/addresses");
};

export const updateAddress = (id, addressData) => {
  return userAxios.put(`/addresses/${id}`, addressData);
};

export const deleteAddress = (id) => {
  return userAxios.delete(`/addresses/${id}`);
};

export const setDefaultAddress = (id) => {
  return userAxios.put(`/addresses/default/${id}`);
};
