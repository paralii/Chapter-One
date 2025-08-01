import axios from "axios";

// Create userAxios instance with interceptor
const userAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/user`,
  withCredentials: true,
});

userAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status &&
      [401, 403].includes(error.response.status) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        return userAxios(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Helper function for consistent error handling
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

// Authentication APIs
export const googleAuth = async () => {
  return handleApiResponse(userAxios.get("/auth/google"));
};

// Auth APIs
export const signupUser = async (userData) => {
  return handleApiResponse(userAxios.post("/signup", userData));
};

export const loginUser = async (credentials) => {
  return handleApiResponse(userAxios.post("/login", credentials, { withCredentials: true }));
};

export const logoutUser = async () => {
  return handleApiResponse(userAxios.post("/logout", {}, { withCredentials: true }));
};

export const forgotPassword = async (email) => {
  return handleApiResponse(userAxios.post("/forgot-password", { email }));
};

export const resetPassword = async (data) => {
  return handleApiResponse(userAxios.post("/reset-password", data));
};

// User Profile APIs
export const getUserProfile = async () => {
  return handleApiResponse(userAxios.get("/profile"));
};

export const updateUserProfile = async (profileData) => {
  return handleApiResponse(userAxios.put("/profile", profileData));
};

export const changeUserPassword = async (oldPassword, newPassword) => {
  return handleApiResponse(userAxios.put("/profile/change-password", { oldPassword, newPassword }));
};

export const uploadProfileImage = async (formData) => {
  return handleApiResponse(userAxios.put("/profile/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

export const requestEmailChange = async (newEmail) => {
  return handleApiResponse(userAxios.post("/profile/request-email-change", { newEmail }));
};

export const resendOTP = async (email) => {
  return handleApiResponse(userAxios.post("/profile/resend-otp", { email }));
};

export const confirmEmailChange = async (otp, emailChangeToken) => {
  return handleApiResponse(userAxios.post("/profile/confirm-email-change", { otp, emailChangeToken }));
};

// Cart APIs
export const getCart = async () => {
  return handleApiResponse(userAxios.get("/", { withCredentials: true }));
};

export const addToCart = async (cartData) => {
  return handleApiResponse(userAxios.post("/add", cartData, { withCredentials: true }));
};

export const updateCartItemQuantity = async (updateData) => {
  return handleApiResponse(userAxios.patch("/update", updateData, { withCredentials: true }));
};

export const incrementCartItemQuantity = async (productData) => {
  return handleApiResponse(userAxios.patch("/increment", productData, { withCredentials: true }));
};

export const decrementCartItemQuantity = async (productData) => {
  return handleApiResponse(userAxios.patch("/decrement", productData, { withCredentials: true }));
};

export const removeCartItem = async (productId) => {
  return handleApiResponse(userAxios.delete(`/remove/${productId}`, { withCredentials: true }));
};

// Checkout APIs
export const checkout = async (checkoutData) => {
  return handleApiResponse(userAxios.post("/checkout", checkoutData, { withCredentials: true }));
};

// Offer APIs
export const getReferralOffer = async () => {
  return handleApiResponse(userAxios.get("/offers/referral"));
};

export const getReferralCoupons = async () => {
  return handleApiResponse(userAxios.get("/offers/referral/coupons"));
};

export const applyReferral = async (referralCode) => {
  return handleApiResponse(userAxios.post("/offers/referral/apply", { referralCode }));
};

export const getReferralStats = async () => {
  return handleApiResponse(userAxios.get("/offers/referral-stats"));
};

// Category APIs
export const getCategories = async (params) => {
  return handleApiResponse(userAxios.get("/categories", { params }));
};

export const getBooksByCategory = async (categoryId, page, limit) => {
  return handleApiResponse(userAxios.get(`/categories/${categoryId}`, { params: { page, limit } }));
};

// Product APIs
export const getProducts = async (params) => {
  return handleApiResponse(userAxios.get("/products", { params }));
};

export const getProductById = async (id) => {
  return handleApiResponse(userAxios.get(`/products/${id}`));
};

// Order APIs
export const createOrder = async (orderData) => {
  return handleApiResponse(userAxios.post("/orders", orderData, { withCredentials: true }));
};

export const createTempOrder = async (orderData) => {
  try {
    const response = await userAxios.post("/orders/temp", orderData);
    return { data: { success: true, order: response.data.order } };
  } catch (err) {
    return { data: { success: false, message: err.response?.data?.message || "Failed to create temp order" } };
  }
};

export const listOrders = async () => {
  return handleApiResponse(userAxios.get("/orders", { withCredentials: true }));
};

export const getPendingOrder = async () => {
  try {
    const response = await userAxios.get("/orders/pending");
    return { data: { success: true, order: response.data.order } };
  } catch (err) {
    return { data: { success: false, order: null, message: err.response?.data?.message || "No pending order" } };
  }
};

export const getOrderDetails = async (orderID) => {
  return handleApiResponse(userAxios.get(`/orders/${orderID}`, { withCredentials: true }));
};

export const cancelOrder = async (data) => {
  return handleApiResponse(userAxios.put("/orders/cancel", data, { withCredentials: true }));
};

export const returnOrder = async (data) => {
  return handleApiResponse(userAxios.put("/orders/return", data, { withCredentials: true }));
};

export const downloadInvoice = async (orderID) => {
  try {
    const response = await userAxios.get(`/orders/invoice/${orderID}`, {
      responseType: "blob",
      withCredentials: true,
    });
    return response; // Return full response for blob
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Failed to download invoice");
  }
};

// Coupon APIs
export const applyCoupon = async (data) => {
  return handleApiResponse(userAxios.post("/apply-coupon", data));
};

export const removeCoupon = async () => {
  return handleApiResponse(userAxios.post("/remove-coupon"));
};

export const getAllCoupons = async (params) => {
  return handleApiResponse(userAxios.get("/coupons", { params }));
};

// Address APIs
export const addAddress = async (addressData) => {
  return handleApiResponse(userAxios.post("/addresses", addressData));
};

export const getAddresses = async () => {
  return handleApiResponse(userAxios.get("/addresses"));
};

export const updateAddress = async (id, addressData) => {
  return handleApiResponse(userAxios.put(`/addresses/${id}`, addressData));
};

export const deleteAddress = async (id) => {
  return handleApiResponse(userAxios.delete(`/addresses/${id}`));
};

export const setDefaultAddress = async (id) => {
  return handleApiResponse(userAxios.put(`/addresses/default/${id}`));
};

// Payment APIs
export const createRazorpayOrder = async (data) => {
  return handleApiResponse(userAxios.post("/create-order", data));
};

export const verifyPaymentSignature = async (data) => {
  return handleApiResponse(userAxios.post("/verify-payment", data));
};

// Wallet APIs
export const getWallet = async () => {
  return handleApiResponse(userAxios.get("/wallet"));
};

export const getWalletTransactions = async () => {
  return handleApiResponse(userAxios.get("/wallet/transactions"));
};

// Wishlist APIs
export const getWishlist = async () => {
  return handleApiResponse(userAxios.get("/wishlist"));
};

export const addToWishlist = async (productId) => {
  return handleApiResponse(userAxios.post(`/wishlist/add/${productId}`));
};

export const removeFromWishlist = async (productId) => {
  return handleApiResponse(userAxios.post(`/wishlist/remove/${productId}`));
};

export const moveToCart = async (productId) => {
  return handleApiResponse(userAxios.post(`/wishlist/move-to-cart/${productId}`));
};