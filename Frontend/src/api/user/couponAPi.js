import userAxios from "../userAxios";

export const getAvailableCoupons = (params) => {
  return userAxios.get("/coupons", { params });
};

export const applyCoupon = (data) => {
  return userAxios.post("/coupons/apply", data);
};

export const removeCoupon = (data) => {
  return userAxios.post("/coupons/remove", data);
};