import userAxios from '../userAxios';

export const checkout = (checkoutData) => {
  return userAxios.post("/checkout", checkoutData, { withCredentials: true });
};
