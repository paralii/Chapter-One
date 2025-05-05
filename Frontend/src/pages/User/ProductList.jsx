import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Pagination from "../../components/common/Pagination";
import { ListProductCard } from "../../components/User/ProductCard";
import { getProducts } from "../../api/user/productAPI";
import { getCategories } from "../../api/admin/categoryAPI";
import { useSearch } from "../../context/SearchContext";
import useDebounce from "../../hooks/useDebounce";

const ProductList = () => {
  const { search, setSearch } = useSearch();
  const debouncedSearch = useDebounce(search, 500);
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  // Read from URL
  const getFilterParams = () => ({
    sort: searchParams.get("sort") || "new_arrivals",
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    page: Number(searchParams.get("page")) || 1,
    limit: 16,
    search: searchParams.get("search") || "",
  });

  const [filters, setFilters] = useState(getFilterParams);

  // Sync URL when filters change
  const updateSearchParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  // Trigger filter sync to URL when debounced search changes
  useEffect(() => {
    setFilters((prev) => {
      const updated = { ...prev, search: debouncedSearch, page: 1 };
      updateSearchParams(updated);
      return updated;
    });
  }, [debouncedSearch]);

  // Update filters when URL changes
  useEffect(() => {
    setFilters(getFilterParams());
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await getProducts(filters);
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value, page: 1 };
    updateSearchParams(updated);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      sort: "new_arrivals",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      page: 1,
      limit: 16,
      search: "",
    };
    updateSearchParams(defaultFilters);
    setSearch(""); // Clear search bar
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="bg-[#fff8e5] min-h-screen w-full">
      <header className="bg-[#fff8e5] py-5 px-[118px] md:px-5">
        <Navbar />
      </header>

      <h2 className="text-[#3c2712] font-Inter text-3xl font-bold uppercase text-center mb-4 pb-5 border-b">
        Products
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-5 px-4 py-3 rounded-lg bg-[#fdfaf6] shadow-md border border-[#e2d6c2] max-w-[1200px] mx-auto mb-6 font-[Inter]">
  {/* Sort */}
  <select
    name="sort"
    className="h-10 border border-[#d6c4ad] rounded-lg px-4 text-[15px] text-[#3c2712] bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-[#3c2712] w-full sm:w-auto"
    value={filters.sort}
    onChange={handleFilterChange}
  >
    <option value="new_arrivals">New Arrivals</option>
    <option value="price_low_high">Price: Low to High</option>
    <option value="price_high_low">Price: High to Low</option>
    <option value="a-z">A-Z</option>
    <option value="z-a">Z-A</option>
  </select>

  {/* Category */}
  <select
    name="category"
    className="h-10 border border-[#d6c4ad] rounded-lg px-4 text-[15px] text-[#3c2712] bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-[#3c2712] w-full sm:w-auto"
    value={filters.category}
    onChange={handleFilterChange}
  >
    <option value="">All Categories</option>
    {categories.map((cat) => (
      <option key={cat._id} value={cat._id}>
        {cat.name}
      </option>
    ))}
  </select>

  {/* Price Range */}
  <div className="flex items-center gap-2">
    <input
      type="number"
      name="minPrice"
      placeholder="Min ₹"
      className="w-[80px] h-10 border border-[#d6c4ad] rounded-lg px-3 text-[15px] text-[#3c2712] bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-[#3c2712]"
      value={filters.minPrice}
      onChange={handleFilterChange}
    />
    <span className="text-[#7e6750]">-</span>
    <input
      type="number"
      name="maxPrice"
      placeholder="Max ₹"
      className="w-[80px] h-10 border border-[#d6c4ad] rounded-lg px-3 text-[15px] text-[#3c2712] bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-[#3c2712]"
      value={filters.maxPrice}
      onChange={handleFilterChange}
    />
  </div>

  {/* Clear Button */}
  <button
    className="h-10 px-4 bg-[#3c2712] text-white text-[15px] rounded-lg shadow hover:bg-[#5a3a1a] transition duration-200"
    onClick={handleClearFilters}
  >
    Clear Filters
  </button>
</div>


      {/* Loading/Error */}
      {loading && <div className="text-center my-5 text-sm">Loading products...</div>}
      {error && <div className="text-center text-red-500 my-5">{error}</div>}

      {/* Products */}
      {/* Products */}
{!loading && !error && products.length === 0 ? (
  <div className="text-center text-[#3c2712] text-lg font-medium mt-10 mb-16">
    No products found matching your criteria.
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-5 max-w-[1300px] mx-auto mb-10">
    {products.map(
      (product) =>
        !product.isDeleted && <ListProductCard key={product._id} product={product} />
    )}
  </div>
)}


      {/* Pagination */}
      <div className="mb-10">
        <Pagination
          page={filters.page}
          setPage={(newPage) =>
            updateSearchParams({ ...filters, page: newPage })
          }
          totalPages={totalPages}
          visiblePages={3}
        />
      </div>

      <Footer />
    </div>
  );
};

export default ProductList;
 