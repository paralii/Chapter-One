import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../redux/alertSlice";
import AdminSidebar from "../../components/Admin/AdminSideBar.jsx";
import PageHeader from "../../components/Admin/AdminPageHeader.jsx";
import BookLoader from "../../components/common/BookLoader";
import { getOffers, createOffer, updateOffer } from "../../api/admin/offerAPI.js";
import { getProducts } from "../../api/admin/productAPI.js";
import { getCategories } from "../../api/admin/categoryAPI.js";

function OfferManagement() {
  const [activeTab, setActiveTab] = useState("product");
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const renderView = () => {
    if (activeView === "dashboard") {
      return activeTab === "product" ? (
        <ProductOfferDashboard
          onEdit={(id) => {
            setSelectedOfferId(id);
            setActiveView("edit");
          }}
          onCreate={() => setActiveView("create")}
        />
      ) : (
        <CategoryOfferDashboard
          onEdit={(id) => {
            setSelectedOfferId(id);
            setActiveView("edit");
          }}
          onCreate={() => setActiveView("create")}
        />
      );
    } else if (activeView === "create" || activeView === "edit") {
      return activeTab === "product" ? (
        <ProductOfferForm
          offerId={selectedOfferId}
          onBack={() => {
            setSelectedOfferId(null);
            setActiveView("dashboard");
          }}
        />
      ) : (
        <CategoryOfferForm
          offerId={selectedOfferId}
          onBack={() => {
            setSelectedOfferId(null);
            setActiveView("dashboard");
          }}
        />
      );
    }
  };

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-5 sm:p-10">
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <button
            onClick={() => {
              setActiveTab("product");
              setActiveView("dashboard");
            }}
            className={`px-6 py-2 rounded ${activeTab === "product" ? "bg-[#654321] text-white" : "bg-gray-200 text-black"}`}
          >
            Product Offers
          </button>
          <button
            onClick={() => {
              setActiveTab("category");
              setActiveView("dashboard");
            }}
            className={`px-6 py-2 rounded ${activeTab === "category" ? "bg-[#654321] text-white" : "bg-gray-200 text-black"}`}
          >
            Category Offers
          </button>
        </div>
        {isLoading ? (
          <BookLoader />
        ) : (
          renderView()
        )}
      </div>
    </div>
  );
}

