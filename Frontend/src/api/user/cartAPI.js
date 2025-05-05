// src/api/cartAPI.js
import userAxios from '../userAxios';

// Get the user's cart
export const getCart = () => {
  return userAxios.get("/", { withCredentials: true });
};

// Add a product to the cart
export const addToCart = (cartData) => {
  return userAxios.post("/add", cartData, { withCredentials: true });
};

// Update quantity of a specific product in the cart
export const updateCartItemQuantity = (updateData) => {
  return userAxios.patch("/update", updateData, { withCredentials: true });
};

// Increment product quantity in the cart
export const incrementCartItemQuantity = (productData) => {
  return userAxios.patch("/increment", productData, { withCredentials: true });
};

// Decrement product quantity in the cart
export const decrementCartItemQuantity = (productData) => {
  return userAxios.patch("/decrement", productData, { withCredentials: true });
};

// Remove a product from the cart
export const removeCartItem = (productId) => {
  return userAxios.delete(`/remove/${productId}`, { withCredentials: true });
};
