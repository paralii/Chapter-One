import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaMapMarkerAlt, FaPhone, FaHome, FaEdit, FaCheckCircle, FaMoneyBillWave, FaCreditCard, FaWallet, FaTimes, FaTag, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { addAddress, updateAddress, getAllUserAddresses } from "../../../api/user/addressAPI";
import { getWallet, debitWallet } from "../../../api/user/walletAPI";
import { getCart } from "../../../api/user/cartAPI";
import { getAvailableCoupons, applyCoupon, removeCoupon} from "../../../api/user/couponAPi";
import { checkout } from "../../../api/user/checkOutAPI";
import { placeOrder } from "../../../api/user/orderAPI";
import { showAlert } from "../../../redux/alertSlice";
import userAxios from "../../../api/userAxios";

import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import BookLoader from "../../../components/common/BookLoader";

function Checkout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "", phone: "", place: "", city: "",
    district: "", state: "", country: "", pin: "",
    type: "Home", isDefault: false,
  });

  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [isCODAllowed, setIsCODAllowed] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [checkoutDetails, setCheckoutDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);

  const [errors, setErrors] = useState({ order: "", pendingOrder: "" });

  const totalFinalPrice = useMemo(() => {
    if (!cart.length) return 0;
    return cart.reduce((acc, item) => {
      const unit = item.final_price ??
        (item.product_id?.price * (1 - (item.product_id?.discount || 0) / 100));
      return acc + unit * item.quantity;
    }, 0);
  }, [cart]);

  // Calculate totals from checkout details or cart
  const totals = useMemo(() => {
    if (checkoutDetails) {
      console.log(`checkout details:`, checkoutDetails);
      return {
        subtotal: checkoutDetails.total ?? 0,    // backend: total = subtotal
        discount: checkoutDetails.discount ?? 0,
        shipping: checkoutDetails.shipping_chrg ?? 0,
        taxes: checkoutDetails.taxes ?? 0,
        final: checkoutDetails.netAmount ?? 0,
      };
    }
    // fallback (rarely used; mainly until /checkout returns the first time)
    const original = cart.reduce((a, i) => a + (i.product_id?.price || 0) * i.quantity, 0);
    const final = totalFinalPrice;
    const taxes = final * 0.1;
    const shipping = 20;
    return {
      subtotal: final,
      discount: original - final,
      shipping,
      taxes,
      final: final + taxes + shipping,
    };
  }, [cart, checkoutDetails, totalFinalPrice]);

  const bestCoupon = useMemo(() => {
    if (!totalFinalPrice || !availableCoupons.length) return null;
    const now = new Date();
    return availableCoupons.reduce((best, c) => {
      if (!c.isActive || new Date(c.expirationDate) < now || c.usedCount >= c.usageLimit) return best;
      if (totalFinalPrice < (c.minOrderValue || 0)) return best;
      const discount = Math.min((totalFinalPrice * c.discountPercentage) / 100, c.maxDiscountAmount || Infinity);
      return !best || discount > best.discount ? { ...c, discount } : best;
    }, null);
  }, [availableCoupons, totalFinalPrice]);

  const fetchCheckout = useCallback(
    async () => {
      if (!selectedAddress?._id || !cart.length) return;
      const payload = {
        address_id: selectedAddress._id,
        paymentMethod,
      };
      try {
        setIsLoading(true);
        const { data } = await userAxios.post("/checkout", payload);
        const ord = data.order || data.checkoutDetails || null;
        if (!ord) throw new Error("Invalid /checkout response");
        setCheckoutDetails(ord);
        setIsCODAllowed((ord.netAmount || 0) <= 1000);
      } catch (err) {
        console.error("Checkout fetch failed:", err);
        dispatch(showAlert({ message: err.response?.data?.message || "Failed to load checkout details", type: "error" }));
      } finally {
        setIsLoading(false);
      }
    },
    [selectedAddress?._id, cart.length, paymentMethod, appliedCoupon, dispatch]
  );

  useEffect(() => {
    (async () => {
      try {
        setCouponLoading(true);
        setCartLoading(true);
        
        const [walletRes, cartRes, couponsRes, addressesRes] = await Promise.all([
          getWallet().catch(err => {
            console.error("Failed to fetch wallet:", err);
            dispatch(showAlert({ message: "Failed to fetch wallet balance", type: "error" }));
            return { data: { balance: 0 } };
          }),
          getCart().catch(err => {
            console.error("Failed to fetch cart:", err);
            dispatch(showAlert({ message: "Failed to fetch cart items", type: "error" }));
            return { data: { cart: { items: [] } } };
          }),
          getAvailableCoupons().catch(err => {
            console.error("Failed to fetch coupons:", err);
            dispatch(showAlert({ message: "Failed to fetch available coupons", type: "error" }));
            return { data: { coupons: [] } };
          }),
          getAllUserAddresses().catch(err => {
            console.error("Failed to fetch addresses:", err);
            dispatch(showAlert({ message: "Failed to fetch addresses", type: "error" }));
            return { data: { addresses: [] } };
          }),
        ]);

        // Set state with fallback values
        setWalletBalance(walletRes.data.balance || 0);
        setCart(cartRes.data.cart?.items || []);
        setAvailableCoupons(couponsRes.data.coupons || []);
        setAddresses(addressesRes.data.addresses || []);
        
        // Handle default address
        const def = addressesRes.data.addresses?.find((a) => a.isDefault);
        if (def) setSelectedAddress(def);
        else if (addressesRes.data.addresses?.length) setSelectedAddress(addressesRes.data.addresses[0]);

      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setCartLoading(false);
        setCouponLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchCheckout();
  }, [fetchCheckout]);

  const validateAddress = (a) => {
    const errs = {};
    if (!a.name?.trim()) errs.name = "Name required";
    if (!/^\d{10,}$/.test(a.phone || "")) errs.phone = "Valid phone required";
    if (!a.place?.trim()) errs.place = "Place required";
    if (!a.city?.trim()) errs.city = "City required";
    if (!a.state?.trim()) errs.state = "State required";
    if (!a.country?.trim()) errs.country = "Country required";
    if (!/^\d{4,}$/.test(a.pin || "")) errs.pin = "Valid PIN required";
    return errs;
  };

  const handleAddressSubmit = async () => {
    try {
      const errs = validateAddress(addressForm);
      if (Object.keys(errs).length) {
        dispatch(showAlert({ message: Object.values(errs).join(", "), type: "error" }));
        return;
      }
      setIsSavingAddress(true);
      if (editingAddress?._id) {
        await userAxios.put(`/addresses/${editingAddress._id}`, addressForm);
        dispatch(showAlert({ message: "Address updated", type: "success" }));
      } else {
        await userAxios.post(`/addresses`, addressForm);
        dispatch(showAlert({ message: "Address added", type: "success" }));
      }
      await getAllUserAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        name: "", phone: "", place: "", city: "",
        district: "", state: "", country: "", pin: "",
        type: "Home", isDefault: false,
      });
      // recalc with (possibly) new default address
      setTimeout(() => fetchCheckout(), 0);
    } catch (err) {
      console.error("Address save failed:", err);
      dispatch(showAlert({ message: err.response?.data?.message || "Failed to save address", type: "error" }));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleApplyCoupon = async (code = couponCode) => {
  const normalized = (code || "").trim();
  if (!normalized || !checkoutDetails?._id) return;
  setIsApplyingCoupon(true);
  try {
    const { data } = await applyCoupon({ couponCode: normalized, orderId: checkoutDetails._id });
    setAppliedCoupon(normalized);
    setCheckoutDetails(data.checkoutDetails || data.order);
    dispatch(showAlert({ message: `Coupon ${normalized} applied`, type: "success" }));
  } catch (err) {
    dispatch(showAlert({ message: err.response?.data?.message || "Failed to apply coupon", type: "error" }));
  } finally {
    setIsApplyingCoupon(false);
  }
};

  const handleRemoveCoupon = async () => {
  if (!checkoutDetails?._id) return;
  setIsApplyingCoupon(true);
  try {
    const { data } = await removeCoupon({ orderId: checkoutDetails._id });
    setAppliedCoupon(null);
    setCouponCode("");
    setCheckoutDetails(data.checkoutDetails || data.order);
    dispatch(showAlert({ message: "Coupon removed", type: "info" }));
  } catch (err) {
    dispatch(showAlert({ message: err.response?.data?.message || "Failed to remove coupon", type: "error" }));
  } finally {
    setIsApplyingCoupon(false);
  }
};


  const handlePlaceOrder = async () => {
    try {
      if (!checkoutDetails || !selectedAddress?._id) {
        return dispatch(showAlert({ message: "Select address and wait for summary", type: "error" }));
      }
      if (paymentMethod === "COD" && (checkoutDetails.netAmount || 0) > 1000) {
        return dispatch(showAlert({ message: "COD not allowed for orders above ₹1000", type: "error" }));
      }

      setIsLoading(true);

      const { data } = await userAxios.post("/orders", {
      orderId: checkoutDetails._id,
      address_id: selectedAddress._id,
      paymentMethod,
    });

    const order = data.order;

    if (paymentMethod === "ONLINE") {
      // Step 2: create Razorpay order
      const { data: razor } = await userAxios.post("/payment/create-order", {
        amount: order.netAmount,
        order_id: order._id,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razor.order.amount,
        currency: razor.order.currency,
        name: "My Shop",
        description: `Order ${order.orderID}`,
        order_id: razor.order.id,
        handler: async function (response) {
          await userAxios.post("/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: order._id,
          });
          navigate("/order-success", { state: { orderId: order._id } });
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9876543210",
        },
        theme: { color: "#F37254" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      dispatch(showAlert({ message: "Order placed successfully", type: "success" }));
      navigate("/order-success", { state: { orderId: order._id } });
    }
    } catch (err) {
      console.error("Place order failed:", err);
      setErrors(e => ({ ...e, order: err.response?.data?.message || "Order failed" }));
      dispatch(showAlert({ message: err.response?.data?.message || "Order failed", type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <BookLoader />;

  return (
    <div className="min-h-screen bg-yellow-50">
      <Navbar />
      <div className="flex gap-10 px-5 mx-auto my-10 max-w-[1200px] max-md:flex-col">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold text-neutral-900">Delivery Address</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({
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
                });
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
                  onClick={() => setSelectedAddress(a)}
                  className={`p-3 rounded-md shadow-sm border transition-colors cursor-pointer ${
                    selectedAddress?._id === a._id ? "border-l-4 border-green-600 bg-green-50" : "border-gray-200 bg-white"
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
                      {selectedAddress._id === a._id && (
                        <span className="text-green-600 flex items-end gap-1">
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
                { value: "Wallet", label: `Wallet (₹${walletBalance.toFixed(2)})`, icon: <FaWallet className="text-yellow-600" />, disabled: walletBalance <= 0, disabledText: "Balance Insufficient ", walletBalance },
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
            {appliedCoupon && checkoutDetails?.discount > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-green-100 text-green-700 px-3 py-2 rounded text-sm">
                  <span>Coupon <strong>{appliedCoupon}</strong> applied (-₹{checkoutDetails.discount.toFixed(2)})!</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:underline flex items-center text-sm"
                    disabled={isLoading}
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
                    onClick={() => handleApplyCoupon(couponCode)}
                    disabled={isLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Applying..." : "Apply"}
                  </button>
                </div>

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
            {isApplyingCoupon && <p className="mt-2 text-sm text-gray-600">Processing coupon...</p>}
          </div>
          <div className="p-4 border bg-white rounded-lg mt-4 shadow-sm">
            <div className="text-xl font-semibold text-center mb-3 text-gray-800">Price Details</div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {/* {totals.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{totals.discount.toFixed(2)}</span>
                </div>
              )} */}
              <div className="flex justify-between text-sm">
                <span>Tax(18%)</span>
                <span>₹{totals.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₹{totals.shipping.toFixed(2)}</span>
              </div>
              {checkoutDetails?.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{appliedCoupon ? "Coupon" : "Total "} Discount</span>
                  <span>-₹{(checkoutDetails.discount).toFixed(2)}</span>
                </div>
              )}
              <hr className="my-2 border-gray-200" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{totals.final.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              className="p-3 mt-4 w-full text-sm font-semibold bg-blue-600 rounded text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading || !checkoutDetails || !selectedAddress || !cart.length}
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