import adminAxios from "../adminAxios";

// CATEGORY OFFER API
export const createCategoryOffer = (offerData) => adminAxios.post("/category-offers", offerData);
export const deleteCategoryOffer = (id) => adminAxios.delete(`/category-offers/${id}`);
export const getCategoryOffers = () => adminAxios.get("/category-offers"); // ✅ NEW

// PRODUCT OFFER API
export const createProductOffer = (offerData) => adminAxios.post("/product-offers", offerData);
export const deleteProductOffer = (id) => adminAxios.delete(`/product-offers/${id}`);
export const getProductOffers = () => adminAxios.get("/product-offers"); // ✅ NEW
export const getProductOfferById = (id) => adminAxios.get(`/product-offers/${id}`);
