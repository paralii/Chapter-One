import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../redux/alertSlice";
import AdminSidebar from "../../components/Admin/AdminSideBar.jsx";
import PageHeader from "../../components/Admin/AdminPageHeader.jsx";
import BookLoader from "../../components/common/BookLoader";
import { getReferralOffers, updateOffer, toggleReferralOffer } from "../../api/admin/offerAPI.js";

function ReferralManagement() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {});
      navigate("/admin/login");
      dispatch(showAlert({ message: "Logged out successfully.", type: "success" }));
    } catch (err) {
      dispatch(showAlert({ message: "Logout failed.", type: "error" }));
    }
  };

  const renderView = () => {
    if (activeView === "dashboard") {
      return (
        <ReferralDashboard
          onEdit={(id) => {
            if (/^[0-9a-fA-F]{24}$/.test(id)) {
              setSelectedOfferId(id);
              setActiveView("edit");
            } else {
              dispatch(showAlert({ message: "Invalid offer ID selected.", type: "error" }));
            }
          }}
          onToggle={(id) => {
            if (/^[0-9a-fA-F]{24}$/.test(id)) {
              setSelectedOfferId(id);
              setActiveView("toggle");
            } else {
              dispatch(showAlert({ message: "Invalid offer ID selected.", type: "error" }));
            }
          }}
          onLogout={handleLogout}
        />
      );
    } else if (activeView === "edit") {
      return (
        <ReferralEdit
          offerId={selectedOfferId}
          onCancel={() => {
            setSelectedOfferId(null);
            setActiveView("dashboard");
          }}
          onLogout={handleLogout}
        />
      );
    } else if (activeView === "toggle") {
      return (
        <ReferralToggle
          offerId={selectedOfferId}
          onCancel={() => {
            setSelectedOfferId(null);
            setActiveView("dashboard");
          }}
          onLogout={handleLogout}
        />
      );
    }
  };

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      {renderView()}
    </div>
  );
}

