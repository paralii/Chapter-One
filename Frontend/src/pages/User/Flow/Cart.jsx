import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import BookLoader from "../../../components/common/BookLoader";
import showConfirmDialog from "../../../components/common/ConformationModal";

import { getCart, removeCartItem, incrementCartItemQuantity, decrementCartItemQuantity } from "../../../api/user/cartAPI";

import userAxios from "../../../api/userAxios";

const MAX_ALLOWED = 5;

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantityLoading, setQuantityLoading] = useState({});
  const [removing, setRemoving] = useState({});

  const fetchCartItems = async () => {
    try {
      setError(null);
      const response = await getCart();
      const items = response?.data?.cart?.items;

      if (!Array.isArray(items)) {
        setCart([]);
        setCartTotal(0);
        setError("Cart data is invalid or missing.");
        return;
      }

      const productOffersCache = {};
      const categoryOffersCache = {};

      const cartWithOffers = await Promise.all(
        items.map(async (item) => {
          if (!item.product_id) return item;

          const prod = item.product_id;
          const prodId = prod._id;
          let productOffers = [];
          let categoryOffers = [];

          try {
            if (productOffersCache[prodId]) {
              productOffers = productOffersCache[prodId];
            } else {
              const offerRes = await userAxios.get(`/offers?productId=${prodId}&type=PRODUCT`);
              productOffers = offerRes?.data?.offers || [];
              productOffersCache[prodId] = productOffers;
            }

            const catId = prod.category_id?._id;
            if (catId) {
              if (categoryOffersCache[catId]) {
                categoryOffers = categoryOffersCache[catId];
              } else {
                const cRes = await userAxios.get(`/offers?categoryId=${catId}&type=CATEGORY`);
                categoryOffers = cRes?.data?.offers || [];
                categoryOffersCache[catId] = categoryOffers;
              }
            }
          } catch (err) {
            console.error("Error fetching offers for product/category:", prodId, err?.message || err);
          }

          return {
            ...item,
            productOffers,
            categoryOffers,
          };
        })
      );

      setCart(cartWithOffers);
      setCartTotal(response.data.total ?? 0);
    } catch (err) {
      console.error("Cart fetch error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load cart.");
      setCart([]);
      setCartTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleUpdateQuantity = async (item, change) => {
    if (!item || !item.product_id || !item.product_id._id) return;
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;
    if (newQuantity > (item.product_id.available_quantity || 0) || newQuantity > MAX_ALLOWED) return;
    if (quantityLoading[item.product_id._id]) return;

    setQuantityLoading((prev) => ({ ...prev, [item.product_id._id]: true }));
    try {
      if (change === 1) {
        await incrementCartItemQuantity({ product_id: item.product_id._id });
      } else {
        await decrementCartItemQuantity({ product_id: item.product_id._id });
      }
      await fetchCartItems();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update quantity.");
    } finally {
      setQuantityLoading((prev) => ({ ...prev, [item.product_id._id]: false }));
    }
  };

  const handleRemove = (productId) => {
    if (!productId || removing[productId]) return;
    showConfirmDialog({
      message: "Do you want to remove this item from your cart?",
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      onConfirm: async () => {
        setRemoving((prev) => ({ ...prev, [productId]: true }));
        try {
          await removeCartItem(productId);
          setCart((prevCart) => prevCart.filter((item) => item.product_id?._id !== productId));
          await fetchCartItems();
        } catch (err) {
          setError(err?.response?.data?.message || err?.message || "Failed to remove item.");
        } finally {
          setRemoving((prev) => ({ ...prev, [productId]: false }));
        }
      },
    });
  };

  const calculateDiscountPrice = (product = {}, item = {}) => {
    const basePrice = Number(product.price) || 0;
    let bestPrice = basePrice;
    let appliedOffer = null;
    let hasDiscount = false;

    if (product.discount && Number(product.discount) > 0) {
      const pd = Number(product.discount);
      const pdPrice = basePrice - (basePrice * pd) / 100;
      if (pdPrice < bestPrice) {
        bestPrice = pdPrice;
        appliedOffer = { kind: "PRODUCT_FIELD", discount_type: "PERCENTAGE", discount_value: pd };
      }
    }

    const prodOffers = Array.isArray(item.productOffers) ? item.productOffers : [];
    for (const offer of prodOffers) {
      const value = Number(offer.discount_value) || 0;
      const candidate = offer.discount_type === "PERCENTAGE"
        ? basePrice - (basePrice * value) / 100
        : basePrice - value;
      if (candidate < bestPrice) {
        bestPrice = candidate;
        appliedOffer = { kind: "PRODUCT_OFFER", offer };
      }
    }

    const catOffers = Array.isArray(item.categoryOffers) ? item.categoryOffers : [];
    for (const offer of catOffers) {
      const value = Number(offer.discount_value) || 0;
      const candidate = offer.discount_type === "PERCENTAGE"
        ? basePrice - (basePrice * value) / 100
        : basePrice - value;
      if (candidate < bestPrice) {
        bestPrice = candidate;
        appliedOffer = { kind: "CATEGORY_OFFER", offer };
      }
    }

    if (bestPrice < basePrice) hasDiscount = true;
    if (bestPrice < 0) bestPrice = 0;

    return { hasDiscount, discountPrice: bestPrice, appliedOffer };
  };

  const totalOriginalPrice = useMemo(
    () => (cart || []).reduce((acc, item) => acc + (Number(item.product_id?.price) || 0) * (item.quantity || 0), 0),
    [cart]
  );

  const totalDiscount = useMemo(() => {
    return (cart || []).reduce((acc, item) => {
      const product = item.product_id || {};
      const { discountPrice } = calculateDiscountPrice(product, item);
      const itemDiscount = ((Number(product.price) || 0) - discountPrice) * (item.quantity || 0);
      return acc + (itemDiscount > 0 ? itemDiscount : 0);
    }, 0);
  }, [cart]);

  const hasOutOfStock = cart.some((item) => item.quantity > (item.product_id?.available_quantity || 0));

  if (loading) return <BookLoader />;

  return (
    <div className="min-h-screen bg-[#fff8e5] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center">
        <div className="w-full flex justify-center p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 2xl:p-12">
          <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] p-2 sm:p-4 lg:p-6 xl:p-8 flex flex-col gap-4 lg:gap-6 xl:gap-8">
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-center text-stone-700 font-bold tracking-wide">Shopping Cart</h1>

            <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 xl:gap-8 w-full">
              {/* Cart Items */}
              <section className="w-full lg:w-[70%] flex flex-col gap-2 lg:gap-3 xl:gap-4">
                {error && <div className="text-red-500 text-center py-2">Error: {error}</div>}

                {cart.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-full py-10 sm:py-14">
                    <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty Cart" className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-4 opacity-70" />
                    <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-2">Your cart is empty.</p>
                    <button onClick={() => navigate("/products")}
                      className="px-4 py-2 sm:px-6 sm:py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-500 transition-all duration-200 text-xs sm:text-sm md:text-base">
                      Shop Now
                    </button>
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="space-y-3 sm:space-y-4 md:space-y-6">
                    {cart.map((item) => {
                      if (!item.product_id) return null;
                      const product = item.product_id;
                      const { hasDiscount, discountPrice, appliedOffer } = calculateDiscountPrice(product, item);

                      let appliedLabel = "";
                      if (appliedOffer) {
                        if (appliedOffer.kind === "PRODUCT_FIELD") {
                          appliedLabel = `(${appliedOffer.discount_value}% OFF)`;
                        } else if (appliedOffer.kind === "PRODUCT_OFFER") {
                          const o = appliedOffer.offer;
                          appliedLabel = o.discount_type === "PERCENTAGE" ? `(${o.discount_value}% OFF - Product Offer)` : `(₹${o.discount_value} OFF - Product Offer)`;
                        } else if (appliedOffer.kind === "CATEGORY_OFFER") {
                          const o = appliedOffer.offer;
                          appliedLabel = o.discount_type === "PERCENTAGE" ? `(${o.discount_value}% OFF - Category Offer)` : `(₹${o.discount_value} OFF - Category Offer)`;
                        }
                      }

                      return (
                        <div
                          key={item._id}
                          className={`flex flex-row items-stretch gap-3 sm:gap-4 lg:gap-6 xl:gap-8 p-2 sm:p-4 lg:p-5 xl:p-6 border border-gray-200 rounded-lg bg-[#fffdf8] shadow-sm relative ${item.quantity > (product.available_quantity || 0) ? "opacity-60" : ""}`}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Image */}
                          <div className="flex-shrink-0 flex items-center justify-center h-16 w-12 sm:h-20 sm:w-16 lg:h-24 lg:w-20 xl:h-28 xl:w-24 2xl:h-32 2xl:w-28">
                            <img
                              src={product.product_imgs?.[0] || "https://via.placeholder.com/150"}
                              alt={product.title || "Product image"}
                              className="object-cover rounded-lg h-full w-full border"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 flex flex-row items-center min-w-0 gap-2">
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className="font-semibold text-yellow-950 text-sm lg:text-base xl:text-lg truncate">{product.title || "Unknown Product"}</div>
                              <div className="text-xs lg:text-sm text-gray-600">{product.author_name || ""}</div>
                              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 xs:gap-2 lg:gap-3">
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <span className="text-sm lg:text-base xl:text-lg font-bold text-lime-700">
                                    ₹{(discountPrice * item.quantity).toFixed(2)}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-xs lg:text-sm text-red-500 line-through">
                                      ₹{(Number(product.price) * item.quantity).toFixed(2)}
                                    </span>
                                  )}
                                </div>

                                {hasDiscount && (
                                  <span className="text-xs lg:text-sm text-green-700 font-semibold whitespace-nowrap">
                                    {appliedLabel}
                                  </span>
                                )}
                              </div>

                            </div>

                            {/* Quantity & Remove */}
                            <div className="flex items-center gap-2 ml-auto">
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={item.quantity <= 1 || quantityLoading[product._id]}
                                  className={`h-6 w-6 flex items-center justify-center border rounded-full text-sm font-bold ${item.quantity <= 1 || quantityLoading[product._id] ? "border-gray-300 text-gray-300 cursor-not-allowed" : "border-lime-600 text-lime-700 hover:bg-lime-50"}`}
                                  onClick={() => handleUpdateQuantity(item, -1)}
                                >
                                  {quantityLoading[product._id] ? <span className="animate-spin">-</span> : "-"}
                                </button>
                                <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                                <button
                                  disabled={item.quantity >= (product.available_quantity || 0) || item.quantity >= MAX_ALLOWED || quantityLoading[product._id]}
                                  className={`h-6 w-6 flex items-center justify-center border rounded-full text-sm font-bold ${(item.quantity >= (product.available_quantity || 0) || item.quantity >= MAX_ALLOWED || quantityLoading[product._id]) ? "border-gray-300 text-gray-300 cursor-not-allowed" : "border-lime-600 text-lime-700 hover:bg-lime-50"}`}
                                  onClick={() => handleUpdateQuantity(item, 1)}
                                >
                                  {quantityLoading[product._id] ? <span className="animate-spin">+</span> : "+"}
                                </button>
                              </div>
                              <button
                                className={`px-2 py-1 bg-zinc-800 text-white rounded text-xs font-medium hover:bg-zinc-700 transition-all duration-200 ${removing[product._id] ? "opacity-60 cursor-not-allowed" : ""}`}
                                onClick={() => handleRemove(product._id)}
                                disabled={removing[product._id]}
                                style={{ minWidth: '60px' }}
                              >
                                {removing[product._id] ? "..." : "Remove"}
                              </button>
                            </div>

                            {/* Out of Stock */}
                            {item.quantity > (product.available_quantity || 0) && (
                              <div className="text-red-600 text-xs sm:text-sm font-semibold mt-1">Out of Stock</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Price Details */}
              {cart.length > 0 && (
                <aside className="bg-white rounded-lg shadow border border-gray-100 p-3 lg:p-5 xl:p-6 w-full lg:w-[30%] h-fit">
                  <div className="text-sm lg:text-base xl:text-lg font-bold text-gray-800 border-b pb-2 lg:pb-3">Price Details</div>
                  <div className="flex justify-between items-center py-1.5 lg:py-2">
                    <span className="text-xs lg:text-sm text-gray-600">Subtotal ({cart.length} Items)</span>
                    <span className="text-xs lg:text-sm font-medium">₹{totalOriginalPrice.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center py-1.5 lg:py-2">
                      <span className="text-xs lg:text-sm text-green-600">Discount</span>
                      <span className="text-xs lg:text-sm font-medium text-green-600">-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t my-2 lg:my-3"></div>
                  <div className="flex justify-between items-center py-1 lg:py-2">
                    <span className="text-sm lg:text-base xl:text-lg font-medium">Total Amount</span>
                    <span className="text-sm lg:text-base xl:text-lg font-bold">₹{(cartTotal || (totalOriginalPrice - totalDiscount)).toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-xs lg:text-sm text-green-600 mt-1">
                      <span>You Save</span>
                      <span>₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-[10px] lg:text-xs text-gray-500 mt-2 lg:mt-3">
                    Delivery charges (if any) will be calculated at checkout.
                  </div>
                  <button
                    disabled={hasOutOfStock}
                    className={`py-2 lg:py-3 mt-3 lg:mt-4 w-full text-xs lg:text-sm xl:text-base font-medium text-center rounded cursor-pointer text-white ${hasOutOfStock ? "bg-gray-400" : "bg-lime-600 hover:bg-lime-500"}`}
                    onClick={() => !hasOutOfStock && navigate("/checkout")}
                  >
                    Proceed to Checkout
                  </button>
                </aside>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
