import adminAxios from "../adminAxios";

export const createOffer = (data) => adminAxios.post("/offers/create", data);

export const getOffers = (type, includeInactive = false) => adminAxios.get(`/offers?type=${type}&includeInactive=${includeInactive}`);

export const getOfferById = (offerId) => adminAxios.get(`/offers/${offerId}`);

export const updateOffer = (offerId, data) => adminAxios.put(`/offers/${offerId}/update`, data);