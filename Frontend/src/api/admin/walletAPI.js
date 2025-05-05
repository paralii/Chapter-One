import adminAxios from "../adminAxios";

// Get wallet details for a given user (admin view)
// Assumes backend route: GET /wallet/:userId
export const getWalletByUserId = (userId) => {
  return adminAxios.get(`/wallet/${userId}`);
};

// Get wallet transactions for a given user (admin view)
// Assumes backend route: GET /wallet/:userId/transactions
export const getWalletTransactionsByUserId = (userId) => {
  return adminAxios.get(`/wallet/${userId}/transactions`);
};

export default {
  getWalletByUserId,
  getWalletTransactionsByUserId,
};
