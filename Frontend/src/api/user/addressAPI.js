import userAxios from "../userAxios";

export const getAllUserAddresses = () => {
  return userAxios.get("/addresses");
};

export const getAddressById = (id) => {
  return userAxios.get(`/addresses/${id}`);
}

export const addAddress = (addressData) => {
  return userAxios.post("/addresses", addressData);
};

export const updateAddress = (id, addressData) => {
  return userAxios.put(`/addresses/${id}`, addressData);
};

export const deleteAddress = (id) => {
  return userAxios.delete(`/addresses/${id}`);
};

export const getDefaultAddress = () => {
  return userAxios.get("/addresses/default")
}

export const setDefaultAddress = (id) => {
  return userAxios.put(`/addresses/${id}/default`);
};
