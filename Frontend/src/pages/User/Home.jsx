import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { HomeProductCard } from "../../components/User/ProductCard";
import Footer from "../../components/common/Footer";
import { getProducts } from "../../api/user/productAPI";
import { getCategories } from "../../api/admin/categoryAPI";
import Login from "../User/Authentication/Login";
import Signup from "../User/Authentication/Signup";
import ForgotPassword from "../User/Authentication/ForgotPassword";
import Pagination from "../../components/common/Pagination";
import OTPVerification from "../../pages/User/Authentication/OTPVerification";
import ResetPassword from "../../pages/User/Authentication/ResetPassword";
import FallbackMessage from "../../components/common/FallbackMessage";
import LoaderSpinner from "../../components/common/LoaderSpinner";
const API_BASE = "http://localhost:2211";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const closeModal = () => navigate("/");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1); 
  const [categories, setCategories] = useState(["All"]); 

  useEffect(() => {
    getCategories().then((res) => {
      const dynamicCategories = res.data.categories.map((cat) => cat.name);
      setCategories(["All", ...dynamicCategories]);
    });
  }, []);

  const search = "";
  const sort = "desc";
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    getProducts({ search, sort, page, limit })
      .then((response) => {
        const productList = Array.isArray(response.data)
          ? response.data
          : response.data.products;
        const total = response.data.total || 50; 
        setProducts(productList);
        setTotalPages(Math.ceil(total / limit)); 
        setLoading(false);
      })
      .catch((err) => {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Something went wrong while fetching books. Please try again.";
        setError(message);
        setLoading(false);
      });
  }, [page]);

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150x200?text=No+Image";
    if (url.startsWith("http")) return url;
    const uploadsIndex = url.indexOf("/uploads");
    return uploadsIndex !== -1
      ? `${API_BASE}${url.substring(uploadsIndex)}`
      : `${API_BASE}${url}`;
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  return (
    <>
      <div className="min-h-screen bg-[#fff8e5]">
        <Navbar />

        {/* Category Filter */}
        <div className="flex justify-center gap-6 mt-4 overflow-x-auto px-2 border-b border-gray-300">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setPage(1);
              }}
              className={`pb-2 text-sm md:text-base font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? "border-b-2 border-[#3c2712] text-[#3c2712]"
                  : "text-gray-500 hover:text-[#3c2712]  cursor-pointer"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

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
              {selectedCategory === "All"
                ? "Best Sellers"
                : `Category: ${selectedCategory}`}
            </div>

            {loading ? (
              <LoaderSpinner fullPage />
            ) : error ? (
              <FallbackMessage type="error" message={error} />
            ) : filteredProducts.length === 0 ? (
              <FallbackMessage message="No books found in this category." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {filteredProducts.map((product) => (
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
