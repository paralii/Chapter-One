import userAxios from '../userAxios';

// Checkout the cart
export const checkout = (checkoutData) => {
  return userAxios.post("/checkout", checkoutData, { withCredentials: true });
};
