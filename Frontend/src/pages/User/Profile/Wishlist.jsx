import React, { useEffect, useState } from "react";
import WishlistItem from "../../../components/User/WishlistItem";
import { getWishlist, removeFromWishlist } from "../../../api/user/wishlistAPI";
import { addToCart } from "../../../api/user/cartAPI";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await getWishlist();
      // Extract products from the wishlist response
      setWishlist(response.data.wishlist.products); 
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart({ product_id: productId, quantity: 1 });
      await handleRemove(productId); 
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleRemove = async (productId) => {
    try {
      // Call the API to remove product from wishlist
      await removeFromWishlist(productId);

      // Update the wishlist state by filtering out the removed product
      setWishlist(wishlist.filter((item) => item.product_id._id !== productId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 p-6">
      <h2 className="text-4xl font-bold text-yellow-900 text-center mb-6">My Wishlist</h2>
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <WishlistItem
                key={item.product_id}
                item={item}
                onAddToCart={handleAddToCart}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          <p className="text-lg text-gray-600 text-center">Your wishlist is empty.</p>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
