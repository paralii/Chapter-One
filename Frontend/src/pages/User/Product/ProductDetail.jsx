import React,{ useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";

import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import BookLoader from "../../../components/common/BookLoader";

import { Heart, Heart as HeartFilled } from "lucide-react";
import { RelatedProductCard } from "../../../components/User/ProductCard";
import { getProducts, getProductById } from "../../../api/user/productAPI";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../../api/user/wishlistAPI";
import { addToCart } from "../../../api/user/cartAPI";
import { showAlert } from "../../../redux/alertSlice";
import { MAX_ALLOWED_QUANTITY } from "../../../utils/constants";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import userAxios from "../../../api/userAxios";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeImage, setActiveImage] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  const [productOffers, setProductOffers] = useState([]);
  const [categoryOffers, setCategoryOffers] = useState([]);

  const getImageUrl = (url) =>
    url
      ?`${url}`
      : "https://via.placeholder.com/150x200?text=No+Image";

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await getProductById(id);
      const prod = res.data;

      if (!prod) {
        setError("Product not found");
        return;
      }
      if (prod.status === "blocked" || prod.available === false) {
        navigate("/products");
        return;
      }
      setProduct(prod);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Error fetching product"
      );
    } finally {
      setLoading(false);
      setInitialDataLoaded(true);

    }
  };

  const fetchWishlistStatus = async () => {
    try {
      const res = await getWishlist();
      const wishlistItems = res.data.wishlist?.products || [];
      setIsInWishlist(wishlistItems.some((item) => item.product_id._id === id));
    } catch (err) {
      console.error("Error fetching wishlist status:", err);
    }
  };

  useEffect(() => {
    if (!product) return;

    const fetchOffers = async () => {
      try {
        // product offers
        const pRes = await userAxios.get(`/offers?productId=${product._id}&type=PRODUCT`);
        setProductOffers(pRes.data.offers || []);

        // category offers (if category exists)
        if (product.category_id?._id) {
          const cRes = await userAxios.get(`/offers?categoryId=${product.category_id._id}&type=CATEGORY`);
          setCategoryOffers(cRes.data.offers || []);
        } else {
          setCategoryOffers([]);
        }
      } catch (err) {
        console.error("Error fetching offers:", err);
        // don't set global error; offers failing shouldn't block the product view
      }
    };

    fetchOffers();
  }, [product]);

  useEffect(() => {
    fetchProductDetails();
    fetchWishlistStatus();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const { data } = await userAxios.get(`/products/${id}/related`);
        setRelatedProducts(data.data);
        setRelatedLoading(false);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch related products");
      }
    };

    fetchRelated();
  }, [id]);

    // merged offers list for display and calculation
  const allOffers = useMemo(() => {
    // Keep original offer objects (with type field populated by backend)
    const merged = [
      ...((productOffers && Array.isArray(productOffers)) ? productOffers : []),
      ...((categoryOffers && Array.isArray(categoryOffers)) ? categoryOffers : []),
    ];
    return merged;
  }, [productOffers, categoryOffers]);

  // Compute finalPrice and appliedOffer (best discount)
  const { finalPrice, appliedOffer } = useMemo(() => {
    if (!product) return { finalPrice: 0, appliedOffer: null };

    const basePrice = Number(product.price) || 0;
    let bestPrice = basePrice;
    let bestOffer = null;

    // consider productOffers and categoryOffers
    allOffers.forEach((offer) => {
      if (!offer || (!offer.discount_type && offer.discount_value == null)) return;

      const type = offer.discount_type; // "PERCENTAGE" or "FLAT"
      const value = Number(offer.discount_value) || 0;
      let candidatePrice = basePrice;

      if (type === "PERCENTAGE") {
        candidatePrice = basePrice - (basePrice * value) / 100;
      } else {
        // FLAT
        candidatePrice = basePrice - value;
      }

      if (candidatePrice < bestPrice) {
        bestPrice = candidatePrice;
        bestOffer = {
          kind: offer.type || "OFFER", // "PRODUCT" or "CATEGORY" (backend)
          offerObject: offer,
        };
      }
    });

    // also consider product.discount field (legacy product-level discount field)
    if (product.discount && Number(product.discount) > 0) {
      const pd = Number(product.discount);
      const prodDiscPrice = basePrice - (basePrice * pd) / 100;
      if (prodDiscPrice < bestPrice) {
        bestPrice = prodDiscPrice;
        bestOffer = {
          kind: "PRODUCT_FIELD",
          offerObject: {
            discount_type: "PERCENTAGE",
            discount_value: pd,
          },
        };
      }
    }

    // never go below 0
    if (bestPrice < 0) bestPrice = 0;

    return { finalPrice: bestPrice, appliedOffer: bestOffer };
  }, [product, allOffers]);

  const incrementQuantity = () => {
    if (quantity < MAX_ALLOWED_QUANTITY && quantity < product.available_quantity) {
      setQuantity(quantity + 1);
    } else {
      dispatch(
        showAlert({
          message: "Maximum quantity reached or exceeds available stock.",
          type: "info",
        })
      );
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleAddToCart = async () => {
    try {
      await addToCart({ product_id: product._id, quantity });
      dispatch(
        showAlert({ message: "Product added to cart!", type: "success" })
      );
    } catch (error) {
      console.error(
        "Error adding to cart:",
        error.response?.data || error.message
      );
      dispatch(
        showAlert({
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to add product to cart.",
          type: "error",
        })
      );
    }
  };

  const toggleWishlist = async () => {
    try {
      if (isInWishlist) {
        await removeFromWishlist(product._id);
        setIsInWishlist(false);
        dispatch(
          showAlert({ message: "Removed from wishlist!", type: "success" })
        );
      } else {
        await addToWishlist(product._id);
        setIsInWishlist(true);
        dispatch(
          showAlert({ message: "Added to wishlist!", type: "success" })
        );
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
      const message =
        err.response?.data?.message === "Product already in wishlist"
          ? "Product is already in your wishlist."
          : "Failed to update wishlist.";
      dispatch(showAlert({ message, type: "error" }));
    }
  };

  const handleBuyNow = () => {
    const buyNowData = {
      product_id: product._id,
      title: product.title,
      price: product.price,
      product_imgs: product.product_imgs,
      quantity,
    };
    localStorage.setItem("buyNowItem", JSON.stringify(buyNowData));
    navigate("/checkout", { state: { fromBuyNow: true } });
  };

    if (!animationDone || !initialDataLoaded) {
    return <BookLoader onFinish={() => setAnimationDone(true)} />;
  }
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8e5] text-red-500">
        {error}
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8e5]">
        Product not found.
      </div>
    );

  const mainImage = getImageUrl(product.product_imgs?.[0]);
  const smallImages = product.product_imgs?.slice(1, 3).map(getImageUrl) || [];

  return (
    <div className="min-h-screen bg-[#fff8e5] font-Inter text-[#3c2712]">
      <Navbar />

      {/* Breadcrumbs */}
      <div className="px-4 pt-4 text-sm text-gray-600">
        <nav className="space-x-1">
          <Link to="/" className="hover:underline">
            Home
          </Link>{" "}
          &gt;
          <Link to="/products" className="hover:underline ml-1">
            Products
          </Link>{" "}
          &gt;
          <span className="font-medium ml-1">{product.title}</span>
        </nav>
      </div>

      <main className="px-4 py-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left: Images */}
        <div className="flex flex-col items-center gap-4 w-full lg:max-w-sm">
          {/* Main Image */}
          <div
            onClick={() => setIsZoomOpen(true)}
            className="relative w-full max-w-xs h-[420px] border border-[#fcd385] shadow-md rounded-xl overflow-hidden cursor-zoom-in group"
          >
            <Zoom>
              <img
                src={getImageUrl(activeImage || mainImage)}
                alt="Selected Product"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </Zoom>
            <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
              Click to Zoom
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 flex-wrap justify-center">
            {product.product_imgs?.map((img, idx) => (
              <img
                key={idx}
                src={getImageUrl(img)}
                onClick={() => setActiveImage(img)}
                alt={`Thumbnail ${idx + 1}`}
                className={`w-[60px] h-[85px] object-cover rounded-lg border transition-transform cursor-pointer
                  ${
                    img === activeImage
                      ? "border-[#fca120] scale-105"
                      : "border-[#ffe5b8]"
                  }`}
                loading="lazy"
              />
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <button
              onClick={toggleWishlist}
              className="text-[#fca120] hover:text-[#e28f00] transition"
              title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {isInWishlist ? (
                <HeartFilled className="w-6 h-6 fill-[#fca120]" />
              ) : (
                <Heart className="w-6 h-6" />
              )}
            </button>
          </div>

          <p className="text-sm italic">
            By {product.author_name || "Unknown Author"}
          </p>

          <div className="text-sm font-medium">
            {product.available_quantity > 0 ? (
              <span className="text-[#41b200]">In Stock</span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>

          {/* Price (finalPrice & appliedOffer shown) */}
          <div className="flex items-center gap-2">
            {finalPrice < Number(product.price) && (
              <span className="text-lg font-bold text-red-600 line-through">
                ₹{Number(product.price).toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-semibold">₹{Number(finalPrice).toFixed(2)}</span>

            {finalPrice < Number(product.price) && appliedOffer && (
              <span className="text-sm text-green-600">
                {appliedOffer.kind === "PRODUCT_FIELD"
                  ? `(${appliedOffer.offerObject.discount_value}% OFF – Product Discount)`
                  : appliedOffer.offerObject.discount_type === "PERCENTAGE"
                    ? `(${appliedOffer.offerObject.discount_value}% OFF – ${appliedOffer.offerObject.type === "CATEGORY" ? "Category Offer" : "Product Offer"})`
                    : `(${appliedOffer.offerObject.discount_value}₹ OFF – ${appliedOffer.offerObject.type === "CATEGORY" ? "Category Offer" : "Product Offer"})`}
              </span>
            )}
          </div>

          {/* Available Offers: list all offers (product offers + category offers + product field discount if any) */}
          {(allOffers.length > 0 || (product.discount && Number(product.discount) > 0)) && (
            <div className="space-y-2 mt-4 text-sm">
              <h2 className="font-semibold">Available Offers</h2>
              <ul className="list-disc pl-5">
                {/* product.discount field */}
                {product.discount && Number(product.discount) > 0 && (
                  <li>
                    {product.discount}% off on this product (Product discount)
                  </li>
                )}

                {/* product offers */}
                {productOffers.map((offer) => (
                  <li key={offer._id}>
                    {offer.discount_type === "PERCENTAGE"
                      ? `${offer.discount_value}% off`
                      : `₹${offer.discount_value} off`}{" "}
                    on {offer.product_id?.title || "this product"} (Expires {new Date(offer.end_date).toLocaleDateString()})
                  </li>
                ))}

                {/* category offers */}
                {categoryOffers.map((offer) => (
                  <li key={offer._id}>
                    {offer.discount_type === "PERCENTAGE"
                      ? `${offer.discount_value}% off`
                      : `₹${offer.discount_value} off`}{" "}
                    on category {offer.category_id?.name || "this category"} (Expires {new Date(offer.end_date).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlights / Specs */}
          <div className="space-y-2 mt-4 text-sm">
            <h2 className="font-semibold">Product Highlights</h2>
            <p>
              {product.highlights ||
                "No highlights available for this product."}
            </p>
          </div>

          <div className="space-y-2 mt-4 text-sm">
            <h2 className="font-semibold">Product Specs</h2>
            <p>
              {product.specs || "No specifications available for this product."}
            </p>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2 border border-[#fcd385] rounded-md w-fit overflow-hidden">
            <button
              onClick={decrementQuantity}
              className="px-3 py-1 bg-[#fff1d2] hover:bg-[#ffe5b8] border-r border-[#fcd385]"
            >
              −
            </button>
            <span className="px-4 py-1 bg-white">{quantity}</span>
            <button
              onClick={incrementQuantity}
              className="px-3 py-1 bg-[#fff1d2] hover:bg-[#ffe5b8] border-l border-[#fcd385]"
            >
              +
            </button>
          </div>

          {/* Add to Cart and Buy Now buttons */}
          <div className="flex flex-wrap gap-4 pt-3">
            <button
              onClick={handleAddToCart}
              disabled={product.available_quantity <= 0}
              className="px-5 py-2 bg-[#fca120] text-white font-semibold rounded-md hover:bg-[#e8940d] disabled:opacity-50 transition"
            >
              Add to Cart
            </button>
            {/* <button
              onClick={handleBuyNow}
              className="px-5 py-2 bg-[#41b200] text-white font-semibold rounded-md hover:bg-[#369400] transition"
            >
              Buy Now
            </button> */}
          </div>
        </div>
      </main>

      {/* Related Products */}
      <section className="max-w-7xl mx-auto px-4 py-8 mt-12">
  <h2 className="text-2xl font-bold text-[#3c2712] mb-2">
    Related Products
  </h2>
  <p className="text-sm text-gray-600 mb-6">You may also like</p>

  {relatedLoading ? (
    <div className="flex justify-center items-center text-lg text-[#fca120]">
      Loading related products...
    </div>
  ) : relatedProducts.length > 0 ? (
    <div className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar">
      {relatedProducts.map((prod) => (
        <RelatedProductCard key={prod._id} product={prod} />
      ))}
    </div>
  ) : (
    <div className="text-center text-[#fca120]">
      No related products found.
    </div>
  )}
</section>


      <Footer />
    </div>
  );
}

export default ProductDetail;