import userAxios from "../userAxios";

export const applyCoupon = (data) => {
  return userAxios.post("/apply-coupon", data);
};

export const removeCoupon = () => {
  return userAxios.post("/remove-coupon");
};

export const getAllCoupons = (params) => {
  return userAxios.get("/coupons", { params });
};

