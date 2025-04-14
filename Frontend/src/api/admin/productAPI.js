import adminAxios from "../adminAxios";

export const getProducts = (params) => {
  return adminAxios.get("/products", { params });
};

export const createProduct = (productData) => {
  const formData = new FormData();
  // Append all non-image fields.
  Object.keys(productData).forEach((key) => {
    if (key !== "images") {
      formData.append(key, productData[key]);
    }
  });
  // Append each image file.
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image) => {
      formData.append("images", image);
    });
  }
  return adminAxios.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getProductById = (id) => {
  return adminAxios.get(`/products/${id}`);
};

export const updateProduct = (id, productData) => {
  const formData = new FormData();
  // Append non-image fields.
  Object.keys(productData).forEach((key) => {
    if (key !== "images") {
      formData.append(key, productData[key]);
    }
  });
  // Append image files if provided.
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image) => {
      formData.append("images", image);
    });
  }
  return adminAxios.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const toggleProductListing = (id) => {
  return adminAxios.patch(`/products/${id}/toggle`);
};

export const deleteProduct = (id) => {
  return adminAxios.delete(`/products/${id}`);
};