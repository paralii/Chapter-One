import adminAxios from "../adminAxios";

export const getCategories = (params) => {
  return adminAxios.get("/categories", { params });
};

export const createCategory = (categoryData) => {
  return adminAxios.post("/categories", categoryData);
};

export const updateCategory = (id, categoryData) => {
  return adminAxios.put(`/categories/${id}`, categoryData);
};

export const deleteCategory = (id,{params}) => {
  return adminAxios.patch(`/categories/${id}`, params);
};

export const getBooksByCategory = async (category) => {
    try {
        const response = await adminAxios.get(`/categories/${category}/bokks`);
        return response.data;
    } catch (error) {
        console.error("Error fetching books by category:", error);
        return null;
    }
};