import adminAxios from "../adminAxios";

export const getCoupons = (params) => {
  return adminAxios.get("/coupons", { params });
};

export const getCouponById = (id) => {
  return adminAxios.get(`/coupons/${id}`)
} 

export const createCoupon = (couponData) => {
  return adminAxios.post("/coupons/create", couponData);
};

export const updateCoupon = (couponId, data) => {
  return adminAxios.put(`coupons/${couponId}/update`, data);
}

export const deleteCoupon = (id) => {
  return adminAxios.delete(`/coupons/${id}/delete`);
};