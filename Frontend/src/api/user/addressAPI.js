import userAxios from "../userAxios";

// Add a new address
export const addAddress = (addressData) => {
  return userAxios.post("/addresses", addressData);
};

// Get all addresses of the user
export const getAddresses = () => {
  return userAxios.get("/addresses");
};

// Update a specific address by ID
export const updateAddress = (id, addressData) => {
  return userAxios.put(`/addresses/${id}`, addressData);
};

// Delete a specific address by ID
export const deleteAddress = (id) => {
  return userAxios.delete(`/addresses/${id}`);
};

// Set an address as the default
export const setDefaultAddress = (id) => {
  return userAxios.put(`/addresses/default/${id}`);
};
