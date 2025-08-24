import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMapMarkerAlt, FaPhone, FaHome, FaEdit, FaCheckCircle, FaMoneyBillWave, FaCreditCard, FaWallet, FaTimes, FaTag, FaChevronDown, FaChevronUp } from "react-icons/fa";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import BookLoader from "../../../components/common/BookLoader";
import { getWallet } from "../../../api/user/walletAPI";
import { getAllUserAddresses, addAddress, updateAddress } from "../../../api/user/addressAPI";
import { getCart } from "../../../api/user/cartAPI";
import { placeOrder, createTempOrder, getPendingOrder } from "../../../api/user/orderAPI";
import { createRazorpayOrder, verifyPayment } from "../../../api/user/paymentAPI";
import { getAvailableCoupons, applyCoupon, removeCoupon } from "../../../api/user/couponAPi";
import { showAlert } from "../../../redux/alertSlice";
import userAxios from "../../../api/userAxios";

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [checkoutDetails, setCheckoutDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [isLoading, setIsLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [couponLoading, setCouponLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [lastAppliedCoupon, setLastAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [tempOrderId, setTempOrderId] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [showPendingOrderDialog, setShowPendingOrderDialog] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCODAllowed, setIsCODAllowed] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const fromBuyNow = location.state?.fromBuyNow;
  const buyNowItem = fromBuyNow ? JSON.parse(localStorage.getItem("buyNowItem")) : null;

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

  const totalOriginalPrice = cart.reduce(
    (acc, item) => acc + (item.product_id?.price || 0) * item.quantity,
    0
  );

  const totalFinalPrice = cart.reduce(
    (acc, item) => acc + (item.final_price || (item.product_id?.price * (1 - (item.product_id?.discount || 0) / 100)) || 0) * item.quantity,
    0
  );

  const totalOfferDiscount = totalOriginalPrice - totalFinalPrice;

  const calculateShippingCost = (city) => {
    const shippingCosts = {
      "New York": 10,
      "Los Angeles": 15,
      "Chicago": 12,
    };
    return shippingCosts[city] || 20;
  };

  useEffect(() => {
    (async () => {
      try {
        setCouponLoading(true);
        setCartLoading(true);
        const [walletRes, cartRes, couponsRes, addressesRes, pendingOrderRes] = await Promise.all([
          getWallet(),
          getCart(),
          getAvailableCoupons(),
          getAllUserAddresses(),
          getPendingOrder().catch(err => {
            console.warn("Failed to fetch pending order:", err);
            return { data: { order: null } };
          }),
        ]);
        setWalletBalance(walletRes.data.wallet?.balance || 0);
        setCart(cartRes.data.cart?.items || []);
        setAvailableCoupons(couponsRes.data.coupons || []);
        setAddresses(addressesRes.data.addresses || []);
        const def = addressesRes.data.addresses.find((a) => a.isDefault);
        if (def) setDefaultAddress(def._id);
        if (pendingOrderRes.data.order) {
          setTempOrderId(pendingOrderRes.data.order._id);
          setPendingOrder(pendingOrderRes.data.order);
          if (pendingOrderRes.data.order.paymentStatus === "Completed") {
            dispatch(showAlert({ message: "Order already completed.", type: "info" }));
            navigate("/order-success", {
              state: { orderId: pendingOrderRes.data.order._id },
            });
            return;
          }
          const orderItems = pendingOrderRes.data.order.items.map(i => ({
            product_id: i.product_id.toString(),
            quantity: i.quantity,
          }));
          const cartItems = cartRes.data.cart?.items.map(i => ({
            product_id: i.product_id._id.toString(),
            quantity: i.quantity,
          })) || [];
          const itemsMatch = orderItems.length === cartItems.length &&
            orderItems.every(oi => cartItems.some(ci => ci.product_id === oi.product_id && ci.quantity === oi.quantity));
          if (!itemsMatch) {
            try {
              await userAxios.post("/orders/cancel", { orderId: pendingOrderRes.data.order._id });
              setTempOrderId(null);
              setPendingOrder(null);
              dispatch(showAlert({ message: "Mismatched pending order cancelled.", type: "info" }));
            } catch (err) {
              console.error("Failed to cancel mismatched order:", err);
              setShowPendingOrderDialog(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        dispatch(showAlert({ message: "Failed to load checkout data.", type: "error" }));
      } finally {
        setCartLoading(false);
        setCouponLoading(false);
      }
    })();
  }, [dispatch, navigate]);

  const fetchCheckoutDetails = useCallback(async () => {
    if (!defaultAddress || !cart.length || !tempOrderId) return;
    try {
      const checkoutRes = await userAxios.post("/checkout", {
        address_id: defaultAddress,
        paymentMethod,
        orderId: tempOrderId,
        referralCode,
      });
      setCheckoutDetails(checkoutRes.data.checkoutDetails);
    } catch (err) {
      console.error("Checkout summary fetch failed:", err);
      dispatch(showAlert({ message: "Failed to load checkout details.", type: "error" }));
    }
  }, [defaultAddress, cart.length, paymentMethod, tempOrderId, referralCode]);

  useEffect(() => {
    if (!defaultAddress || !cart.length || totalFinalPrice <= 0 || tempOrderId || isCreatingOrder) {
      if (tempOrderId) {
        fetchCheckoutDetails();
      }
      return;
    }
    (async () => {
      setIsCreatingOrder(true);
      try {
        const invalidItem = cart.find(
          item => !item.product_id?._id || !item.quantity || item.quantity < 1 || !item.product_id.price || item.product_id.price <= 0
        );
        if (invalidItem) {
          throw new Error("Invalid cart item detected");
        }
        const items = cart.map((i) => ({
          product_id: i.product_id._id,
          quantity: i.quantity,
          price: i.final_price || (i.product_id.price * (1 - (i.product_id?.discount || 0) / 100)),
          total: (i.final_price || (i.product_id.price * (1 - (i.product_id?.discount || 0) / 100))) * i.quantity,
        }));
        const selectedAddress = addresses.find(a => a._id === defaultAddress);
        const shippingCost = selectedAddress ? calculateShippingCost(selectedAddress.city) : 20;
        const taxes = totalFinalPrice * 0.1;
        const netAmount = totalFinalPrice + taxes + shippingCost - totalOfferDiscount;
        setIsCODAllowed(netAmount <= 1000);
        const orderData = {
          address_id: defaultAddress,
          shipping_chrg: shippingCost,
          discount: totalOfferDiscount,
          items,
          amount: totalFinalPrice,
          taxes,
          total: totalFinalPrice + taxes + shippingCost - totalOfferDiscount,
          currency: "INR",
          paymentMethod,
          coupon: lastAppliedCoupon || undefined,
        };
        const tempOrderRes = await createTempOrder(orderData);
        const orderId = tempOrderRes.data.order?._id;
        if (!orderId) {
          throw new Error("No order ID returned from temp order creation");
        }
        setTempOrderId(orderId);
        setPendingOrder(tempOrderRes.data.order);
        await fetchCheckoutDetails();
      } catch (err) {
        console.error("Temp order creation failed:", err);
        if (err.response?.status === 409) {
          try {
            const pendingOrderRes = await getPendingOrder();
            if (pendingOrderRes.data.order) {
              if (pendingOrderRes.data.order.paymentStatus === "Completed") {
                dispatch(showAlert({ message: "Order already completed.", type: "info" }));
                navigate("/order-success", {
                  state: { orderId: pendingOrderRes.data.order._id },
                });
              } else {
                setTempOrderId(pendingOrderRes.data.order._id);
                setPendingOrder(pendingOrderRes.data.order);
                setShowPendingOrderDialog(true);
              }
            }
          } catch (pendingErr) {
            dispatch(showAlert({ message: "Failed to fetch existing order.", type: "error" }));
          }
        } else if (err.response?.data?.message?.includes("Cash on Delivery is not allowed")) {
            dispatch(showAlert({
              message: "Cash on Delivery is not allowed for orders above Rs 1000. Please choose another payment method.",
              type: "error",
            }));
            setPaymentMethod("ONLINE");
        } else {
          dispatch(showAlert({
            message: err.response?.data?.message || "Failed to initialize checkout.",
            type: "error",
          }));
        }
      } finally {
        setIsCreatingOrder(false);
      }
    })();
  }, [defaultAddress, cart.length, totalFinalPrice, paymentMethod, tempOrderId, fetchCheckoutDetails, dispatch, totalOfferDiscount, addresses]);

  const fetchAddressesData = async () => {
    try {
      const res = await getAllUserAddresses();
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
      dispatch(showAlert({ message: "Failed to save address.", type: "error" }));
    }
  };

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    if (!trimmedCode) {
      setCouponError("Please enter a valid coupon code.");
      dispatch(showAlert({ message: "Please enter a valid coupon code.", type: "error" }));
      return;
    }
    if (lastAppliedCoupon && trimmedCode === lastAppliedCoupon.toUpperCase()) {
      setCouponError("This coupon is already applied.");
      dispatch(showAlert({ message: "This coupon is already applied.", type: "info" }));
      return;
    }
    if (!tempOrderId) {
      setCouponError("Please select an address and add items to cart.");
      dispatch(showAlert({ message: "Please select an address and add items to cart.", type: "error" }));
      return;
    }
    setCouponError("");
    setIsApplyingCoupon(true);
    try {
      const res = await applyCoupon({ couponCode: trimmedCode, orderId: tempOrderId });
      setCheckoutDetails(res.data.checkoutDetails);
      setLastAppliedCoupon(trimmedCode);
      setCouponCode("");
      await fetchCheckoutDetails();
      dispatch(showAlert({ message: "Coupon applied successfully!", type: "success" }));
    } catch (err) {
      const message = err.response?.data?.message || "Invalid or expired coupon code.";
      setCouponError(message);
      dispatch(showAlert({ message, type: "error" }));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!tempOrderId) {
      setCouponError("No order to remove coupon from.");
      dispatch(showAlert({ message: "No order to remove coupon from.", type: "error" }));
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const res = await removeCoupon({ orderId: tempOrderId });
      setCheckoutDetails(res.data.checkoutDetails);
      setCouponCode("");
      setLastAppliedCoupon(null);
      setCouponError("");
      await fetchCheckoutDetails();
      dispatch(showAlert({ message: "Coupon removed successfully.", type: "info" }));
    } catch (err) {
      const message = err.response?.data?.message || "Failed to remove coupon.";
      setCouponError(message);
      dispatch(showAlert({ message, type: "error" }));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyReferral = async () => {
    const trimmedCode = referralCode.trim().toUpperCase();
    if (!trimmedCode) {
      setReferralError("Please enter a valid referral code.");
      dispatch(showAlert({ message: "Please enter a valid referral code.", type: "error" }));
      return;
    }
    if (!tempOrderId) {
      setReferralError("Please select an address and add items to cart.");
      dispatch(showAlert({ message: "Please select an address and add items to cart.", type: "error" }));
      return;
    }
    setReferralError("");
    setIsApplyingCoupon(true);
    try {
      await userAxios.post("/offers/validate-referral", { referral_code: trimmedCode });
      setReferralCode(trimmedCode);
      await fetchCheckoutDetails();
      dispatch(showAlert({ message: "Referral code applied successfully!", type: "success" }));
    } catch (err) {
      const message = err.response?.data?.message || "Invalid or expired referral code.";
      setReferralError(message);
      dispatch(showAlert({ message, type: "error" }));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const suggestBestCoupon = () => {
    if (!totalFinalPrice || !availableCoupons.length) return null;
    return availableCoupons.reduce((best, coupon) => {
      if (!coupon.isActive || new Date(coupon.expirationDate) < new Date() || coupon.usedCount >= coupon.usageLimit) return best;
      if (totalFinalPrice < (coupon.minOrderValue || 0)) return best;
      const discount = Math.min(
        (totalFinalPrice * coupon.discountPercentage) / 100,
        coupon.maxDiscountAmount || Infinity
      );
      if (!best || discount > best.discount) {
        return { ...coupon, discount };
      }
      return best;
    }, null);
  };

  const bestCoupon = suggestBestCoupon();

  const handlePlaceOrder = async () => {
    if (!cart.length || !defaultAddress || !checkoutDetails || !tempOrderId) {
      dispatch(showAlert({
        message: "Please complete cart, address, and wait for price calculation.",
        type: "info",
      }));
      return;
    }
    if (cart.some(item => !item.product_id?._id || !item.quantity)) {
      dispatch(showAlert({ message: "Invalid cart items.", type: "error" }));
      return;
    }
    const { subtotal, taxes, shippingCost, discount, finalPrice } = checkoutDetails;
    if (!subtotal || isNaN(subtotal) || subtotal <= 0) {
      dispatch(showAlert({ message: "Invalid subtotal amount.", type: "error" }));
      return;
    }
    if (finalPrice !== subtotal + (taxes || 0) + (shippingCost || 0) - (discount || 0)) {
      dispatch(showAlert({ message: "Price calculation mismatch.", type: "error" }));
      return;
    }
    const orderData = {
      address_id: defaultAddress,
      shipping_chrg: shippingCost || 0,
      discount: discount || totalOfferDiscount,
      items: cart.map((i) => ({
        product_id: i.product_id._id,
        quantity: i.quantity,
        price: i.final_price || (i.product_id.price * (1 - (i.product_id?.discount || 0) / 100)),
      })),
      amount: subtotal,
      taxes: taxes || 0,
      total: finalPrice,
      currency: "INR",
      paymentMethod,
      coupon: lastAppliedCoupon || undefined,
    };
    try {
      setIsLoading(true);
      if (paymentMethod === "COD") {
        const response = await placeOrder(orderData);
        setTempOrderId(null);
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
          order_id: tempOrderId,
        };
        const response = await createRazorpayOrder(razorpayData);
        const { data } = response;
        const razorpayOrder = data.order;
        if (!razorpayOrder || !razorpayOrder.id) {
          throw new Error("Invalid order response from Razorpay");
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
              const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = res;
              if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                dispatch(showAlert({ message: "Missing payment details", type: "error" }));
                return navigate("/order-failure", {
                  state: { orderId: tempOrderId, errorMessage: "Missing payment details" },
                });
              }
              await verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                order_id: tempOrderId,
              });
              const response = await placeOrder({
                ...orderData,
                razorpay_order_id,
                payment_id: razorpay_payment_id,
              });
              setTempOrderId(null);
              dispatch(showAlert({ message: "Payment successful!", type: "success" }));
              navigate("/order-success", {
                state: { orderId: response.data.order._id },
              });
            } catch (err) {
              console.error("Payment verification or order creation failed:", err);
              if (err.response?.data?.message?.includes("Duplicate order detected")) {
                const pendingOrderRes = await getPendingOrder();
                if (pendingOrderRes.data.order?.paymentStatus === "Completed") {
                  setTempOrderId(null);
                  dispatch(showAlert({ message: "Order already completed.", type: "success" }));
                  navigate("/order-success", {
                    state: { orderId: pendingOrderRes.data.order._id },
                  });
                } else {
                  dispatch(showAlert({
                    message: "Duplicate order detected. Please try again.",
                    type: "error",
                  }));
                  navigate("/order-failure", {
                    state: {
                      orderId: tempOrderId,
                      errorMessage: err.response?.data?.message || err.message,
                    },
                  });
                }
              } else {
                dispatch(showAlert({
                  message: "Payment failed: " + (err.response?.data?.message || err.message),
                  type: "error",
                }));
                navigate("/order-failure", {
                  state: {
                    orderId: tempOrderId,
                    errorMessage: err.response?.data?.message || err.message,
                  },
                });
              }
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
      } else if (paymentMethod === "Wallet") {
        const response = await placeOrder({
          ...orderData,
          payment_id: `WALLET_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        });
        setTempOrderId(null);
        dispatch(showAlert({ message: "Order placed using wallet!", type: "success" }));
        navigate("/order-success", {
          state: { orderId: response.data.order._id },
        });
      }
    } catch (err) {
      console.error("Order placement error:", err);
      if (err.response?.data?.message?.includes("Cash on Delivery is not allowed")) {
        dispatch(showAlert({
          message: "Cash on Delivery is not allowed for orders above Rs 1000. Please choose another payment method.",
          type: "error",
        }));
        setPaymentMethod("ONLINE");
      } else {
      dispatch(showAlert({
        message: "Order failed: " + (err.response?.data?.message || err.message),
        type: "error",
      }));
      
      navigate("/order-failure", {
        state: {
          orderId: tempOrderId,
          errorMessage: err.response?.data?.message || err.message,
        },
      });
    }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithOrder = () => {
    setShowPendingOrderDialog(false);
  };

  const handleCancelPendingOrder = async () => {
    try {
      await userAxios.post("/orders/cancel", { orderId: tempOrderId });
      setTempOrderId(null);
      setPendingOrder(null);
      setShowPendingOrderDialog(false);
      dispatch(showAlert({ message: "Pending order cancelled.", type: "success" }));
    } catch (err) {
      dispatch(showAlert({ message: "Failed to cancel pending order.", type: "error" }));
    }
  };

  if (cartLoading) return <BookLoader />;

  return (
    <div className="min-h-screen bg-yellow-50">
      <Navbar />
      <div className="flex gap-10 px-5 mx-auto my-10 max-w-[1200px] max-md:flex-col">
        {showPendingOrderDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Pending Order Detected</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have a pending order (ID: {pendingOrder?.orderID || tempOrderId}). Your cart may not match this order. What would you like to do?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleContinueWithOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Continue with Existing Order
                </button>
                <button
                  onClick={handleCancelPendingOrder}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold text-neutral-900">Delivery Address</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm(defaultAddressForm);
                setShowAddressForm(true);
              }}
              className="text-sm px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
            >
              + Add New Address
            </button>
          </div>
          {addresses.length ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scroll-yield">
              {addresses.map((a) => (
                <div
                  key={a._id}
                  onClick={() => setDefaultAddress(a._id)}
                  className={`p-3 rounded-md shadow-sm border transition-colors cursor-pointer ${
                    defaultAddress === a._id ? "border-l-4 border-green-600 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <FaHome className="text-yellow-600" />
                        {a.name} ({a.type})
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <FaPhone /> {a.phone}
                      </p>
                      <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
                        <FaMapMarkerAlt /> {a.place}, {a.district}, {a.city}, {a.state} - {a.pin}, {a.country}
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
                <h3 className="text-lg font-semibold">{editingAddress ? "Edit Address" : "Add New Address"}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["name", "phone", "place", "district", "city", "state", "country", "pin"].map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <input
                      name={field}
                      value={addressForm[field] || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, [e.target.name]: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                ))}
                <div className="flex flex-col col-span-1 md:col-span-2">
                  <label className="text-sm text-gray-600 mb-1">Type</label>
                  <div className="flex gap-6 mt-1">
                    {["Home", "Work"].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="type"
                          value={option}
                          checked={addressForm.type === option}
                          onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
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
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="accent-yellow-500"
                />
                <label className="text-sm text-gray-700">Set as default address</label>
              </div>
              <button
                onClick={handleAddressSubmit}
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded"
              >
                {editingAddress ? "Update Address" : "Add Address"}
              </button>
            </div>
          )}
          <div className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Payment Method</h2>
            <div className="space-y-3">
              {[
                { value: "ONLINE", label: "Debit/Credit Card (Razorpay)", icon: <FaCreditCard className="text-yellow-600" /> },
                { value: "COD", label: "Cash on Delivery", icon: <FaMoneyBillWave className="text-yellow-600" />,disabled: !isCODAllowed, disabledText: " not available for orders above ₹1000" },
                { value: "Wallet", label: "Wallet ", icon: <FaWallet className="text-yellow-600" />, disabled: walletBalance <= 0, disabledText: "Balance Insufficient " },
              ].map(({ value, label, icon, disabled, disabledText }) => (
                <label
                  key={value}
                  htmlFor={value}
                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition ${
                    paymentMethod === value ? "border-yellow-600 bg-yellow-50" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    id={value}
                    checked={paymentMethod === value}
                    onChange={() => !disabled && setPaymentMethod(value)}
                    disabled={disabled}
                    className="accent-yellow-500"
                  />
                  {icon}
                  <span className="text-gray-800">{label} {disabled && disabledText}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="w-[456px] max-md:w-full">
          <h3 className="text-2xl mb-3 text-yellow-600">Order Summary</h3>
          {cart.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 p-4 mb-3 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <img
                src={item.product_id?.product_imgs?.[0] || ""}
                alt={item.product_id?.title || "Product"}
                className="w-20 h-20 object-cover rounded-md border"
              />
              <div className="flex-1">
                <div className="font-medium text-base text-gray-800 line-clamp-2">{item.product_id?.title || "Product"}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Quantity: <span className="font-medium">{item.quantity}</span>
                </div>
                <div className="text-sm text-gray-600">
                  ₹{((item.final_price || (item.product_id?.price * (1 - (item.product_id?.discount || 0) / 100)) || 0)).toFixed(2)} × {item.quantity}
                  <span className="text-black font-semibold ml-1">
                    = ₹{((item.final_price || (item.product_id?.price * (1 - (item.product_id?.discount || 0) / 100)) || 0) * item.quantity).toFixed(2)}
                  </span>
                  {item.applied_offer && (
                    <span className="text-sm text-green-600 ml-2">({item.applied_offer} Offer)</span>
                  )}
                  {item.final_price < item.product_id?.price && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ₹{(item.product_id?.price * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-white p-4 rounded shadow mb-5">
            {lastAppliedCoupon && checkoutDetails?.discount > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-green-100 text-green-700 px-3 py-2 rounded text-sm">
                  <span>Coupon <strong>{lastAppliedCoupon}</strong> applied (-₹{checkoutDetails.discount.toFixed(2)})!</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:underline flex items-center text-sm"
                    disabled={isApplyingCoupon}
                  >
                    <FaTimes className="mr-1" /> Remove
                  </button>
                </div>
                <button
                  onClick={() => setShowCoupons(!showCoupons)}
                  className="flex items-center text-sm text-blue-600 hover:underline"
                >
                  <FaTag className="mr-2" />
                  {showCoupons ? "Hide Available Coupons" : "View Available Coupons"}
                  {showCoupons ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="block mb-1 font-medium text-yellow-600">Apply Coupon</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.trim());
                      setCouponError("");
                    }}
                    className="flex-1 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter coupon code"
                    disabled={isApplyingCoupon}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim() || !tempOrderId}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </button>
                </div>
                {/* <label className="block mb-1 font-medium text-yellow-600">Apply Referral Code</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.trim());
                      setReferralError("");
                    }}
                    className="flex-1 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter referral code (e.g., REF-USER-1234)"
                    disabled={isApplyingCoupon}
                  />
                  <button
                    onClick={handleApplyReferral}
                    disabled={isApplyingCoupon || !referralCode.trim() || !tempOrderId}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </button>
                </div> */}
                {bestCoupon && (
                  <p className="text-sm text-green-600">
                    Suggested: Use <strong>{bestCoupon.code}</strong> for ₹{bestCoupon.discount.toFixed(2)} off!
                    <button
                      onClick={() => {
                        setCouponCode(bestCoupon.code);
                        handleApplyCoupon();
                      }}
                      className="ml-2 text-blue-500 underline hover:text-blue-700"
                      disabled={isApplyingCoupon}
                    >
                      Apply Now
                    </button>
                  </p>
                )}
                <button
                  onClick={() => setShowCoupons(!showCoupons)}
                  className="flex items-center text-sm text-blue-600 hover:underline"
                >
                  <FaTag className="mr-2" />
                  {showCoupons ? "Hide Available Coupons" : "View Available Coupons"}
                  {showCoupons ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
                </button>
              </div>
            )}
            {showCoupons && (
              <div className="space-y-2 text-sm bg-yellow-100 p-3 rounded-md max-h-40 overflow-y-auto">
                {couponLoading ? (
                  <p className="text-gray-600">Loading coupons...</p>
                ) : availableCoupons.length ? (
                  availableCoupons.map((c) => {
                    const isExpired = new Date(c.expirationDate) < new Date();
                    const isUsedUp = c.usedCount >= c.usageLimit;
                    const isValid = c.isActive && !isExpired && !isUsedUp && totalFinalPrice >= (c.minOrderValue || 0);
                    return (
                      <div
                        key={c._id}
                        className={`p-2 rounded border ${isValid ? "border-green-500 bg-white" : "border-gray-300 bg-gray-100 text-gray-500"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{c.code} - {c.discountPercentage}% Off</div>
                            <div className="text-xs">
                              Exp: {new Date(c.expirationDate).toLocaleDateString()}
                              {c.minOrderValue ? ` | Min Order: ₹${c.minOrderValue}` : ""}
                              {c.maxDiscountAmount ? ` | Max Discount: ₹${c.maxDiscountAmount}` : ""}
                              {!isValid && (
                                isExpired ? " (Expired)" :
                                isUsedUp ? " (Usage Limit Reached)" :
                                totalFinalPrice < (c.minOrderValue || 0) ? ` (Requires ₹${c.minOrderValue})` :
                                " (Invalid)"
                              )}
                            </div>
                          </div>
                          {isValid && (
                            <button
                              onClick={() => {
                                setCouponCode(c.code);
                                handleApplyCoupon();
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                              disabled={isApplyingCoupon}
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
            {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
            {referralError && <p className="mt-2 text-sm text-red-600">{referralError}</p>}
            {isApplyingCoupon && <p className="mt-2 text-sm text-gray-600">Processing coupon...</p>}
          </div>
          <div className="p-4 border bg-white rounded-lg mt-4 shadow-sm">
            <div className="text-xl font-semibold text-center mb-3 text-gray-800">Price Details</div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
                <span>₹{(checkoutDetails?.subtotal || totalFinalPrice).toFixed(2)}</span>
              </div>
              {(checkoutDetails?.taxes || totalOfferDiscount > 0) && (
                <>
                  {totalOfferDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Offer Discount</span>
                      <span>-₹{totalOfferDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {checkoutDetails?.taxes > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>₹{(checkoutDetails.taxes).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₹{(checkoutDetails?.shippingCost || calculateShippingCost(addresses.find(a => a._id === defaultAddress)?.city || '')).toFixed(2)}</span>
              </div>
              {checkoutDetails?.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{lastAppliedCoupon ? "Coupon" : "Referral"} Discount</span>
                  <span>-₹{(checkoutDetails.discount).toFixed(2)}</span>
                </div>
              )}
              <hr className="my-2 border-gray-200" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{(checkoutDetails?.finalPrice || (totalFinalPrice + (totalFinalPrice * 0.1) + calculateShippingCost(addresses.find(a => a._id === defaultAddress)?.city || '') - totalOfferDiscount)).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              className="p-3 mt-4 w-full text-sm font-semibold bg-blue-600 rounded text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading || !checkoutDetails || !defaultAddress || !cart.length}
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