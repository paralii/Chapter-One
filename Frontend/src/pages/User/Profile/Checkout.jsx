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
import { createOrder, createTempOrder } from "../../../api/user/orderAPI";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "../../../api/user/paymentAPI";
import userAxios from "../../../api/userAxios";
import { showAlert } from "../../../redux/alertSlice";
import { useDispatch } from "react-redux";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaHome,
  FaEdit,
  FaCheckCircle,
  FaMoneyBillWave,
  FaCreditCard,
  FaWallet,
  FaTimes,
  FaTag,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [lastAppliedCoupon, setLastAppliedCoupon] = useState([]);
  const [error, setError] = useState("");

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

        if (cart.some(item => !item.product_id?._id || !item.quantity)) {
      dispatch(showAlert({ message: "Invalid cart items.", type: "error" }));
      return;
    }

    const { subtotal, taxes, shippingCost, discount, finalPrice } =
      checkoutDetails;

         if (!subtotal || isNaN(subtotal) || subtotal <= 0) {
      dispatch(showAlert({ message: "Invalid subtotal amount.", type: "error" }));
      return;
    }

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
      setIsLoading(true);

            let tempOrder;
      if (paymentMethod === "ONLINE") {
        const tempOrderRes = await createTempOrder(orderData);

        tempOrder = tempOrderRes.data.order;
        orderData._id = tempOrder._id;
      }

      if (paymentMethod === "COD") {

        const response = await createOrder(orderData);
        dispatch(showAlert({ message: "Order placed!", type: "success" }));
        return navigate("/order-success", {
          state: { orderId: response.data.order._id },
        });
      } else if (paymentMethod === "ONLINE") {
              if (!window.Razorpay) {
          throw new Error("Razorpay script not loaded");
        }

        const razorpayData = {
          amount: finalPrice, 
          order_id: tempOrder._id,
        };
        let response;
        try {

        response = await createRazorpayOrder(razorpayData);
        } catch (apierror){
     console.error("Razorpay API call failed:", apiErr);
        throw apiErr;        }

      const { data } = response;
      const razorpayOrder = data.order;
      if (!razorpayOrder || !razorpayOrder.id) {
          throw new Error("Invalid Razorpay order response");
        }

      const razorpayInstance = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: razorpayOrder.id, 
        amount: razorpayOrder.amount, 
        currency: razorpayOrder.currency, 
        name: "CHAPTER ONE", 
        description: "Order Payment",
        handler: async (res) => {
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

            await verifyPaymentSignature({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              order_id: tempOrder._id,
            });


            const response = await createOrder({
              ...orderData, razorpay_order_id
            });

            dispatch(
              showAlert({ message: "Payment Successful!", type: "success" })
            );
            navigate("/order-success", {
              state: { orderId: response.data.order._id },
            });
          } catch (err) {
            dispatch(
              showAlert({ message: "Payment failed: " + (err.response?.data?.message || err.message), type: "error" })
            );
              navigate("/order-failure", {
                state: {
                  orderId: tempOrder._id,
                  errorMessage: err.response?.data?.message || err.message,
                },
              });
            }
        },
        prefill: {
          name: "Customer",
          email: "test@example.com",
          contact: "9876543210",
        },
        theme: { color: "#F37254" },
      });

      razorpayInstance.open();
    }
    } catch (err) {
          console.error("Order placement error:", err);

      dispatch(
        showAlert({
          message:
            "Order failed: " + (err.response?.data?.message || err.message),
          type: "error",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      return dispatch(
        showAlert({ message: "Please enter a coupon code.", type: "error" })
      );
    }

    if (
      typeof lastAppliedCoupon === "string" &&
      couponCode.trim().toUpperCase() === lastAppliedCoupon.toUpperCase()
    ) {
      return dispatch(
        showAlert({ message: "Coupon already applied.", type: "info" })
      );
    }

    setIsApplyingCoupon(true);
    setLastAppliedCoupon(trimmedCode);

    try {
      const res = await userAxios.post("/apply-coupon", {
        code: trimmedCode,
        address_id: defaultAddress, // only if required by backend
      });

      setCheckoutDetails(res.data.checkoutDetails);
      dispatch(
        showAlert({ message: "Coupon applied successfully!", type: "success" })
      );
    } catch (err) {
      setLastAppliedCoupon(""); // allow reattempt if failed
      dispatch(
        showAlert({
          message: err.response?.data?.message || "Invalid coupon",
          type: "error",
        })
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const res = await userAxios.post("/remove-coupon", {
        address_id: defaultAddress || "", // fallback if undefined
      });

      setCheckoutDetails(res.data.checkoutDetails);
      setCouponCode("");
      setLastAppliedCoupon(null);

      dispatch(
        showAlert({ message: "Coupon removed successfully.", type: "info" })
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to remove coupon.";
      dispatch(showAlert({ message: errorMessage, type: "error" }));
    }
  };

  if (cartLoading) return <BookLoader />;

  return (
    <div className="min-h-screen bg-yellow-50">
      <Navbar />
      <div className="flex gap-10 px-5 mx-auto my-10 max-w-[1200px] max-md:flex-col">
        {/* LEFT: Address + Payment */}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Delivery Address
            </h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({
                  name: "",
                  phone: "",
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
              className="text-sm px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
            >
              + Add New Address
            </button>
          </div>

          {/* Address List */}
{addresses.length ? (
  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scroll-thin scroll-thumb-yellow-400 scroll-track-yellow-100 rounded-md">
    {addresses.map((a) => (
      <div
        key={a._id}
        onClick={() => setDefaultAddress(a._id)}
        className={`p-3 rounded-md shadow-sm border transition cursor-pointer ${
          defaultAddress === a._id
            ? "border-l-4 border-green-600 bg-green-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <FaHome className="text-yellow-600" />
              {a.name} ({a.type})
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <FaPhone className="text-yellow-600" />
              {a.phone}
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
              <FaMapMarkerAlt className="text-yellow-600" />
              {a.place}, {a.district}, {a.city}, {a.state} - {a.pin}, {a.country}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-blue-600">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingAddress(a);
                setAddressForm(a);
                setShowAddressForm(true);
              }}
              className="flex items-center gap-1 underline"
            >
              <FaEdit /> Edit
            </button>
            {defaultAddress === a._id && (
              <span className="text-green-600 flex items-center gap-1">
                <FaCheckCircle /> Selected
              </span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-500">No addresses found. Add one.</p>
)}


          {/* Address Form */}
          {showAddressForm && (
            <div className="mt-4 mb-10 p-6 bg-white rounded-md shadow relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddressForm(false)}
              >
                <FaTimes size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <FaMapMarkerAlt className="text-yellow-600" />
                <h3 className="text-lg font-semibold">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "name",
                  "phone",
                  "place",
                  "district",
                  "city",
                  "state",
                  "country",
                  "pin",
                ].map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      {field[0].toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      name={field}
                      value={addressForm[field] || ""}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                ))}

                {/* Radio buttons for address type */}
                <div className="flex flex-col col-span-1 md:col-span-2">
                  <label className="text-sm text-gray-600 mb-1">Type</label>
                  <div className="flex gap-6 mt-1">
                    {["Home", "Office"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option}
                          checked={addressForm.type === option}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              type: e.target.value,
                            })
                          }
                          className="accent-yellow-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault || false}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                />
                <label className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <button
                onClick={handleAddressSubmit}
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded"
              >
                {editingAddress ? "Update Address" : "Add Address"}
              </button>
            </div>
          )}

          {/* Payment Method */}
          <div className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900">
              Payment Method
            </h2>
            <div className="space-y-3">
              {[
                {
                  value: "ONLINE",
                  label: "Debit/Credit Card (Razorpay)",
                  icon: <FaCreditCard className="text-yellow-600" />,
                },
                {
                  value: "Wallet",
                  label: "Pay using Wallet",
                  icon: <FaWallet className="text-yellow-600" />,
                },
                {
                  value: "COD",
                  label: "Cash on Delivery",
                  icon: <FaMoneyBillWave className="text-yellow-600" />,
                },
              ].map(({ value, label, icon }) => (
                <label
                  key={value}
                  htmlFor={value}
                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition ${
                    paymentMethod === value
                      ? "border-yellow-600 bg-yellow-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    id={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                    className="accent-yellow-500"
                  />
                  {icon}
                  <span className="text-gray-800">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Summary */}
        <div className="w-[456px] max-md:w-full">
          <h3 className="text-2xl mb-3 text-yellow-950">Order Summary</h3>
          {cart.map((item) => (
            <div
              key={item._id}
              className="flex items-start gap-4 p-4 mb-3 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <img
                src={item.product_id.product_imgs[0]}
                alt={item.product_id.title}
                className="w-20 h-20 object-cover rounded-md border"
              />

              <div className="flex-1">
                <div className="font-medium text-base text-gray-800 line-clamp-2">
                  {item.product_id.title}
                </div>

                <div className="text-sm text-gray-600 mt-1">
                  Quantity: <span className="font-medium">{item.quantity}</span>
                </div>

                <div className="text-sm text-gray-600">
                  ₹{item.product_id.price.toFixed(2)} × {item.quantity}{" "}
                  <span className="text-black font-semibold ml-1">
                    = ₹{(item.product_id.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white p-4 rounded shadow mb-5">
            <label className="block mb-2 font-medium text-yellow-950">
              Have a Coupon?
            </label>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setError(""); // clear error on change
                }}
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

            {/* Toggle to show/hide coupons */}
            <button
              onClick={() => setShowCoupons(!showCoupons)}
              className="flex items-center text-sm text-blue-600 hover:underline mb-2"
            >
              <FaTag className="mr-1" />
              {showCoupons
                ? "Hide Available Coupons"
                : "Show Available Coupons"}
              {showCoupons ? (
                <FaChevronUp className="ml-1" />
              ) : (
                <FaChevronDown className="ml-1" />
              )}
            </button>

            {/* Available Coupons List */}
            {showCoupons && (
              <div className="space-y-2 text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                {availableCoupons.length ? (
                  availableCoupons.map((c) => {
                    const isExpired = new Date(c.expirationDate) < new Date();
                    const isUsedUp = c.usedCount >= c.usageLimit;
                    const isValid = c.isActive && !isExpired && !isUsedUp;

                    return (
                      <div
                        key={c._id}
                        className={`p-2 rounded border ${
                          isValid
                            ? "border-green-500 bg-white"
                            : "border-gray-300 bg-gray-100 text-gray-400"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {c.code} - {c.discountPercentage}% OFF
                            </div>
                            <div className="text-xs">
                              Exp:{" "}
                              {new Date(c.expirationDate).toLocaleDateString()}
                            </div>
                          </div>
                          {isValid && (
                            <button
                              onClick={() => setCouponCode(c.code)}
                              className="text-xs text-blue-600 underline"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600">No coupons available.</p>
                )}
              </div>
            )}

            {/* Error or Applied Message */}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {checkoutDetails?.discount > 0 && (
              <div className="mt-2 flex items-center justify-between bg-green-100 text-green-800 px-3 py-2 rounded text-sm">
                <span>
                  Coupon <strong>{couponCode}</strong> applied successfully!
                </span>
                <button
                  onClick={handleRemoveCoupon}
                  className="ml-2 text-red-600 hover:underline flex items-center text-sm"
                >
                  <FaTimes className="mr-1" /> Remove
                </button>
              </div>
            )}
          </div>

          <div className="p-4 border-2 bg-zinc-100 rounded-lg mt-4 text-yellow-950">
            <div className="text-xl text-center mb-3">PRICE DETAILS</div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                {/* <span>₹ {checkoutDetails.subtotal.toFixed(2)}</span> */}
              </div>
            </div>

            {checkoutDetails && (
              <div className="mt-3 space-y-1">
                {[
                  ["Tax", checkoutDetails.taxes],
                  ["Shipping", checkoutDetails.shippingCost],
                  ["Discount", -checkoutDetails.discount],
                ].map(([label, val], i) => (
                  <div
                    key={i}
                    className={`flex justify-between text-sm ${
                      label === "Discount" && "text-green-600"
                    }`}
                  >
                    <span>{label}</span>
                    <span>₹ {val.toFixed(2)}</span>
                  </div>
                ))}
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹ {checkoutDetails.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              className="p-3 mt-6 w-full text-sm font-semibold bg-lime-600 rounded-lg text-white"
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
