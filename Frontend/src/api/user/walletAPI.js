import userAxios from "../userAxios";

export const getWallet = () => {
  return userAxios.get("/wallet");
};

export const getWalletTransactions = () => {
  return userAxios.get("/wallet/transactions");
};

export default { getWallet, getWalletTransactions };
