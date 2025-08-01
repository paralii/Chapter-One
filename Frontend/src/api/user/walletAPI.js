import userAxios from "../userAxios";

export const getWallet = () => {
  return userAxios.get("/wallet/details"); 
};

export const getWalletBalance = () => {
  return userAxios.get("/wallet/balance"); 
};

export const creditWallet = (data) => {
  return userAxios.post("/wallet/credit", data); 
};

export const debitWallet = (data) => {
  return userAxios.post("/wallet/debit", data); 
};

export const checkIntegrity = () => {
  return userAxios.post("/wallet/integrity-check"); 
};

export default {
  getWallet,
  getWalletBalance,
  creditWallet,
  debitWallet,
  checkIntegrity,
};
