import adminAxios from "../adminAxios";

export const createOffer = (data) => adminAxios.post("/offers/create", data);
export const getOffers = (type, includeInactive = false) =>
  adminAxios.get(`/offers?type=${type}&includeInactive=${includeInactive}`);
export const getOfferById = (offerId) => adminAxios.get(`/offers/${offerId}`);

export const getReferralOffers = async ({ offerId, search = "", page = 1, limit = 10 }) => {
  const data = {
    offerId: offerId || undefined,
    search: search.trim() || undefined,
    page: Math.max(1, parseInt(page)),
    limit: Math.max(1, parseInt(limit)),
  };
  return adminAxios.post("/offers/referrals", data);
};

export const updateOffer = async (offerId, data) => {
  return adminAxios.put(`/offers/${offerId}/update`, data);
};

export const toggleReferralOffer = async (offerId, data) => {
  return adminAxios.put(`/offers/${offerId}/toggle-referral`, data);
};