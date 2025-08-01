import adminAxios from "../adminAxios";

export const getWalletByUserId = (userId) => {
  return adminAxios.get(`/wallet/${userId}`);
};

export const getWalletTransactionsByUserId = (userId) => {
  return adminAxios.get(`/wallet/${userId}/transactions`);
};

export default {
  getWalletByUserId,
  getWalletTransactionsByUserId,
};
