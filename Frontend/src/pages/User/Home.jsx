import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { HomeProductCard } from "../../components/User/ProductCard";
import { getProducts } from "../../api/user/productAPI";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import Login from "../User/Authentication/Login";
import Signup from "../User/Authentication/Signup";
import ForgotPassword from "../User/Authentication/ForgotPassword";
import Pagination from "../../components/common/Pagination";
import OTPVerification from "../../pages/User/Authentication/OTPVerification";
import ResetPassword from "../../pages/User/Authentication/ResetPassword";
import BookLoader from "../../components/common/BookLoader";
import FallbackMessage from "../../components/common/FallbackMessage";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const closeModal = () => navigate("/");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const search = "";
  const sort = "desc";
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchBooks = async () => {
      try {
        let response;

        response = await getProducts({ search, sort, page, limit });

        const productList = Array.isArray(response.data)
          ? response.data
          : response.data.products;

        const total = response.data.total || productList.length;
        setProducts(productList);
        setTotalPages(Math.ceil(total / limit));
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Something went wrong while fetching books. Please try again.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [page]);

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150x200?text=No+Image";
    if (url.startsWith("http")) return url;
    const uploadsIndex = url.indexOf("/uploads");
    return uploadsIndex !== -1
      ? `${import.meta.env.VITE_API_BASE_URL}${url.substring(uploadsIndex)}`
      : `${import.meta.env.VITE_API_BASE_URL}${url}`;
  };

  return (
    <>
      <div className="min-h-screen bg-[#fff8e5]">
        <Navbar />

        <main className="py-12 px-5 md:px-[117px] flex flex-col gap-12">
          {/* Hero Section */}
          <div className="relative w-full rounded-xl bg-[#ffe8b3] p-6 md:p-12 text-center">
            <h1 className="text-[26px] md:text-[36px] font-bold text-[#3c2712] mb-4">
              Discover Your Next Favorite Book
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#3c2712] mb-6">
              Explore thousands of books across all genres.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-[#3c2712] text-white px-6 py-2 rounded-full text-sm md:text-base cursor-pointer"
            >
              Shop Now
            </button>
          </div>

          {/* Best Sellers Section */}
          <section className="best-sellers-section mb-12">
            <div className="section-title font-[Inter] text-[24px] md:text-[30px] font-bold text-[#3c2712] uppercase text-center mb-5 border-b border-[rgba(60,39,18,0.5)] pb-4">
              Best Sellers
            </div>

            {loading ? (
              <BookLoader fullPage />
            ) : error ? (
              <FallbackMessage type="error" message={error} />
            ) : products.length === 0 ? (
              <FallbackMessage message="No books found in this category." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {products.map((product) => (
                  <HomeProductCard
                    key={product._id}
                    product={product}
                    getImageUrl={getImageUrl}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <div className="flex justify-center ">
          <button
            onClick={() => navigate("/products")}
            className="bg-[#3c2712] hover:bg-[#2a1b0c] text-white px-6 py-2 rounded-full text-sm md:text-base cursor-pointer transition-all"
          >
            View All Products
          </button>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          visiblePages={5}
        />
        <Footer />
      </div>

      {/* Modals */}
      {location.pathname === "/login" && <Login onClose={closeModal} />}
      {location.pathname === "/signup" && <Signup onClose={closeModal} />}
      {location.pathname === "/verify-otp" && (
        <OTPVerification onClose={closeModal} />
      )}
      {location.pathname === "/reset-password" && (
        <ResetPassword onClose={closeModal} />
      )}
      {location.pathname === "/forgot-password" && (
        <ForgotPassword onClose={closeModal} />
      )}
    </>
  );
}

export default Home;
