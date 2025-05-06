import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import BookLoader from "../../../components/common/BookLoader";
import {
  getAddresses,
  addAddress,
  updateAddress,
} from "../../../api/user/addressAPI";
import { getCart } from "../../../api/user/cartAPI";
import { createOrder } from "../../../api/user/orderAPI";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "../../../api/user/paymentAPI";
import axios from "axios";
import userAxios from "../../../api/userAxios";
import { showAlert } from "../../../redux/alertSlice"; // Import the showAlert action
import { useDispatch } from "react-redux";

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize dispatch
  const location = useLocation();
  const fromBuyNow = location.state?.fromBuyNow;
  const buyNowItem = fromBuyNow
    ? JSON.parse(localStorage.getItem("buyNowItem"))
    : null;

  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [checkoutDetails, setCheckoutDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isLoading, setIsLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [couponCode, setCouponCode] = useState("");
const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
const [lastAppliedCoupon, setLastAppliedCoupon] = useState(null);

  const defaultAddressForm = {
    name: "",
    phone: "",
    place: "",
    city: "",
    district: "",
    state: "",
    country: "",
    pin: "",
    type: "Home",
    isDefault: false,
  };
  const [addressForm, setAddressForm] = useState(defaultAddressForm);

  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.product_id?.price || 0) * item.quantity,
    0
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await getCart();
        setCart(res.data.cart?.items || []);
      } catch (err) {
        console.error("Cart error:", err);
      } finally {
        setCartLoading(false);
      }
    })();
    fetchAddressesData();
  }, []);

  useEffect(() => {
    if (!defaultAddress) return;
    (async () => {
      try {
        const res = await userAxios.post("/checkout", {
          address_id: defaultAddress,
        });
        setCheckoutDetails(res.data.checkoutDetails);
      } catch (err) {
        console.error("Checkout summary fetch failed:", err);
      }
    })();
  }, [defaultAddress]);

  const fetchAddressesData = async () => {
    try {
      const res = await getAddresses();
      const all = res.data.addresses;
      setAddresses(all);
      const def = all.find((a) => a.isDefault);
      if (def) setDefaultAddress(def._id);
    } catch (err) {
      console.error("Address fetch failed:", err);
    }
  };

  const handleAddressSubmit = async () => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addressForm);
        dispatch(showAlert({ message: "Address updated!", type: "success" }));
      } else {
        await addAddress(addressForm);
        dispatch(showAlert({ message: "Address added!", type: "success" }));
      }
      fetchAddressesData();
      setShowAddressForm(false);
      setAddressForm(defaultAddressForm);
      setEditingAddress(null);
    } catch (err) {
      dispatch(
        showAlert({ message: "Failed to save address.", type: "error" })
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart.length || !defaultAddress || !checkoutDetails) {
      dispatch(
        showAlert({
          message:
            "Please complete cart, address, and wait for price calculation.",
          type: "info",
        })
      );
      return;
    }
  
    const { subtotal, taxes, shippingCost, discount, finalPrice } =
      checkoutDetails;
  
    const orderData = {
      address_id: defaultAddress,
      shipping_chrg: shippingCost,
      discount,
      items: cart.map((i) => ({
        product_id: i.product_id._id,
        quantity: i.quantity,
        price: i.product_id.price,
      })),
      amount: subtotal,
      taxes,
      total: finalPrice,
      currency: "INR",
      paymentMethod,
    };
  
    try {
      // If payment method is COD, directly create the order
      if (paymentMethod === "COD") {
        const response = await createOrder(orderData);
        dispatch(showAlert({ message: "Order placed!", type: "success" }));
        return navigate("/order-success", {
          state: { orderId: response.data.order._id },
        });
      }
  
      // If payment method is online, create the Razorpay order
      const { data } = await createRazorpayOrder(orderData);
      console.log("Razorpay data:", data);
  
      const razorpayInstance = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: data.order.id, // Razorpay order ID
        amount: data.order.amount, // Amount to be paid
        currency: data.order.currency, // Currency
        name: "CHAPTER ONE", // Store name or description
        description: "Order Payment",
        handler: async (res) => {
          console.log("Payment response:", res);
          try {
            const {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            } = res;
  
            if (
              !razorpay_order_id ||
              !razorpay_payment_id ||
              !razorpay_signature
            ) {
              console.error("Missing payment details in response:", res);
              dispatch(
                showAlert({ message: "Missing payment details", type: "info" })
              );
              return;
            }
  
            // Call your payment verification API here
            await verifyPaymentSignature({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            });
  
            console.log("Payment verified successfully!");
  
            // Now create the order in your backend with payment details
            const response = await createOrder({
              ...orderData});
  
            dispatch(
              showAlert({ message: "Payment Successful!", type: "success" })
            );
            navigate("/order-success", {
              state: { orderId: response.data.order._id },
            });
          } catch (err) {
            dispatch(showAlert({ message: "Payment Successful!", type: "success" }));
            navigate("/")    
          }finally {
            navigate('/');
          }
        },
        prefill: {
          name: "Customer",
          email: "test@example.com",
          contact: "9876543210",
        },
        theme: { color: "#F37254" },
      });
  
      console.log("Opening Razorpay modal...");
      razorpayInstance.open();
    } catch (err) {
      dispatch(
        showAlert({
          message:
            "Order failed: " + (err.response?.data?.message || err.message),
          type: "error",
        })
      );
    }
  };
  

  const handleApplyCoupon = async () => {
    if (couponCode.trim() === lastAppliedCoupon) {
      return dispatch(showAlert({ message: "Coupon already applied.", type: "info" }));
    }
    setIsApplyingCoupon(true); 
    setLastAppliedCoupon(couponCode.trim());
    try {
      const res = await userAxios.post("/apply-coupon", {
        code: couponCode,
        address_id: defaultAddress, // if required
      });
      setCheckoutDetails(res.data.checkoutDetails);
      dispatch(showAlert({ message: "Coupon applied successfully!", type: "success" }));
    } catch (err) {
      dispatch(showAlert({ message: err.response?.data?.message || "Invalid coupon", type: "error" }));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const res = await userAxios.post("/remove-coupon", {
        address_id: defaultAddress,
      });
      setCheckoutDetails(res.data.checkoutDetails);
      setCouponCode("");
      setLastAppliedCoupon(null);  // Reset the coupon state on removal
      dispatch(showAlert({ message: "Coupon removed.", type: "info" }));
    } catch (err) {
      dispatch(showAlert({ message: "Failed to remove coupon.", type: "error" }));
    }
  };
  
  
  
  if (cartLoading) return <BookLoader />;

  return (
    <div className="min-h-screen bg-yellow-50">
      <Navbar />
      <div className="flex gap-10 px-5 mx-auto my-10 max-w-[1200px] max-md:flex-col">
        {/* LEFT: Address + Payment */}

        <div className="flex-1">
          <h2 className="mb-5 text-3xl text-neutral-900">
            Select Delivery Address
          </h2>
          <button
            onClick={() => {
              setEditingAddress(null);
              setAddressForm({
                type: "",
                city: "",
                state: "",
                district: "",
                place: "",
                pin: "",
                country: "",
              });
              setShowAddressForm(true);
            }}
            className="mb-4 px-4 py-2 bg-yellow-600 text-white rounded"
          >
            + Add New Address
          </button>

          {addresses.length ? (
            addresses.map((a) => (
              <div
                key={a._id}
                onClick={() => setDefaultAddress(a._id)}
                className={`p-4 mb-2 cursor-pointer border rounded ${
                  defaultAddress === a._id
                    ? "border-green-500 bg-green-100"
                    : "border-gray-300"
                }`}
              >
                <p>
                  {a.place}, {a.city}, {a.state} - {a.pin}
                </p>
                {defaultAddress === a._id ? (
                  <strong>✔ Selected</strong>
                ) : (
                  <button>Select</button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAddress(a);
                    setAddressForm(a);
                    setShowAddressForm(true);
                  }}
                  className="ml-4 text-sm text-blue-600 underline"
                >
                  Edit
                </button>
              </div>
            ))
          ) : (
            <p>No addresses found. Add one.</p>
          )}

          <div className="mt-10">
            <h2 className="mb-5 text-3xl text-neutral-900">Payment Methods</h2>
            {["Razorpay", "COD"].map((method) => (
              <div key={method} className="flex gap-4 items-center mb-4">
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  id={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <label htmlFor={method}>
                  {method === "Razorpay"
                    ? "Debit/Credit (Razorpay)"
                    : "Cash on Delivery"}
                </label>
              </div>
            ))}
          </div>

          {showAddressForm && (
            <div className="p-4 bg-white rounded shadow mt-5">
              <h4 className="text-lg mb-3">
                {editingAddress ? "Edit" : "Add"} Address
              </h4>
              {[
                "name",
                "phone",
                "place",
                "district",
                "city",
                "state",
                "country",
                "pin",
                "type",
              ].map((field) => (
                <input
                  key={field}
                  name={field}
                  value={addressForm[field]}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                  placeholder={field[0].toUpperCase() + field.slice(1)}
                  className="block w-full mb-2 p-2 border rounded"
                />
              ))}
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                />
                Set as default address
              </label>
              <button
                className="bg-yellow-600 text-white px-4 py-2 rounded"
                onClick={handleAddressSubmit}
              >
                {editingAddress ? "Update" : "Add"} Address
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div className="w-[456px] max-md:w-full">
          <h3 className="text-2xl mb-3 text-yellow-950">Order Summary</h3>
          {cart.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 p-4 mb-3 bg-white rounded shadow"
            >
              <img
                src={item.product_id.product_imgs[0]}
                alt={item.product_id.title}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {item.product_id.title}
                </div>
                <div className="text-sm text-gray-600">
                  Qty: {item.quantity}
                </div>
                <div className="text-sm text-gray-600">
                  ₹{item.product_id.price} × {item.quantity} = ₹
                  {(item.product_id.price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}

<div className="bg-white p-4 rounded shadow mb-5">
  <label htmlFor="coupon" className="block mb-2 font-medium text-yellow-950">
    Have a Coupon?
  </label>
  <div className="flex gap-2">
    <input
      id="coupon"
      type="text"
      value={couponCode}
      onChange={(e) => setCouponCode(e.target.value)}
      className="flex-1 px-4 py-2 border rounded text-sm"
      placeholder="Enter coupon code"
    />
    <button
      onClick={handleApplyCoupon}
      disabled={isApplyingCoupon}
      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
    >
      {isApplyingCoupon ? "Applying..." : "Apply"}
    </button>
  </div>
</div>

{checkoutDetails?.discount !== 0 && (
  <button
    onClick={handleRemoveCoupon}
    className="mt-2 text-sm text-red-600 underline"
  >
    Remove Coupon
  </button>
)}


          <div className="p-8 border-4 bg-zinc-100 rounded-[37px] mt-5 text-yellow-950">
            <div className="mb-5 text-2xl text-center">PRICE DETAILS</div>
            <div className="text-lg space-y-3">
              <div className="flex justify-between">
                <span>Price ({cart.length} items)</span>
                <span>₹ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span>₹ {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {checkoutDetails && (
              <div className="mt-4 text-lg space-y-2">
                {[
                  ["Subtotal", checkoutDetails.subtotal],
                  ["Tax", checkoutDetails.taxes],
                  ["Shipping", checkoutDetails.shippingCost],
                  ["Discount", -checkoutDetails.discount],
                ].map(([label, val], i) => (
                  <div
                    key={i}
                    className={`flex justify-between ${
                      label === "Discount" && "text-green-600"
                    }`}
                  >
                    <span>{label}</span>
                    <span>₹ {val.toFixed(2)}</span>
                  </div>
                ))}
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>₹ {checkoutDetails.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              className="p-4 mt-8 w-full text-lg font-bold bg-lime-600 rounded-2xl text-white"
              disabled={isLoading}
            >
              {isLoading ? <BookLoader /> : "Place Order"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Checkout;
