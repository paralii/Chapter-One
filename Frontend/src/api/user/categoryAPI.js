import userAxios from "../userAxios";

export const getCategories = (params) => {
  return userAxios.get("/categories", { params });
};

export const getBooksByCategory = (categoryId, page, limit) => {
  return userAxios.get(`/categories/${categoryId}`, {
    params: { page, limit },
  });
};
