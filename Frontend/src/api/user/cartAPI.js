import userAxios from '../userAxios';

export const getCart = () => {
  return userAxios.get("/", { withCredentials: true });
};

export const addToCart = (cartData) => {
  return userAxios.post("/add", cartData, { withCredentials: true });
};

export const updateCartItemQuantity = (updateData) => {
  return userAxios.patch("/update", updateData, { withCredentials: true });
};

export const incrementCartItemQuantity = (productData) => {
  return userAxios.patch("/increment", productData, { withCredentials: true });
};

export const decrementCartItemQuantity = (productData) => {
  return userAxios.patch("/decrement", productData, { withCredentials: true });
};

export const removeCartItem = (productId) => {
  return userAxios.delete(`/remove/${productId}`, { withCredentials: true });
};
