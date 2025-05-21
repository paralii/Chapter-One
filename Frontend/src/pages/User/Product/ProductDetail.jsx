import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import BookLoader from "../../../components/common/BookLoader";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../redux/alertSlice";
import { Heart, Heart as HeartFilled } from "lucide-react";
import { RelatedProductCard } from "../../../components/User/ProductCard";
import { getProducts, getProductById } from "../../../api/user/productAPI";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../../../api/user/wishlistAPI";
import { addToCart } from "../../../api/user/cartAPI";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

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
  
  const maxQuantity = 5;

  const getImageUrl = (url) =>
    url
      ? url.startsWith("http")
        ? url
        : `${url}`
      : "https://via.placeholder.com/150x200?text=No+Image";

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await getProductById(id);
      const prod = res.data;

      if (prod.status === "blocked" || prod.available === false) {
        navigate("/products");
        return;
      }
      setInitialDataLoaded(true);
      setProduct(prod);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Error fetching product"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      setRelatedLoading(true);
      const res = await getProducts({ page: 1, limit: 8 });
      setRelatedProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching related products", err);
    } finally {
      setRelatedLoading(false);
    }
  };

  const fetchWishlistStatus = async () => {
    try {
      const res = await getWishlist();

      const wishlistItems = Array.isArray(res?.data?.wishlist)
        ? res.data.wishlist
        : [];
      setIsInWishlist(wishlistItems.some((item) => item._id === id));
    } catch (err) {
      console.error("Error fetching wishlist", err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    fetchWishlistStatus();
  }, [id]);

  useEffect(() => {
    fetchRelatedProducts();
  }, []);

  if (!animationDone || !initialDataLoaded) {
    return <BookLoader onFinish={() => setAnimationDone(true)} />;
  }  if (error)
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

  const incrementQuantity = () => {
    if (quantity < maxQuantity && quantity < product.available_quantity) {
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
      } else {
        await addToWishlist(product._id);
      }
      setIsInWishlist(!isInWishlist);
    } catch (err) {
      dispatch(
        showAlert({ message: "Failed to update wishlist", type: "error" })
      );
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

  const hasDiscount = product.discount > 0;
  const discountPrice = hasDiscount
    ? product.price - (product.price * product.discount) / 100
    : null;

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

          {/* Price */}
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-lg font-bold text-red-600 line-through">
                ₹{product.price}
              </span>
            )}
            <span className="text-2xl font-semibold">
              ₹{discountPrice || product.price}
            </span>
            {hasDiscount && (
              <span className="text-sm text-green-600">
                ({product.discount}% OFF)
              </span>
            )}
          </div>

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
            <button
              onClick={handleBuyNow}
              className="px-5 py-2 bg-[#41b200] text-white font-semibold rounded-md hover:bg-[#369400] transition"
            >
              Buy Now
            </button>
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
            {relatedProducts.map((prod, i) => (
              <div
                key={i}
                className="min-w-[220px] max-w-[220px] flex-shrink-0 bg-white border border-[#ffe5b8] rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <RelatedProductCard product={prod} />
              </div>
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