function ProductOfferDashboard({ onEdit, onCreate }) {
  const [offers, setOffers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setIsLoading(true);
    getOffers("PRODUCT", { page, limit })
      .then((res) => {
        setOffers(res.data.offers || []);
        setTotal(res.data.total || 0);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch offers");
        dispatch(showAlert({ message: err.response?.data?.message || "Failed to fetch offers.", type: "error" }));
      })
      .finally(() => setIsLoading(false));
  }, [page, dispatch]);

  const handleToggleActive = async (offerId, isActive) => {
    try {
      await updateOffer(offerId, { is_active: !isActive });
      setOffers(offers.map((offer) =>
        offer._id === offerId ? { ...offer, is_active: !isActive } : offer
      ));
      dispatch(showAlert({ message: `Offer ${isActive ? "deactivated" : "activated"} successfully.`, type: "success" }));
    } catch (err) {
      dispatch(showAlert({ message: err.response?.data?.message || "Error toggling offer.", type: "error" }));
    }
  };

  if (isLoading) return <BookLoader />;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Product Offers" />
      <button
        onClick={onCreate}
        className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-lg font-medium"
      >
        + Create New Offer
      </button>
      <div className="overflow-x-auto bg-[#eee9dc] rounded-[15px] mb-8">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#eee9dc] border-b border-white text-[#484848] text-sm font-medium text-left">
              <th className="p-2">S.No</th>
              <th className="p-2">Offer ID</th>
              <th className="p-2">Product</th>
              <th className="p-2">Discount</th>
              <th className="p-2">Expiry Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length > 0 ? (
              offers.map((offer, index) => (
                <tr key={offer._id} className="bg-[#eee9dc] border-b border-white">
                  <td className="p-2 text-sm font-medium">{index + 1 + (page - 1) * limit}</td>
                  <td className="p-2 text-sm font-medium">{offer._id}</td>
                  <td className="p-2 text-sm font-medium">{offer.product_id?.title || "N/A"}</td>
                  <td className="p-2 text-sm font-medium">
                    {offer.discount_value} {offer.discount_type === "PERCENTAGE" ? "%" : "₹"}
                  </td>
                  <td className="p-2 text-sm font-medium">{new Date(offer.end_date).toLocaleDateString()}</td>
                  <td className="p-2 text-sm font-medium">
                    {offer.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="p-2 flex items-center gap-2">
                    <button
                      className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded px-3 py-1 text-sm font-medium"
                      onClick={() => onEdit(offer._id)}
                    >
                      Edit
                    </button>
                    <button
                      className={`rounded px-3 py-1 text-sm font-medium cursor-pointer ${
                        offer.is_active
                          ? "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                          : "bg-[#654321] hover:bg-[#543210] text-white"
                      }`}
                      onClick={() => handleToggleActive(offer._id, offer.is_active)}
                    >
                      {offer.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-sm font-medium" colSpan="7">No offers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={() => setPage(page - 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
            page <= 1 ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(page + 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
            page >= totalPages ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CategoryOfferDashboard({ onEdit, onCreate }) {
  const [offers, setOffers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setIsLoading(true);
    getOffers("CATEGORY", { page, limit })
      .then((res) => {
        setOffers(res.data.offers || []);
        setTotal(res.data.total || 0);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch offers");
        dispatch(showAlert({ message: err.response?.data?.message || "Failed to fetch offers.", type: "error" }));
      })
      .finally(() => setIsLoading(false));
  }, [page, dispatch]);

  const handleToggleActive = async (offerId, isActive) => {
    try {
      await updateOffer(offerId, { is_active: !isActive });
      setOffers(offers.map((offer) =>
        offer._id === offerId ? { ...offer, is_active: !isActive } : offer
      ));
      dispatch(showAlert({ message: `Offer ${isActive ? "deactivated" : "activated"} successfully.`, type: "success" }));
    } catch (err) {
      dispatch(showAlert({ message: err.response?.data?.message || "Error toggling offer.", type: "error" }));
    }
  };

  if (isLoading) return <BookLoader />;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Category Offers" />
      <button
        onClick={onCreate}
        className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-lg font-medium"
      >
        + Create New Offer
      </button>
      <div className="overflow-x-auto bg-[#eee9dc] rounded-[15px] mb-8">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#eee9dc] border-b border-white text-[#484848] text-sm font-medium text-left">
              <th className="p-2">S.No</th>
              <th className="p-2">Offer ID</th>
              <th className="p-2">Category</th>
              <th className="p-2">Discount</th>
              <th className="p-2">Expiry Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length > 0 ? (
              offers.map((offer, index) => (
                <tr key={offer._id} className="bg-[#eee9dc] border-b border-white">
                  <td className="p-2 text-sm font-medium">{index + 1 + (page - 1) * limit}</td>
                  <td className="p-2 text-sm font-medium">{offer._id}</td>
                  <td className="p-2 text-sm font-medium">{offer.category_id?.name || "N/A"}</td>
                  <td className="p-2 text-sm font-medium">
                    {offer.discount_value} {offer.discount_type === "PERCENTAGE" ? "%" : "₹"}
                  </td>
                  <td className="p-2 text-sm font-medium">{new Date(offer.end_date).toLocaleDateString()}</td>
                  <td className="p-2 text-sm font-medium">
                    {offer.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="p-2 flex items-center gap-2">
                    <button
                      className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded px-3 py-1 text-sm font-medium"
                      onClick={() => onEdit(offer._id)}
                    >
                      Edit
                    </button>
                    <button
                      className={`rounded px-3 py-1 text-sm font-medium cursor-pointer ${
                        offer.is_active
                          ? "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                          : "bg-[#654321] hover:bg-[#543210] text-white"
                      }`}
                      onClick={() => handleToggleActive(offer._id, offer.is_active)}
                    >
                      {offer.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-sm font-medium" colSpan="7">No offers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={() => setPage(page - 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
            page <= 1 ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(page + 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
            page >= totalPages ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ProductOfferForm({ offerId, onBack }) {
  const [form, setForm] = useState({
    type: "PRODUCT",
    product_id: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getProducts().then((res) => setProducts(res.data.products || [])),
      offerId && getOffers("PRODUCT", { offerId }).then((res) =>
        setForm({
          ...res.data.offers[0],
          start_date: res.data.offers[0].start_date ? new Date(res.data.offers[0].start_date).toISOString().split("T")[0] : "",
          end_date: res.data.offers[0].end_date ? new Date(res.data.offers[0].end_date).toISOString().split("T")[0] : "",
          discount_value: res.data.offers[0].discount_value || "",
        })
      ),
    ])
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load data");
        dispatch(showAlert({ message: err.response?.data?.message || "Failed to load data.", type: "error" }));
      })
      .finally(() => setIsLoading(false));
  }, [offerId, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!form.product_id) errors.product_id = "Product is required";
    const discount = parseFloat(form.discount_value);
    if (!form.discount_value || isNaN(discount) || discount <= 0)
      errors.discount_value = "Valid discount value is required";
    if (!form.start_date) errors.start_date = "Start date is required";
    if (!form.end_date) errors.end_date = "End date is required";
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      errors.end_date = "End date must be after start date";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const action = offerId ? updateOffer(offerId, { ...form, discount_value: parseFloat(form.discount_value) }) : createOffer({ ...form, discount_value: parseFloat(form.discount_value) });
      await action;
      dispatch(showAlert({ message: `Offer ${offerId ? "updated" : "created"} successfully.`, type: "success" }));
      onBack();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving offer");
      dispatch(showAlert({ message: err.response?.data?.message || "Error saving offer.", type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <BookLoader />;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="flex-1 p-10">
      <PageHeader title={offerId ? "Edit Product Offer" : "Create Product Offer"} />
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 min-h-screen">
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Name</label>
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.product_id ? "border-red-500" : "border-[#f5deb3]"
            }`}
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>{product.title}</option>
            ))}
          </select>
          {formErrors.product_id && <p className="text-red-500 text-xs mt-1">{formErrors.product_id}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Discount Type</label>
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            className="w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] border-[#f5deb3]"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Discount Value</label>
          <input
            type="number"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.discount_value ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min="0"
            step="0.01"
            placeholder="e.g., 10"
          />
          {formErrors.discount_value && <p className="text-red-500 text-xs mt-1">{formErrors.discount_value}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.start_date ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min={new Date().toISOString().split("T")[0]}
          />
          {formErrors.start_date && <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.end_date ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min={form.start_date || new Date().toISOString().split("T")[0]}
          />
          {formErrors.end_date && <p className="text-red-500 text-xs mt-1">{formErrors.end_date}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Active</label>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-5 w-5 accent-[#654321]"
          />
        </div>
        <div className="flex gap-4 justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-[#654321] text-white rounded-[5px] text-sm font-medium hover:bg-[#543210] ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Saving..." : offerId ? "Save Changes" : "Create Offer"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-4 py-2 bg-[#f5deb3] text-[#654321] rounded-[5px] text-sm font-medium hover:bg-[#e5c49b]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoryOfferForm({ offerId, onBack }) {
  const [form, setForm] = useState({
    type: "CATEGORY",
    category_id: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getCategories().then((res) => setCategories(res.data.categories || [])),
      offerId && getOffers("CATEGORY", { offerId }).then((res) =>
        setForm({
          ...res.data.offers[0],
          start_date: res.data.offers[0].start_date ? new Date(res.data.offers[0].start_date).toISOString().split("T")[0] : "",
          end_date: res.data.offers[0].end_date ? new Date(res.data.offers[0].end_date).toISOString().split("T")[0] : "",
          discount_value: res.data.offers[0].discount_value || "",
        })
      ),
    ])
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load data");
        dispatch(showAlert({ message: err.response?.data?.message || "Failed to load data.", type: "error" }));
      })
      .finally(() => setIsLoading(false));
  }, [offerId, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!form.category_id) errors.category_id = "Category is required";
    const discount = parseFloat(form.discount_value);
    if (!form.discount_value || isNaN(discount) || discount <= 0)
      errors.discount_value = "Valid discount value is required";
    if (!form.start_date) errors.start_date = "Start date is required";
    if (!form.end_date) errors.end_date = "End date is required";
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      errors.end_date = "End date must be after start date";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const action = offerId ? updateOffer(offerId, { ...form, discount_value: parseFloat(form.discount_value) }) : createOffer({ ...form, discount_value: parseFloat(form.discount_value) });
      await action;
      dispatch(showAlert({ message: `Offer ${offerId ? "updated" : "created"} successfully.`, type: "success" }));
      onBack();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving offer");
      dispatch(showAlert({ message: err.response?.data?.message || "Error saving offer.", type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <BookLoader />;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="flex-1 p-10">
      <PageHeader title={offerId ? "Edit Category Offer" : "Create Category Offer"} />
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 min-h-screen">
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Name</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.category_id ? "border-red-500" : "border-[#f5deb3]"
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
          {formErrors.category_id && <p className="text-red-500 text-xs mt-1">{formErrors.category_id}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Discount Type</label>
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            className="w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] border-[#f5deb3]"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Discount Value</label>
          <input
            type="number"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.discount_value ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min="0"
            step="0.01"
            placeholder="e.g., 10"
          />
          {formErrors.discount_value && <p className="text-red-500 text-xs mt-1">{formErrors.discount_value}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.start_date ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min={new Date().toISOString().split("T")[0]}
          />
          {formErrors.start_date && <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.end_date ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min={form.start_date || new Date().toISOString().split("T")[0]}
          />
          {formErrors.end_date && <p className="text-red-500 text-xs mt-1">{formErrors.end_date}</p>}
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Active</label>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-5 w-5 accent-[#654321]"
          />
        </div>
        <div className="flex gap-4 justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-[#654321] text-white rounded-[5px] text-sm font-medium hover:bg-[#543210] ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Saving..." : offerId ? "Save Changes" : "Create Offer"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-4 py-2 bg-[#f5deb3] text-[#654321] rounded-[5px] text-sm font-medium hover:bg-[#e5c49b]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default OfferManagement;