import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Heart, Heart as HeartFilled } from "lucide-react";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../api/user/wishlistAPI";
import { showAlert } from "../../redux/alertSlice";

// Utility fallback image
const getImageUrl = (url) => url || "https://via.placeholder.com/150x200?text=No+Image";

// ⭐ Home Page Card - Simple, Small, Clean
export const HomeProductCard = ({ product }) => {
  const imgUrl = getImageUrl(product.product_imgs?.[0]);
  const discount = product.discount || 0;

  return (
    <div className="relative flex flex-col items-center bg-white rounded-lg shadow-md p-3 transition-transform duration-200 hover:scale-105 w-full max-w-[200px] sm:max-w-[220px] lg:max-w-[230px] mx-auto h-full">
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-[#3c2712] text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          {discount}% OFF
        </div>
      )}

      <img
        src={imgUrl}
        alt={product.title || "Book Cover"}
        className="w-[120px] h-[160px] sm:w-[140px] sm:h-[180px] rounded-md object-cover"
      />
      <div className="flex flex-col text-center mt-3 flex-1 w-full">
        <h3 className="text-[14px] sm:text-[13px] font-semibold break-words text-center mb-2">
          {product.title || "Untitled Book"}
        </h3>
        <div className="text-[#ffd700] mb-2 text-xs flex justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`ti ti-star ${i < (product.rating || 0) ? "" : "opacity-50"}`}></i>
          ))}
        </div>
        <div className="font-medium text-[13px] mb-2">
          {discount > 0 ? (
            <div>
              <span className="text-gray-500 line-through text-[12px]">₹{product.originalPrice}</span>{" "}
              <span className="text-[#4caf50]">₹{product.price}</span>
            </div>
          ) : (
            <span className="text-[#4caf50]">
              {product.price ? `₹${product.price}` : "Not Available"}
            </span>
          )}
        </div>
        <div className="mt-auto">
          <Link
            to={`/products/${product._id}`}
            className="inline-block px-3 py-1 bg-[#3c2712] text-white rounded text-[11px] sm:text-[12px] font-medium transition-all hover:bg-[#5a3a1a]"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};


export const ListProductCard = ({ product }) => {
  const imgUrl = getImageUrl(product.product_imgs?.[0]);
  const discount = product.discount || 0;
  const dispatch = useDispatch();
  const [isInWishlist, setIsInWishlist] = useState(false);

  const fetchWishlistStatus = async () => {
    try {
      const res = await getWishlist();
      const wishlistItems = Array.isArray(res?.data?.wishlist?.products)
        ? res.data.wishlist.products
        : [];
      setIsInWishlist(
        wishlistItems.some((item) => item.product_id._id === product._id)
      );
    } catch (err) {
      console.error("Error fetching wishlist", err);
    }
  };

  useEffect(() => {
    fetchWishlistStatus();
  }, [product._id]);

  const toggleWishlist = async () => {
    try {
      if (isInWishlist) {
        await removeFromWishlist(product._id);
        dispatch(showAlert({ message: "Removed from wishlist!", type: "success" }));
      } else {
        await addToWishlist(product._id);
        dispatch(showAlert({ message: "Added to wishlist!", type: "success" }));
      }
      setIsInWishlist(!isInWishlist);
    } catch (err) {
      dispatch(showAlert({ message: "Failed to update wishlist", type: "error" }));
    }
  };

  return (
    <div className="relative flex flex-col bg-white rounded-lg shadow-md p-3 transition-transform duration-200 hover:scale-105 w-full h-full">
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-md shadow">
          {discount}% OFF
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={toggleWishlist}
        className="absolute top-2 right-2 text-[#fca120] hover:text-[#e28f00] transition"
        title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {isInWishlist ? (
          <HeartFilled className="w-6 h-6 fill-[#fca120]" />
        ) : (
          <Heart className="w-6 h-6" />
        )}
      </button>

      {/* Product Image */}
      <img
        src={imgUrl}
        alt={product.title}
        className="w-full h-[160px] sm:h-[180px] object-cover rounded-md"
      />

      {/* Product Info */}
      <div className="flex flex-col flex-1 mt-3">
        <h3 className="text-[14px] sm:text-[13px] font-semibold text-[#3c2712] truncate mb-1">
          {product.title || "Untitled Book"}
        </h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {product.description || "No description available"}
        </p>

        {/* Ratings */}
        <div className="flex justify-center gap-0.5 text-yellow-500 text-xs mb-2">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`ti ti-star ${
                i < (product.rating || 0) ? "" : "opacity-30"
              }`}
            />
          ))}
        </div>

        {/* Price */}
        <div className="font-medium text-[13px] mb-3">
          {discount > 0 ? (
            <div>
              <span className="text-gray-400 line-through text-[12px] mr-1">
                ₹{product.originalPrice}
              </span>
              <span className="text-[#4caf50]">₹{product.price}</span>
            </div>
          ) : (
            <span className="text-[#4caf50]">₹{product.price}</span>
          )}
        </div>

        {/* View Button */}
        <Link
          to={`/products/${product._id}`}
          className="inline-block mt-auto px-3 py-1 bg-[#3c2712] text-white rounded-full text-[12px] hover:bg-[#5a3a1a] text-center"
        >
          View
        </Link>
      </div>
    </div>
  );
};


