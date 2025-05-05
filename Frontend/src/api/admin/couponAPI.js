import adminAxios from "../adminAxios";

// Create a new coupon
export const createCoupon = (couponData) => {
  return adminAxios.post("/coupons/create", couponData);
};

// Delete a coupon by ID
export const deleteCoupon = (id) => {
  return adminAxios.delete(`/coupons/${id}`);
};

// Optional: List coupons (if needed)
export const listCoupons = (params) => {
  return adminAxios.get("/coupons/list", { params });
};
