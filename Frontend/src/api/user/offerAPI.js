import userAxios from "../userAxios";

export const getReferralOffer = () => userAxios.get("/offers/referral");
export const getReferralCoupons = () => userAxios.get("/offers/referral/coupons");
export const applyReferral = (referralCode) => userAxios.post("/offers/referral/apply", { referralCode });
export const getReferralStats = () => userAxios.get("/offers/referral-stats");