export const RelatedProductCard = ({ product }) => {
  const imgUrl = getImageUrl(product.product_imgs?.[0]);
  const discount = product.discount || 0;

  return (
    <div className="relative flex flex-col items-center bg-white rounded-xl shadow-lg p-4 transition-transform duration-300 hover:scale-105 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[230px] mx-auto">
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
          {discount}% OFF
        </div>
      )}

      {/* Product Image */}
      <img
        src={imgUrl}
        alt={product.title || "Product Image"}
        className="w-full h-[200px] sm:h-[220px] lg:h-[240px] rounded-md object-cover"
        loading="lazy"
      />

      {/* Product Info */}
      <div className="text-center mt-3 flex flex-col items-center">
        <h3 className="text-sm sm:text-[15px] font-semibold line-clamp-2">
          {product.title || "Untitled Product"}
        </h3>

        {/* Rating */}
        <div className="flex mt-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${i < (product.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.947a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.947c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.947a1 1 0 00-.364-1.118L2.025 9.374c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.947z" />
            </svg>
          ))}
        </div>

        {/* Price */}
        <div className="font-medium text-sm sm:text-[14px]">
          {discount > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-1">
              <span className="text-gray-400 line-through text-[12px]">₹{product.originalPrice}</span>
              <span className="text-green-600 font-semibold">₹{product.price}</span>
            </div>
          ) : (
            <span className="text-green-600 font-semibold">
              {product.price ? `₹${product.price}` : "Not Available"}
            </span>
          )}
        </div>

        {/* View Details Button */}
        <Link
          to={`/products/${product._id}`}
          className="mt-2 px-4 py-1 bg-[#3c2712] text-white rounded-md text-[12px] sm:text-[13px] font-medium hover:bg-[#5a3a1a] transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};


export const WishlistItem = ({ item, onAddToCart, onRemove }) => {
  if (!item?.product_id) return null;

  const imgUrl = getImageUrl(item.product_id.product_imgs?.[0]);
  const discount = item.product_id.discountPercentage || 0;

  return (
    <div className="relative flex flex-col items-center bg-white rounded-lg shadow-md p-3 transition-transform duration-200 hover:scale-105 w-full max-w-[200px] sm:max-w-[220px] lg:max-w-[230px] mx-auto h-full">
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-[#3c2712] text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          {discount}% OFF
        </div>
      )}

      <img
        src={imgUrl || "/placeholder.svg"}
        alt={item.product_id.title || "Book Cover"}
        className="w-[120px] h-[160px] sm:w-[140px] sm:h-[180px] rounded-md object-cover"
      />

      <div className="flex flex-col text-center mt-3 flex-1 w-full">
        <h3 className="text-[14px] sm:text-[13px] font-semibold break-words text-center mb-1">
          {item.product_id.title || "Untitled Book"}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">
          {item.product_id.author_name || "Unknown Author"}
        </p>

        <div className="font-medium text-[13px] mb-2">
          {discount > 0 ? (
            <div>
              <span className="text-gray-500 line-through text-[12px] mr-1">
                ₹{item.product_id.originalPrice}
              </span>
              <span className="text-[#4caf50]">₹{item.product_id.price}</span>
            </div>
          ) : (
            <span className="text-[#4caf50]">
              {item.product_id.price ? `₹${item.product_id.price}` : "Not Available"}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col sm:flex-row justify-center gap-2">
          <button
            onClick={() => onAddToCart(item.product_id._id)}
            className="flex-1 px-3 py-1 bg-[#3c2712] text-white rounded text-[11px] sm:text-[12px] font-medium transition-all hover:bg-[#5a3a1a]"
          >
            Add to Cart
          </button>
          <button
            onClick={() => onRemove(item.product_id._id)}
            className="flex-1 px-3 py-1 bg-gray-800 text-white rounded text-[11px] sm:text-[12px] font-medium transition-all hover:bg-gray-900"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
