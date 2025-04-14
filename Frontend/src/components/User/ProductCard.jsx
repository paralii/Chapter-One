import React from "react";
import { Link } from "react-router-dom";

// Utility fallback image
const getImageUrl = (url) => url || "https://via.placeholder.com/150x200?text=No+Image";

// ⭐ Home Page Card - Simple, Small, Clean
export const HomeProductCard = ({ product }) => {
  const imgUrl = getImageUrl(product.product_imgs?.[0]);
  const discount = product.discountPercentage || 0;

  return (
    <div className="relative flex flex-col items-center bg-white rounded-lg shadow-md p-3 transition-transform duration-200 hover:scale-105 w-full max-w-[200px] sm:max-w-[220px] lg:max-w-[230px] mx-auto">
      {/* Offer Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md animate-bounce">
          {discount}% OFF
        </div>
      )}

      {/* Product Image */}
      <img
        src={imgUrl}
        alt={product.title || "Book Cover"}
        className="w-[120px] h-[160px] sm:w-[140px] sm:h-[180px] rounded-md object-cover"
      />

      {/* Details */}
      <div className="text-center mt-3">
        <h3 className="text-[14px] sm:text-[15px] font-semibold truncate w-full max-w-[180px]">
          {product.title || "Untitled Book"}
        </h3>

        {/* Rating */}
        <div className="text-[#ffd700] mt-1 mb-1 text-xs flex justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`ti ti-star ${i < (product.rating || 0) ? "" : "opacity-50"}`}></i>
          ))}
        </div>

        {/* Price */}
        <div className="font-medium text-[13px]">
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

        {/* Button */}
        <Link
          to={`/products/${product._id}`}
          className="inline-block mt-2 px-3 py-1 bg-[#3c2712] text-white rounded text-[11px] sm:text-[12px] font-medium transition-all hover:bg-[#5a3a1a]"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export const ListProductCard = ({ product }) => {
  const imgUrl = product.product_imgs?.[0] || "https://via.placeholder.com/150x200?text=No+Image";
  const discount = product.discountPercentage || 0;

  return (
    <div className="relative flex flex-col bg-white rounded-lg shadow-md p-4 transition duration-200 hover:shadow-lg w-full max-w-[260px] mx-auto">
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-md">
          {discount}% OFF
        </div>
      )}

      {/* Image */}
      <img
        src={imgUrl}
        alt={product.title}
        className="w-full h-[180px] object-cover rounded-md mb-3"
      />

      {/* Title */}
      <h3 className="text-sm font-semibold text-[#3c2712] truncate mb-1">
        {product.title || "Untitled Book"}
      </h3>

      {/* Description */}
      <p className="text-[12px] text-gray-500 mb-2 line-clamp-2">
        {product.description || "No description available"}
      </p>

      {/* Rating */}
      <div className="flex justify-center gap-0.5 text-yellow-500 text-xs mb-2">
        {[...Array(5)].map((_, i) => (
          <i key={i} className={`ti ti-star ${i < (product.rating || 0) ? "" : "opacity-30"}`} />
        ))}
      </div>

      {/* Price */}
      <div className="text-sm mb-3">
        {discount > 0 ? (
          <div>
            <span className="text-gray-400 line-through text-xs mr-1">₹{product.originalPrice}</span>
            <span className="text-[#4caf50] font-medium">₹{product.price}</span>
          </div>
        ) : (
          <span className="text-[#3c2712] font-medium">₹{product.price}</span>
        )}
      </div>

      {/* View Button */}
      <Link
        to={`/products/${product._id}`}
        className="inline-block mt-auto px-3 py-1 bg-[#3c2712] text-white rounded-full text-xs hover:bg-[#5a3a1a]"
      >
        View
      </Link>
    </div>
  );
};

export const RelatedProductCard = ({ product }) => {
  const imgUrl = getImageUrl(product.product_imgs?.[0]);
  const discount = product.discountPercentage || 0;

  return (
    <div className="relative flex flex-col items-center bg-white rounded-lg shadow-md p-3 transition-transform duration-200 hover:scale-105 w-full max-w-[200px] sm:max-w-[220px] lg:max-w-[230px] mx-auto">
      {/* Offer Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md animate-bounce">
          {discount}% OFF
        </div>
      )}

      {/* Product Image */}
      <img
        src={imgUrl}
        alt={product.title || "Product Image"}
        className="w-[120px] h-[160px] sm:w-[140px] sm:h-[180px] rounded-md object-cover"
        loading="lazy"
      />

      {/* Details */}
      <div className="text-center mt-3">
        <h3 className="text-[14px] sm:text-[15px] font-semibold truncate w-full max-w-[180px]">
          {product.title || "Untitled Product"}
        </h3>

        {/* Rating */}
        <div className="text-[#ffd700] mt-1 mb-1 text-xs flex justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`ti ti-star ${i < (product.rating || 0) ? "" : "opacity-50"}`}></i>
          ))}
        </div>

        {/* Price */}
        <div className="font-medium text-[13px]">
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

        {/* Button */}
        <Link
          to={`/products/${product._id}`}
          className="inline-block mt-2 px-3 py-1 bg-[#3c2712] text-white rounded text-[11px] sm:text-[12px] font-medium transition-all hover:bg-[#5a3a1a]"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};