function ReferralDashboard({ onEdit, onToggle, onLogout }) {
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const dispatch = useDispatch();

  const fetchReferrals = async () => {
    try {
      const response = await getReferralOffers({ search, page, limit });
      setOffers(response.data.offers || []);
      setTotal(response.data.total || 0);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || "Error fetching referral offers";
      setError(message);
      dispatch(showAlert({ message, type: "error" }));
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [search, page, dispatch]);

  const handleClear = () => {
    setSearch("");
    setPage(1);
    fetchReferrals();
  };

  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader
        title="Referral Code"
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        handleClear={handleClear}
        handleLogout={onLogout}
      />
      {error && <div className="text-red-500 text-center p-4">Error: {error}</div>}
      <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto mb-8">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#eee9dc] border-b border-white text-[#484848] text-sm font-medium text-left">
              <th className="p-2">S.No</th>
              <th className="p-2">Referral Code</th>
              <th className="p-2">User</th>
              <th className="p-2">Email</th>
              <th className="p-2">Discount</th>
              <th className="p-2">Expiry Date</th>
              {/* <th className="p-2">Status</th> */}
              {/* <th className="p-2">Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {offers.length > 0 ? (
              offers.map((offer, index) => (
                <tr key={offer._id} className="bg-[#eee9dc] border-b border-white">
                  <td className="p-2 text-sm font-medium">{index + 1 + (page - 1) * limit}</td>
                  <td className="p-2 text-sm font-medium">{offer.referral_code || "N/A"}</td>
                  <td className="p-2 text-sm font-medium">{offer.user_id?.firstname  || "N/A"}</td>
                  <td className="p-2 text-sm font-medium">{offer.user_id?.email || "N/A"}</td>
                  <td className="p-2 text-sm font-medium">
                    {offer.discount_value} {offer.discount_type === "PERCENTAGE" ? "%" : "₹"}
                  </td>
                  <td className="p-2 text-sm font-medium">
                    {offer.end_date ? new Date(offer.end_date).toLocaleDateString() : "N/A"}
                  </td>
                  {/* <td className="p-2 text-sm font-medium">
                    {offer.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive: {offer.block_message || "N/A"}</span>
                    )}
                  </td> */}
                  {/* <td className="p-2 flex items-center gap-2">
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
                      onClick={() => onToggle(offer._id)}
                    >
                      {offer.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td> */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-2 text-sm font-medium text-center">
                  No referral offers found.
                </td>
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

function ReferralEdit({ offerId, onCancel, onLogout }) {
  const [form, setForm] = useState({
    referral_code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    end_date: "",
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (offerId && /^[0-9a-fA-F]{24}$/.test(offerId)) {
      setIsLoading(true);
      getReferralOffers({ offerId })
        .then((res) => {
          const offer = res.data.offers?.[0];
          if (offer) {
            setForm({
              referral_code: offer.referral_code || "",
              discount_type: offer.discount_type || "PERCENTAGE",
              discount_value: offer.discount_value?.toString() || "",
              end_date: offer.end_date ? new Date(offer.end_date).toISOString().split("T")[0] : "",
              is_active: offer.is_active,
            });
            setError(null);
          } else {
            throw new Error("Referral offer not found");
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message || "Failed to load referral offer";
          setError(message);
          dispatch(showAlert({ message, type: "error" }));
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("Invalid offer ID");
      dispatch(showAlert({ message: "Invalid offer ID", type: "error" }));
    }
  }, [offerId, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!form.referral_code || !/^[A-Z0-9-]+$/.test(form.referral_code))
      errors.referral_code = "Valid referral code is required (e.g., REF-USER-1234)";
    const discount = parseFloat(form.discount_value);
    if (!form.discount_value || isNaN(discount) || discount <= 0)
      errors.discount_value = "Valid discount value is required";
    if (!form.end_date) errors.end_date = "End date is required";
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
      await updateOffer(offerId, {
        ...form,
        discount_value: parseFloat(form.discount_value),
        type: "REFERRAL",
      });
      dispatch(showAlert({ message: "Referral offer updated successfully.", type: "success" }));
      onCancel();
    } catch (err) {
      const message = err.response?.data?.message || "Error updating referral offer";
      setError(message);
      dispatch(showAlert({ message, type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <BookLoader />;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="flex-1 p-10">
      <PageHeader title="Edit Referral Offer" />
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 min-h-screen">
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Referral Code</label>
          <input
            type="text"
            value={form.referral_code}
            onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.referral_code ? "border-red-500" : "border-[#f5deb3]"
            }`}
            placeholder="e.g., REF-USER-1234"
          />
          {formErrors.referral_code && <p className="text-red-500 text-xs mt-1">{formErrors.referral_code}</p>}
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
          <label className="block font-semibold text-[#484848]">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className={`w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] ${
              formErrors.end_date ? "border-red-500" : "border-[#f5deb3]"
            }`}
            min={new Date().toISOString().split("T")[0]}
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
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
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

function ReferralToggle({ offerId, onCancel, onLogout }) {
  const [form, setForm] = useState({ is_active: true, block_message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (offerId && /^[0-9a-fA-F]{24}$/.test(offerId)) {
      setIsLoading(true);
      getReferralOffers({ offerId })
        .then((res) => {
          const offer = res.data.offers?.[0];
          if (offer) {
            setForm({
              is_active: offer.is_active,
              block_message: offer.block_message || "",
            });
            setError(null);
          } else {
            throw new Error("Referral offer not found");
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message || "Failed to load referral offer";
          setError(message);
          dispatch(showAlert({ message, type: "error" }));
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("Invalid offer ID");
      dispatch(showAlert({ message: "Invalid offer ID", type: "error" }));
    }
  }, [offerId, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await toggleReferralOffer(offerId, form);
      dispatch(showAlert({ message: `Referral offer ${form.is_active ? "activated" : "deactivated"} successfully.`, type: "success" }));
      onCancel();
    } catch (err) {
      const message = err.response?.data?.message || "Error toggling referral offer";
      setError(message);
      dispatch(showAlert({ message, type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <BookLoader />;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="flex-1 p-10">
      <PageHeader title="Toggle Referral Offer" />
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 min-h-screen">
        <div className="mb-4">
          <label className="block font-semibold text-[#484848]">Active</label>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-5 w-5 accent-[#654321]"
          />
        </div>
        {!form.is_active && (
          <div className="mb-4">
            <label className="block font-semibold text-[#484848]">Block Message</label>
            <input
              type="text"
              value={form.block_message}
              onChange={(e) => setForm({ ...form, block_message: e.target.value })}
              className="w-full p-2 border rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321] border-[#f5deb3]"
              placeholder="Reason for deactivating referral"
            />
          </div>
        )}
        <div className="flex gap-4 justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-[#654321] text-white rounded-[5px] text-sm font-medium hover:bg-[#543210] ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
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

export default ReferralManagement;