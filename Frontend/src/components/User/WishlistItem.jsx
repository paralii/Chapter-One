import React from "react";
import { Link } from "react-router-dom";

const WishlistItem = ({ item, onAddToCart, onRemove }) => {
  const imgUrl = item.product_imgs?.[0]  || "https://m.media-amazon.com/images/I/71aFt4+OTOL._AC_UF1000,1000_QL80_.jpg";
  const discount = item.discountPercentage ;

  return (
    <div className="relative flex flex-col items-center bg-white rounded-lg shadow-md p-3 transition-transform duration-200 hover:scale-105 w-full max-w-[230px] mx-auto">
      {/* Offer Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md">
          {discount}% OFF
        </div>
      )}

      {/* Product Image */}
      <img
        src={imgUrl}
        alt={item.title || "Book Cover"}
        className="w-[140px] h-[180px] rounded-md object-cover"
      />

      {/* Product Details */}
      <div className="text-center mt-3 w-full">
        <h3 className="text-[15px] font-semibold truncate w-full max-w-[180px] mx-auto">
          {item.title || "Untitled Book"}
        </h3>
        <p className="text-[13px] text-gray-600">{item.author_name || "Unknown Author"}</p>

        {/* Price Section */}
        <div className="font-medium text-[13px] mt-1">
          {discount > 0 ? (
            <div className="flex flex-col items-center">
              <span className="text-[#4caf50]">₹{item.price}</span>
            </div>
          ) : (
            <span className="text-[#4caf50]">{item.price ? `₹${item.price}` : "Not Available"}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={() => onAddToCart(item._id)}
            className="px-3 py-1 bg-[#3c2712] text-white rounded text-[12px] font-medium transition-all hover:bg-[#5a3a1a]"
          >
            Add to Cart
          </button>
          <button
            onClick={() => onRemove(item._id)}
            className="px-3 py-1 bg-gray-800 text-white rounded text-[12px] font-medium transition-all hover:bg-gray-900"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;
