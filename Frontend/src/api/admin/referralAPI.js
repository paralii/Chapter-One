import adminAxios from "../adminAxios";

// Generate a referral coupon for a given referrerId.
// This sends a POST request to the backend endpoint /referral/generate-coupon.
export const generateReferralCoupon = (referrerId) => {
  return adminAxios.post("/referral/generate-coupon", { referrerId });
};

export default {
  generateReferralCoupon,
};
