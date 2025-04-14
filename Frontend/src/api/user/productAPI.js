import userAxios from "../userAxios";

export const getProducts = (params) => {
    return userAxios.get("/products", { params });
};

export const getProductById = (id) => {
  return userAxios.get(`/products/${id}`);
};

