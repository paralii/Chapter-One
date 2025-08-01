import axios from "axios";
import store from "./redux/store";
import { refreshAdminSession, logoutAdmin } from "./redux/adminSlice";

const adminAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/admin`,
  withCredentials: true,
});

adminAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await store.dispatch(refreshAdminSession());
        return adminAxios(originalRequest);
      } catch (err) {
        store.dispatch(logoutAdmin());
        window.location.href = "/admin/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

const handleApiResponse = async (request) => {
  try {
    const response = await request;
    if (!response.data.success) {
      throw new Error(response.data.message || "API request failed");
    }
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "API request failed");
  }
};

// Referral APIs
export const generateReferralCoupon = async (referrerId) => {
  return handleApiResponse(adminAxios.post("/referral/generate-coupon", { referrerId }));
};

// Category APIs
export const getCategories = async (params) => {
  return handleApiResponse(adminAxios.get("/categories", { params }));
};

export const createCategory = async (categoryData) => {
  return handleApiResponse(adminAxios.post("/categories", categoryData));
};

export const updateCategory = async (id, categoryData) => {
  return handleApiResponse(adminAxios.put(`/categories/${id}`, categoryData));
};

export const deleteCategory = async (id) => {
  return handleApiResponse(adminAxios.delete(`/categories/${id}`));
};

// Auth APIs
export const adminLogin = async (credentials) => {
  return handleApiResponse(adminAxios.post("/login", credentials));
};

export const adminLogout = async () => {
  return handleApiResponse(adminAxios.post("/logout"));
};

export const refreshAdminToken = async () => {
  return handleApiResponse(adminAxios.post("/refresh-token"));
};

// Sales Report APIs
export const getDailySalesReport = async (params) => {
  return handleApiResponse(adminAxios.get("/sales-report/daily", { params }));
};

export const getWeeklySalesReport = async (params) => {
  return handleApiResponse(adminAxios.get("/sales-report/weekly", { params }));
};

export const getYearlySalesReport = async (params) => {
  return handleApiResponse(adminAxios.get("/sales-report/yearly", { params }));
};

export const getCustomSalesReport = async (params) => {
  return handleApiResponse(adminAxios.get("/sales-report/custom", { params }));
};

export const getSalesReport = async (params) => {
  return handleApiResponse(adminAxios.get("/sales-report", { params }));
};

export const downloadSalesReportPdf = async (params) => {
  try {
    const response = await adminAxios.get("/sales-report/download/pdf", {
      params,
      responseType: "blob",
    });
    return response; // Return full response for blob
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Failed to download PDF report");
  }
};

export const downloadSalesReportExcel = async (params) => {
  try {
    const response = await adminAxios.get("/sales-report/download/excel", {
      params,
      responseType: "blob",
    });
    return response; // Return full response for blob
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Failed to download Excel report");
  }
};

// Coupon APIs
export const getAllCoupons = async (params) => {
  return handleApiResponse(adminAxios.get("/coupons", { params }));
};

export const getCouponById = async (id) => {
  return handleApiResponse(adminAxios.get(`/coupons/${id}`));
};

export const createCoupon = async (couponData) => {
  return handleApiResponse(adminAxios.post("/coupons/create", couponData));
};

export const deleteCoupon = async (id) => {
  return handleApiResponse(adminAxios.delete(`/coupons/${id}/delete`));
};

export const updateCoupon = async (couponId, data) => {
  return handleApiResponse(adminAxios.put(`/coupons/${couponId}/update`, data));
};

// Inventory APIs
export const getInventory = async () => {
  return handleApiResponse(adminAxios.get("/inventory"));
};

export const updateStock = async (stockData) => {
  return handleApiResponse(adminAxios.post(`/inventory/update`, stockData));
};

export const lowStock = async (data) => {
  return handleApiResponse(adminAxios.get(`/inventory/low-stock`, { params: data }));
};

export const inventoryReport = async () => {
  return handleApiResponse(adminAxios.get("/inventory/report"));
};

// Order APIs
export const listOrdersAdmin = async (params) => {
  return handleApiResponse(adminAxios.get("/orders", { params }));
};

export const getOrderDetailsAdmin = async (orderId) => {
  const response = await handleApiResponse(adminAxios.get(`/orders/${orderId}`));
  return response.order; // Maintain original return structure
};

export const updateOrderStatus = async (orderId, status) => {
  return handleApiResponse(adminAxios.put(`/orders/${orderId}/status`, { status }));
};

export const markItemDelivered = async (orderId, productId) => {
  return handleApiResponse(adminAxios.patch("/orders/item/delivered", { orderId, productId }));
};

export const softDeleteOrder = async (orderId) => {
  return handleApiResponse(adminAxios.delete(`/orders/${orderId}`));
};

export const downloadAdminInvoice = async (orderId) => {
  try {
    const response = await adminAxios.get(`/orders/${orderId}/invoice`, {
      responseType: "blob",
    });
    return response; // Return full response for blob
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Failed to download invoice");
  }
};

export const verifyReturnRequest = async (orderId, productId, returnApproved) => {
  return handleApiResponse(adminAxios.post("/orders/return/verify", {
    orderId,
    productId,
    returnApproved,
  }));
};

// User APIs
export const getAllUsers = async (params) => {
  return handleApiResponse(adminAxios.get("/customers", { params }));
};

export const createUser = async (userData) => {
  return handleApiResponse(adminAxios.post("/customers", userData));
};

export const getUserCount = async () => {
  return handleApiResponse(adminAxios.get("/customers/count"));
};

export const getUserById = async (id) => {
  return handleApiResponse(adminAxios.get(`/customers/${id}`));
};

export const updateUser = async (id, userData) => {
  return handleApiResponse(adminAxios.put(`/customers/${id}`, userData));
};

export const toggleBlockUser = async (id) => {
  return handleApiResponse(adminAxios.patch(`/customers/${id}/toggle-block`));
};

export const deleteUser = async (id) => {
  return handleApiResponse(adminAxios.delete(`/customers/${id}`));
};

// Offer APIs
export const createOffer = async (data) => {
  return handleApiResponse(adminAxios.post("/offers/create", data));
};

export const getOffers = async (type, includeInactive = false) => {
  return handleApiResponse(adminAxios.get(`/offers?type=${type}&includeInactive=${includeInactive}`));
};

export const getOfferById = async (offerId) => {
  return handleApiResponse(adminAxios.get(`/offers/${offerId}`));
};

export const getReferralOffers = async ({ offerId, search = "", page = 1, limit = 10 }) => {
  const data = {
    offerId: offerId || undefined,
    search: search.trim() || undefined,
    page: Math.max(1, parseInt(page)),
    limit: Math.max(1, parseInt(limit)),
  };
  return handleApiResponse(adminAxios.post("/offers/referrals", data));
};

export const updateOffer = async (offerId, data) => {
  return handleApiResponse(adminAxios.put(`/offers/${offerId}/update`, data));
};

export const toggleReferralOffer = async (offerId, data) => {
  return handleApiResponse(adminAxios.put(`/offers/${offerId}/toggle-referral`, data));
};

// Product APIs
export const getProducts = async (params) => {
  return handleApiResponse(adminAxios.get("/products", { params }));
};

export const createProduct = async (productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    if (key !== "images") {
      formData.append(key, productData[key]);
    }
  });
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image) => {
      formData.append("images", image);
    });
  }
  return handleApiResponse(adminAxios.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

export const getProductById = async (id) => {
  return handleApiResponse(adminAxios.get(`/products/${id}`));
};

export const updateProduct = async (id, productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    if (key !== "images") {
      formData.append(key, productData[key]);
    }
  });
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image) => {
      formData.append("images", image);
    });
  }
  return handleApiResponse(adminAxios.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

export const toggleProductListing = async (id) => {
  return handleApiResponse(adminAxios.patch(`/products/${id}/toggle`));
};

export const deleteProduct = async (id) => {
  return handleApiResponse(adminAxios.delete(`/products/${id}`));
};