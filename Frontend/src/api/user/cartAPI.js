import userAxios from '../userAxios';

export const getCart = () => {
  return userAxios.get("/cart", { withCredentials: true });
};

export const addToCart = (cartData) => {
  return userAxios.post("/cart/add", cartData, { withCredentials: true });
};

export const incrementCartItemQuantity = (productData) => {
  return userAxios.patch("/cart/increment", productData, { withCredentials: true });
};

export const decrementCartItemQuantity = (productData) => {
  return userAxios.patch("/cart/decrement", productData, { withCredentials: true });
};

export const removeCartItem = (productId) => {
  return userAxios.delete(`/cart/${productId}/remove`, { withCredentials: true });
};
