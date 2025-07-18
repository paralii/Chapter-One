import adminAxios from "../adminAxios";

export const getAllCoupons = (params) => {
  return adminAxios.get("/coupons", { params });
};

export const getCouponById = (id) => {
  return adminAxios.get(`/coupons/${id}`)
} 

export const createCoupon = (couponData) => {
  return adminAxios.post("/coupons/create", couponData);
};

export const deleteCoupon = (id) => {
  return adminAxios.delete(`/coupons/${id}/delete`);
};

export const updateCoupon = (couponId, data) => {
  return adminAxios.put(`coupons/${couponId}/update`, data);
}