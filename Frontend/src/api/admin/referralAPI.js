import adminAxios from "../adminAxios";

export const generateReferralCoupon = (referrerId) => {
  return adminAxios.post("/referral/generate-coupon", { referrerId });
};

export default {
  generateReferralCoupon,
};
