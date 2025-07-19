import React, { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/common/Navbar";
import Footer from "../../../../components/common/Footer";
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  incrementCartItemQuantity,
  decrementCartItemQuantity,
} from "../../../../api/user/cartAPI";
import BookLoader from "../../../../components/common/BookLoader";
import showConfirmDialog from "../../../../components/common/ConformationModal";
const MAX_ALLOWED = 5;

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    const calculateDiscountPrice = (product, item) => {
    const hasDiscount = product.discount > 0 || item.applied_offer;
    const discountPrice = product.discount > 0
      ? product.price - (product.price * product.discount) / 100
      : item.applied_offer
      ? item.final_price
      : product.price;
    return { hasDiscount, discountPrice };
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCart(response.data.cart?.items || []);
    } catch (err) {
      console.error("Cart fetch error:", err);
      setError(err.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleUpdateQuantity = async (item, change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      return;
    }
    if (newQuantity > item.product_id.available_quantity || newQuantity > MAX_ALLOWED) {
      return;
    }
    try {
      if (change === 1) {
        await incrementCartItemQuantity({ product_id: item.product_id._id });
      } else if (change === -1) {
        await decrementCartItemQuantity({ product_id: item.product_id._id });
      }
      fetchCartItems();
    } catch (err) {
      console.error("Error updating cart item quantity:", err);
    }
  };

const handleRemove = (productId) => {
  showConfirmDialog({
    message: "Do you want to remove this item from your cart?",
    confirmButtonText: "Remove",
    cancelButtonText: "Cancel",
    onConfirm: async () => {
      try {
        await removeCartItem(productId);
        setCart((prevCart) =>
          prevCart.filter((item) => item.product_id._id !== productId)
        );
      } catch (err) {
        console.error("Error removing cart item:", err);
      }
    },
  });
};


  const totalOriginalPrice = useMemo(() => {
    return (cart || []).reduce(
      (acc, item) => acc + (item.product_id?.price || 0) * item.quantity,
      0
    );
  }, [cart]);

const totalFinalPrice = useMemo(() => {
  return (cart || []).reduce(
    (acc, item) => {
      const { discountPrice } = calculateDiscountPrice(item.product_id, item);
      return acc + discountPrice * item.quantity;
    },
    0
  );
}, [cart]);

  const totalDiscount = useMemo(() => {
    return totalOriginalPrice - totalFinalPrice;
  }, [totalOriginalPrice, totalFinalPrice]);

  const hasOutOfStock = cart.some(
    (item) => item.quantity > item.product_id.available_quantity
  );

  return (
    <div className="min-h-screen bg-[#fff8e5] flex flex-col">
      <Navbar />
      <div className="mx-0 my-8 text-3xl text-center text-stone-500 max-sm:text-2xl">
        Your Cart
      </div>
      <div className="flex gap-4 px-12 py-0 max-md:flex-col max-md:px-5 max-md:py-0 flex-1">
        <div className="flex-[2]">
          {loading && <BookLoader />}
          {error && <div className="text-red-500">Error: {error}</div>}
          {cart.length === 0 && (
            <div className="text-center text-gray-600 mt-10">
              <p>Your cart is empty.</p>
              <button onClick={() => navigate("/products")} className="text-blue-600">
                Shop Now
              </button>
            </div>
          )}
{cart.map((item) => {
  if (!item.product_id) {
    console.warn("Missing product_id in cart item:", item);
    return null;
  }
  const product = item.product_id;
  const { hasDiscount, discountPrice } = calculateDiscountPrice(product, item);
  return (
    <div
      key={item._id}
      className={`flex items-center p-4 mb-4 border border-orange-200 rounded-lg max-md:flex-col max-md:text-center max-sm:p-3 ${
        item.quantity > product.available_quantity ? "opacity-50" : ""
      }`}
    >
      <img
        src={product.product_imgs?.[0] || "https://via.placeholder.com/150"}
        alt={product.title}
        className="object-cover rounded-lg h-[160px] w-[100px] max-sm:h-[140px] max-sm:w-[90px]"
      />
      <div className="ml-4 max-md:mx-0 max-md:my-4">
        <div className="text-xl font-semibold text-yellow-950 max-sm:text-lg">
          {product.title}
        </div>
        <div className="mt-2 text-sm text-gray-600">{product.author_name}</div>
        <div className="mt-2 text-sm text-gray-600">{product.publisher}</div>
        <div className="mt-2 text-sm text-gray-500">{product.description}</div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-2xl font-semibold text-lime-600 max-sm:text-xl">
            ₹{(discountPrice * item.quantity).toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-red-600 line-through">
            ₹{(product.price * item.quantity).toFixed(2)}
              </span>
              <span className="text-sm text-green-600">
                {product.discount > 0
                  ? `(${product.discount}% OFF)`
                  : item.applied_offer
                  ? `(${item.applied_offer} Offer)`
                  : ""}
              </span>
            </>
          )}
        </div>
        {item.quantity > product.available_quantity && (
          <div className="text-red-600 text-lg mt-2">Out of Stock</div>
        )}
      </div>
      <div className="flex items-center ml-auto max-md:mx-0 max-md:my-4 max-sm:flex-col">
        <button
          disabled={item.quantity <= 1}
          className={`h-8 w-[35px] flex items-center justify-center border border-solid cursor-pointer ${
            item.quantity <= 1
              ? "border-gray-400 text-gray-400 cursor-not-allowed"
              : "border-black text-black hover:bg-gray-100"
          }`}
          onClick={() => handleUpdateQuantity(item, -1)}
        >
          -
        </button>
        <div className="w-16 h-8 border-t border-b border-solid border-y-black border-y-opacity-50 flex items-center justify-center">
          {item.quantity}
        </div>
        <button
          disabled={item.quantity >= product.available_quantity || item.quantity >= MAX_ALLOWED}
          className={`h-8 w-[35px] flex items-center justify-center border border-solid cursor-pointer ${
            item.quantity >= product.available_quantity || item.quantity >= MAX_ALLOWED
              ? "border-gray-400 text-gray-400 cursor-not-allowed"
              : "border-black text-black hover:bg-gray-100"
          }`}
          onClick={() => handleUpdateQuantity(item, 1)}
        >
          +
        </button>
      </div>
      <div className="ml-4">
        <button
          className="px-6 py-2 font-semibold rounded-lg cursor-pointer bg-zinc-800 text-neutral-50 hover:bg-zinc-700 transition-all duration-200 max-sm:px-5 max-sm:py-1"
          onClick={() => handleRemove(item.product_id._id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
})}
        </div>
        {cart.length > 0 && (
          <div className="flex-1 p-6 border border-orange-200 rounded-lg shadow-lg mb-4">
            <div className="mb-6 text-xl text-amber-800 font-semibold">PRICE DETAILS</div>
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
              <div className="text-lg text-yellow-950">Price ({cart.length} Items)</div>
              <div className="text-lg text-yellow-950 font-semibold">₹{totalOriginalPrice.toFixed(2)}</div>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
                <div className="text-lg text-green-600">Offer Discount</div>
                <div className="text-lg text-green-600 font-semibold">-₹{totalDiscount.toFixed(2)}</div>
              </div>
            )}
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
              <div className="text-lg text-yellow-950">Delivery Charges</div>
              <div className="text-lg text-yellow-950 font-semibold">₹00.00</div>
            </div>
            <div className="flex justify-between items-center mt-4 text-xl font-bold text-yellow-950">
              <div>Total Amount</div>
              <div>₹{totalFinalPrice.toFixed(2)}</div>
            </div>
            <button
              disabled={hasOutOfStock}
              className={`p-3 mt-6 w-full font-semibold text-center rounded-lg cursor-pointer text-neutral-50 ${
                hasOutOfStock ? "bg-gray-400 cursor-not-allowed" : "bg-lime-600 hover:bg-lime-500 transition-all duration-200"
              }`}
              onClick={() => !hasOutOfStock && navigate("/checkout")}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
export default CartPage;