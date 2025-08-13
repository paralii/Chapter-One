import React, { useEffect, useState } from "react";
import { WishlistItem } from "../../../../components/User/ProductCard";
import { getWishlist, removeFromWishlist, moveToCart } from "../../../../api/user/wishlistAPI";
import Navbar from "../../../../components/common/Navbar";
import Footer from "../../../../components/common/Footer";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../../redux/alertSlice";
const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await getWishlist();
      const wishlistItems = response.data.wishlist?.products || [];
      const validItems = wishlistItems.filter(item => item.product_id && item.product_id._id);
      setWishlist(validItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setError("Failed to load wishlist. Please try again.");
            dispatch(showAlert({ message: "Failed to load wishlist.", type: "error" }));

    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const response = await moveToCart(productId);
      console.log("Move to cart response:", response.data);
      setWishlist(wishlist.filter((item) => item.product_id._id !== productId));
      dispatch(showAlert({ message: "Product moved to cart!", type: "success" }));
    } catch (error) {
      console.error("Error moving to cart:", error);
      const message = error.response?.data?.message || "Failed to move product to cart.";
      dispatch(showAlert({ message, type: "error" }));
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setWishlist(wishlist.filter((item) => item.product_id._id !== productId));
      dispatch(showAlert({ message: "Product removed from wishlist!", type: "success" }));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      const message = error.response?.data?.message || "Failed to remove product from wishlist.";
      dispatch(showAlert({ message, type: "error" }));
    }
  };

  return (
    <>
    <div className="min-h-screen flex flex-col bg-[#fff]">
        <Navbar />
      <div className="bg-[#fff8e5] pt-6 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <h2 className="text-4xl font-semibold text-[#3c2712] text-center mb-8">My Wishlist</h2>
          {loading ? (
            <p className="text-lg text-gray-700 text-center">Loading wishlist...</p>
          ) : error ? (
            <p className="text-lg text-red-500 text-center">{error}</p>
          ) : wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <WishlistItem
                  key={item.product_id._id}
                  item={item}
                  onAddToCart={handleAddToCart}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          ) : (
            <p className="text-lg text-gray-700 text-center">Your wishlist is empty.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
        </>
  );
};

export default WishlistPage;