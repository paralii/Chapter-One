import userAxios from '../userAxios';

// Checkout the cart
export const checkout = (checkoutData) => {
  return userAxios.post("/cart/checkout", checkoutData, { withCredentials: true });
};
