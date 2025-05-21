import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  incrementCartItemQuantity,
  decrementCartItemQuantity,
} from "../../../api/user/cartAPI";
import BookLoader from "../../../components/common/BookLoader";
import { showAlert } from "../../../redux/alertSlice";
import showConfirmDialog from "../../../components/common/ConformationModal";
const MAX_ALLOWED = 5;
const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch(); // Initialize dispatch

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCart(response.data.cart?.items || []);
    } catch (err) {
      console.error("Cart fetch error:", err);
      setError(err.response?.data?.message || "Failed to load cart.");
      dispatch(showAlert({ message: "Failed to load cart.", type: "error" })); // Custom alert
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
      dispatch(
        showAlert({ message: "Quantity cannot be less than 1.", type: "error" })
      ); // Custom alert
      return;
    }
    if (
      newQuantity > item.product_id.available_quantity ||
      newQuantity > MAX_ALLOWED
    ) {
      dispatch(
        showAlert({
          message:
            "Cannot increase quantity: exceeds available stock or maximum allowed.",
          type: "error",
        })
      );
      return;
    }

    try {
      if (change === 1) {
        await incrementCartItemQuantity({ product_id: item.product_id._id });
      } else if (change === -1) {
        await decrementCartItemQuantity({ product_id: item.product_id._id });
      }

      fetchCartItems();
      dispatch(
        showAlert({
          message: "Quantity updated successfully!",
          type: "success",
        })
      );
      dispatch(
        showAlert({
          message: "Quantity updated successfully!",
          type: "success",
        })
      ); // Custom alert
    } catch (err) {
      console.error("Error updating cart item quantity:", err);
      dispatch(
        showAlert({ message: "Failed to update quantity.", type: "error" })
      ); // Custom alert
    }
  };

  // Remove item from cart
const handleRemove = (productId) => {
  showConfirmDialog("Are you sure you want to remove this item?", async () => {
    try {
      await removeCartItem(productId);
      setCart((prevCart) =>
        prevCart.filter((item) => item.product_id._id !== productId)
      );
      dispatch(
        showAlert({ message: "Item removed from cart.", type: "success" })
      );
    } catch (err) {
      dispatch(showAlert({ message: "Failed to remove item.", type: "error" }));
    }
  });
};


  // Calculate total price using useMemo
  const totalPrice = useMemo(() => {
    return (cart || []).reduce(
      (acc, item) => acc + (item.product_id?.price || 0) * item.quantity,
      0
    );
  }, [cart]);

  // Check if any item is out-of-stock
  const hasOutOfStock = cart.some(
    (item) => item.quantity > item.product_id.available_quantity
  );

  return (
    <>
  <div className="min-h-screen bg-yellow-50 flex flex-col">
        <Navbar />
        <div className="mx-0 my-8 text-3xl text-center text-stone-500 max-sm:text-2xl">
          Your Cart
        </div>
    <div className="flex gap-4 px-12 py-0 max-md:flex-col max-md:px-5 max-md:py-0 flex-1">
          {/* Left: Cart Items */}
          <div className="flex-[2]">
            {loading && <BookLoader/>}
            {error && <div className="text-red-500">Error: {error}</div>}
            {cart.length === 0 && (
              <div className="text-center text-gray-600 mt-10">
                <p>Your cart is empty.</p>
                <button onClick={() => navigate("/")} className="text-blue-600">
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
              return (
                <div
                  key={item._id}
                  className={`flex items-center p-4 mb-4 border border-orange-200 rounded-lg max-md:flex-col max-md:text-center max-sm:p-3 ${
                    item.quantity > product.available_quantity
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <img
                    src={
                      product.product_imgs?.[0] ||
                      "https://via.placeholder.com/150"
                    }
                    alt={product.title}
                    className="object-cover rounded-lg h-[160px] w-[100px] max-sm:h-[140px] max-sm:w-[90px]"
                  />
                  <div className="ml-4 max-md:mx-0 max-md:my-4">
                    <div className="text-xl font-semibold text-yellow-950 max-sm:text-lg">
                      {product.title}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {product.author_name}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {product.publisher}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {product.description}
                    </div>
                    <div className="mt-3 text-2xl text-lime-600 max-sm:text-xl">
                      ₹{product.price}
                    </div>
                    {item.quantity > product.available_quantity && (
                      <div className="text-red-600 text-lg mt-2">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  <div className="flex items-center ml-auto max-md:mx-0 max-md:my-4 max-sm:flex-col">
                    {/* Decrement Button */}
                    <button
                      disabled={item.quantity <= 1}
                      className={`h-8 w-[35px] flex items-center justify-center 
      border border-solid cursor-pointer 
      ${
        item.quantity <= 1
          ? "border-gray-400 text-gray-400 cursor-not-allowed"
          : "border-black text-black hover:bg-gray-100"
      }`}
                      onClick={() => handleUpdateQuantity(item, -1)}
                    >
                      -
                    </button>

                    {/* Quantity Display */}
                    <div className="w-16 h-8 border-t border-b border-solid border-y-black border-y-opacity-50 flex items-center justify-center">
                      {item.quantity}
                    </div>

                    {/* Increment Button */}
                    <button
                      disabled={
                        item.quantity >= product.available_quantity ||
                        item.quantity >= MAX_ALLOWED
                      }
                      className={`h-8 w-[35px] flex items-center justify-center 
      border border-solid cursor-pointer 
      ${
        item.quantity >= product.available_quantity ||
        item.quantity >= MAX_ALLOWED
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

          {/* Right: Price Details */}
            {cart.length > 0 && (
          <div className="flex-1 p-6 border border-orange-200 rounded-lg shadow-lg mb-4">
            <div className="mb-6 text-xl text-amber-800 font-semibold">
              PRICE DETAILS
            </div>
            {/* Price */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
              <div className="text-lg text-yellow-950 ">
                Price ({cart.length} Items)
              </div>
              <div className="text-lg text-yellow-950 font-semibold">
                ₹{totalPrice.toFixed(2)}
              </div>
            </div>

            {/* Delivery Charges */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
              <div className="text-lg text-yellow-950 ">
                Delivery Charges
              </div>
              <div className="text-lg text-yellow-950 font-semibold">₹00.00</div>
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center mt-4 text-xl font-bold text-yellow-950">
              <div>Total Amount</div>
              <div>₹{totalPrice.toFixed(2)}</div>
            </div>

            {/* Checkout Button */}
            <button
              disabled={hasOutOfStock}
              className={`p-3 mt-6 w-full font-semibold text-center rounded-lg cursor-pointer text-neutral-50 ${
                hasOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-lime-600 hover:bg-lime-500 transition-all duration-200"
              }`}
              onClick={() => hasOutOfStock || navigate("/checkout")}
            >
              Checkout
            </button>
          </div>
  )}

        </div>
        <Footer />
      </div>
    </>
  );
};

export default CartPage;
