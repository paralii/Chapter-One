import userAxios from "../userAxios";

export const getWishlist = () => {
  return userAxios.get("/wishlist");
};

export const addToWishlist = (productId) => {
  return userAxios.post(`/wishlist/add/${productId}`);
};

export const removeFromWishlist = (productId) => {
  return userAxios.post(`/wishlist/remove/${productId}`);
};

export const moveToCart = (productId) => {
  return userAxios.post(`/wishlist/move-to-cart/${productId}`);
};