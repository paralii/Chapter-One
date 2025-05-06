import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; // Import dispatch
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
} from "../../../api/user/cartAPI";
import { MAX_ALLOWED } from "../../../utils/constants";
import BookLoader from "../../../components/common/BookLoader";
import { showAlert } from "../../../redux/alertSlice"; // Import the showAlert action

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
      console.log("Cart API Raw Response:", response);
      console.log("Cart API Response:", response.data);
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
    console.log("useEffect triggered for fetching cart...");
    fetchCartItems();
  }, []);

  const handleUpdateQuantity = async (item, change) => {
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      dispatch(showAlert({ message: "Quantity cannot be less than 1.", type: "error" })); // Custom alert
      return;
    }
    if (
      newQuantity > item.product_id.available_quantity ||
      newQuantity >= MAX_ALLOWED 
    ) {
      dispatch(showAlert({
        message: "Cannot increase quantity: exceeds available stock or maximum allowed.",
        type: "error"
      })); // Custom alert
      return;
    }

    try {
      console.log(
        `Updating quantity for product: ${item.product_id._id}, New Quantity: ${newQuantity}`
      );

      const response = await updateCartItemQuantity({
        product_id: item.product_id._id,
        quantity: change,
      });

      console.log("Update Cart Response:", response);

      // Update state with the new cart data from response
      setCart(response.data.cart.items);

      dispatch(showAlert({ message: "Quantity updated successfully!", type: "success" })); // Custom alert
    } catch (err) {
      console.error("Error updating cart item quantity:", err);
      dispatch(showAlert({ message: "Failed to update quantity.", type: "error" })); // Custom alert
    }
  };

  // Remove item from cart
  const handleRemove = async (productId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    try {
      await removeCartItem(productId);
      setCart((prevCart) =>
        prevCart.filter((item) => item.product_id._id !== productId)
      );
      dispatch(showAlert({ message: "Item removed from cart.", type: "success" })); // Custom alert
    } catch (err) {
      dispatch(showAlert({ message: "Failed to remove item.", type: "error" })); // Custom alert
    }
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
      <div className="min-h-screen bg-yellow-50">
        <Navbar />
        <div className="mx-0 my-8 text-3xl text-center text-stone-500 max-sm:text-2xl">
          Your Cart
        </div>
        <div className="flex gap-4 px-12 py-0 max-md:flex-col max-md:px-5 max-md:py-0">
          {/* Left: Cart Items */}
          <div className="flex-[2]">
            {loading && <div>Loading....</div>}
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
                  className={`flex items-center p-4 mb-4 border-4 border-orange-200 border-solid rounded-xl max-md:flex-col max-md:text-center max-sm:p-3 ${
                    item.quantity > product.available_quantity
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <img
                    src={product.product_imgs?.[0] || "https://via.placeholder.com/150"}
                    alt={product.title}
                    className="object-cover rounded-xl h-[200px] w-[120px] max-sm:h-[160px] max-sm:w-[100px]"
                  />
                  <div className="ml-4 max-md:mx-0 max-md:my-4">
                    <div className="text-xl font-semibold text-yellow-950 max-sm:text-lg">
                      {product.title}
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
                    <button
                      disabled={item.quantity <= 1}
                      className="h-8 border border-solid cursor-pointer border-black border-opacity-50 w-[35px] flex items-center justify-center"
                      onClick={() => handleUpdateQuantity(item, -1)}
                    >
                      -
                    </button>
                    <div className="w-16 h-8 border-t border-b border-solid border-y-black border-y-opacity-50 flex items-center justify-center">
                      {item.quantity}
                    </div>
                    <button
                      disabled={item.quantity >= product.available_quantity || item.quantity >= MAX_ALLOWED}
                      className="h-8 border border-solid cursor-pointer border-black border-opacity-50 w-[35px] flex items-center justify-center"
                      onClick={() => handleUpdateQuantity(item, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="px-8 py-2 font-semibold rounded-xl cursor-pointer bg-zinc-800 text-neutral-50 max-md:mt-4 max-sm:px-5 max-sm:py-1"
                    onClick={() => handleRemove(item.product_id._id)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Price Details */}
          <div className="flex-1 p-4 border-4 border-orange-200 border-solid rounded-xl">
            <div className="mb-6 text-xl text-amber-800">PRICE DETAILS</div>
            <div className="flex justify-between mb-3">
              <div className="text-lg text-yellow-950">
                Price ({cart.length} Items)
              </div>
              <div className="text-lg text-yellow-950">
                ₹{totalPrice.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between mb-3">
              <div className="text-lg text-yellow-950">Delivery Charges</div>
              <div className="text-lg text-yellow-950">₹00.00</div>
            </div>
            <div className="flex justify-between mt-6 text-xl font-bold text-yellow-950">
              <div>Total Amount</div>
              <div>₹{totalPrice.toFixed(2)}</div>
            </div>
            <button
              disabled={hasOutOfStock}
              className={`p-3 mt-6 font-semibold text-center rounded-xl cursor-pointer text-neutral-50 ${
                hasOutOfStock ? "bg-gray-400 cursor-not-allowed" : "bg-lime-600"
              }`}
              onClick={() => hasOutOfStock || navigate("/checkout")}
            >
              Checkout
            </button>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default CartPage;
