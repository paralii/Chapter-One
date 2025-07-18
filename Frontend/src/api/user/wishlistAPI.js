import userAxios from "../userAxios";

// Fetch wishlist
export const getWishlist = () => {
  return userAxios.get("/wishlist");
};

// Add product to wishlist
export const addToWishlist = (productId) => {
  return userAxios.post(`/wishlist/add/${productId}`);
};

// Remove product from wishlist
export const removeFromWishlist = (productId) => {
  return userAxios.post(`/wishlist/remove/${productId}`);
};

// Move product from wishlist to cart
export const moveToCart = (productId) => {
  return userAxios.post(`/wishlist/move-to-cart/${productId}`);
};