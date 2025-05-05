import userAxios from "../userAxios";

export const applyCoupon = (data) => {
  return userAxios.post("/apply", data);
};

export const removeCoupon = () => {
  return userAxios.post("/remove");
};

export const listCoupons = (params) => {
  return userAxios.get("/list", { params });
};

export default { applyCoupon, removeCoupon, listCoupons };
