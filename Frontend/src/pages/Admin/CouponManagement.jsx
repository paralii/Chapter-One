import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../redux/alertSlice";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import BookLoader from "../../components/common/BookLoader";
import { getAllCoupons, createCoupon, deleteCoupon, getCouponById, updateCoupon } from "../../api/admin/couponAPI";
import showConfirmDialog from "../../components/common/ConformationModal";

function CouponManagement() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await getAllCoupons({ includeInactive: true });
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      dispatch(showAlert({ message: error.response?.data?.message || "Failed to fetch coupons.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const refreshCoupons = async () => {
    await fetchCoupons();
  };

  const renderView = () => {
    if (activeView === "dashboard") {
      return (
        <CouponsDashboard
          coupons={coupons}
          loading={loading}
          onAdd={() => setActiveView("add")}
          onEdit={(couponId) => {
            setSelectedCouponId(couponId);
            setActiveView("edit");
          }}
          onDelete={async (couponId) => {
            showConfirmDialog({
              message: "Are you sure you want to deactivate this coupon? If this action need to be undone do it in edit.",
              confirmButtonText: "Deactivate",
              cancelButtonText: "Cancel",
              onConfirm: async () => {
                try {
                  await deleteCoupon(couponId);
                  dispatch(showAlert({ 
                    message: `Coupon deactivated successfully`, 
                    type: "success" 
                  }));
                  await refreshCoupons();
                } catch (error) {
                  console.error("Error deactivating coupon:", error);
                  dispatch(showAlert({ 
                    message: error.response?.data?.message || "Failed to deactivate coupon.", 
                    type: "error" 
                  }));
                }
              },
            });
          }}
          onLogout={() => navigate("/login")}
        />
      );
    } else if (activeView === "edit") {
      return (
        <CouponEdit
          couponId={selectedCouponId}
          onCancel={() => setActiveView("dashboard")}
          onSave={async (isActive) => {
            await refreshCoupons();
            dispatch(showAlert({ message: `Coupon ${isActive ? "activated" : "deactivated"} successfully.`, type: "success" }));
            setActiveView("dashboard");
          }}
          onLogout={() => navigate("/login")}
        />
      );
    } else if (activeView === "add") {
      return (
        <CouponAdd
          onCancel={() => setActiveView("dashboard")}
          onAddSuccess={async () => {
            await refreshCoupons();
            dispatch(showAlert({ message: "Coupon created successfully.", type: "success" }));
            setActiveView("dashboard");
          }}
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

function CouponsDashboard({ coupons, loading, onAdd, onEdit, onDelete, onLogout }) {
  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader title="Coupons" handleLogout={onLogout} />
      <button
        onClick={onAdd}
        className="bg-green-500 text-white px-6 py-2 rounded-md mb-4 hover:bg-green-600"
      >
        + Add New Coupon
      </button>
      {loading ? (
        <BookLoader />
      ) : coupons.length === 0 ? (
        <div className="bg-[#eee9dc] rounded-[15px] p-6 text-center text-[#484848]">
          <p className="text-lg">No coupons found.</p>
          <button
            onClick={onAdd}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Add Your First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
                <th className="p-[10px]">Coupon Code</th>
                <th className="p-[10px]">Discount (%)</th>
                <th className="p-[10px]">Min Order</th>
                <th className="p-[10px]">Max Discount</th>
                <th className="p-[10px]">Expiry Date</th>
                <th className="p-[10px]">Usage</th>
                <th className="p-[10px]">Status</th>
                <th className="p-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="bg-[#eee9dc] border-b border-b-white">
                  <td className="p-[10px]">{coupon.code}</td>
                  <td className="p-[10px]">{coupon.discountPercentage}%</td>
                  <td className="p-[10px]">
                    {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "-"}
                  </td>
                  <td className="p-[10px]">
                    {coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : "-"}
                  </td>
                  <td className="p-[10px]">
                    {coupon.expirationDate
                      ? new Date(coupon.expirationDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-[10px]">
                    {coupon.usedCount}/{coupon.usageLimit}
                  </td>
                  <td className="p-[10px]">
                    {coupon.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="p-[10px] flex gap-2">
                    <button
                      className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4"
                      onClick={() => onEdit(coupon._id)}
                    >
                      ✎ Edit
                    </button>
                    {coupon.isActive && (
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        onClick={() => onDelete(coupon._id)}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CouponEdit({ couponId, onCancel, onSave, onLogout }) {
  const [coupon, setCoupon] = useState(null);
  const [originalCoupon, setOriginalCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCoupon = async () => {
      setLoading(true);
      try {
        const response = await getCouponById(couponId);
        const fetchedCoupon = {
          ...response.data.coupon,
          expirationDate: response.data.coupon.expirationDate
            ? new Date(response.data.coupon.expirationDate).toISOString().split("T")[0]
            : "",
          minOrderValue: response.data.coupon.minOrderValue || "",
          maxDiscountAmount: response.data.coupon.maxDiscountAmount || "",
        };
        setCoupon(fetchedCoupon);
        setOriginalCoupon(fetchedCoupon);
      } catch (error) {
        console.error("Error fetching coupon:", error);
        dispatch(showAlert({ message: error.response?.data?.message || "Failed to load coupon data.", type: "error" }));
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    if (couponId) fetchCoupon();
  }, [couponId, onCancel, dispatch]);

  const hasChanges = () => {
    if (!coupon || !originalCoupon) return false;
    return (
      coupon.code.trim() !== originalCoupon.code ||
      parseFloat(coupon.discountPercentage) !== originalCoupon.discountPercentage ||
      parseInt(coupon.usageLimit) !== originalCoupon.usageLimit ||
      coupon.expirationDate !== originalCoupon.expirationDate ||
      parseFloat(coupon.minOrderValue || 0) !== (originalCoupon.minOrderValue || 0) ||
      parseFloat(coupon.maxDiscountAmount || 0) !== (originalCoupon.maxDiscountAmount || 0) ||
      coupon.isActive !== originalCoupon.isActive
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges()) {
      dispatch(showAlert({ message: "No changes made to the coupon.", type: "warning" }));
      setLoading(false);
      return;
    }

    setLoading(true);

    if (!coupon.code.trim()) {
      dispatch(showAlert({ message: "Coupon code is required.", type: "error" }));
      setLoading(false);
      return;
    }
    const discount = parseFloat(coupon.discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      dispatch(showAlert({ message: "Discount percentage must be between 0 and 100.", type: "error" }));
      setLoading(false);
      return;
    }
    const usageLimit = parseInt(coupon.usageLimit);
    if (isNaN(usageLimit) || usageLimit < 1) {
      dispatch(showAlert({ message: "Usage limit must be a positive integer.", type: "error" }));
      setLoading(false);
      return;
    }
    if (coupon.expirationDate && isNaN(new Date(coupon.expirationDate).getTime())) {
      dispatch(showAlert({ message: "Invalid expiration date.", type: "error" }));
      setLoading(false);
      return;
    }
    const minOrderValue = coupon.minOrderValue ? parseFloat(coupon.minOrderValue) : 0;
    if (isNaN(minOrderValue) || minOrderValue < 0) {
      dispatch(showAlert({ message: "Minimum order value must be a non-negative number.", type: "error" }));
      setLoading(false);
      return;
    }
    const maxDiscountAmount = coupon.maxDiscountAmount
      ? parseFloat(coupon.maxDiscountAmount)
      : null;
    if (maxDiscountAmount !== null && (isNaN(maxDiscountAmount) || maxDiscountAmount < 0)) {
      dispatch(showAlert({ message: "Maximum discount amount must be a non-negative number.", type: "error" }));
      setLoading(false);
      return;
    }

    const updateData = {};
    if (coupon.code.trim() !== originalCoupon.code) updateData.code = coupon.code.trim();
    if (discount !== originalCoupon.discountPercentage) updateData.discountPercentage = discount;
    if (usageLimit !== originalCoupon.usageLimit) updateData.usageLimit = usageLimit;
    if (coupon.expirationDate !== originalCoupon.expirationDate) updateData.expirationDate = coupon.expirationDate || undefined;
    if (minOrderValue !== (originalCoupon.minOrderValue || 0)) updateData.minOrderValue = minOrderValue;
    if (maxDiscountAmount !== (originalCoupon.maxDiscountAmount || 0)) updateData.maxDiscountAmount = maxDiscountAmount;
    if (coupon.isActive !== originalCoupon.isActive) updateData.isActive = coupon.isActive;

    try {
      console.log("Sending update data:", updateData); // Debug log
      const response = await updateCoupon(couponId, updateData);
      console.log("Update response:", response.data); // Debug log
      await onSave(coupon.isActive);
    } catch (error) {
      console.error("Error updating coupon:", error);
      dispatch(showAlert({ message: error.response?.data?.message || "Failed to update coupon.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  if (loading || !coupon) return <BookLoader />;

  return (
    <div className="flex-1 p-10">
      <PageHeader title="Edit Coupon" handleLogout={onLogout} />
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 min-h-screen">
        <div className="mb-4">
          <label className="block font-semibold">Coupon Code</label>
          <input
            type="text"
            value={coupon.code}
            onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
            className="w-full p-2 border rounded-lg"
            required
            placeholder="e.g., SAVE10"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Discount (%)</label>
          <input
            type="number"
            value={coupon.discountPercentage}
            onChange={(e) => setCoupon({ ...coupon, discountPercentage: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="0"
            max="100"
            step="0.01"
            required
            placeholder="e.g., 10"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Minimum Order Value (₹)</label>
          <input
            type="number"
            value={coupon.minOrderValue}
            onChange={(e) => setCoupon({ ...coupon, minOrderValue: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="0"
            step="0.01"
            placeholder="e.g., 500"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Max Discount Amount (₹)</label>
          <input
            type="number"
            value={coupon.maxDiscountAmount}
            onChange={(e) => setCoupon({ ...coupon, maxDiscountAmount: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="0"
            step="0.01"
            placeholder="e.g., 100"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Expiry Date</label>
          <input
            type="date"
            value={coupon.expirationDate}
            onChange={(e) => setCoupon({ ...coupon, expirationDate: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min={new Date().toISOString().split("T")[0]}
            placeholder="Select date"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Usage Limit</label>
          <input
            type="number"
            value={coupon.usageLimit}
            onChange={(e) => setCoupon({ ...coupon, usageLimit: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="1"
            step="1"
            required
            placeholder="e.g., 100"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Active</label>
          <input
            type="checkbox"
            checked={coupon.isActive}
            onChange={(e) => setCoupon({ ...coupon, isActive: e.target.checked })}
            className="accent-yellow-500"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !hasChanges()}
            className={`bg-[#f5deb3] text-black px-4 py-2 rounded-[10px] hover:bg-[#e5c49b] ${
              loading || !hasChanges() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function CouponAdd({ onCancel, onAddSuccess }) {
  const [coupon, setCoupon] = useState({
    code: "",
    discountPercentage: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    expirationDate: "",
    usageLimit: 1,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!coupon.code.trim()) {
      dispatch(showAlert({ message: "Coupon code is required.", type: "error" }));
      setLoading(false);
      return;
    }
    const discount = parseFloat(coupon.discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      dispatch(showAlert({ message: "Discount percentage must be between 0 and 100.", type: "error" }));
      setLoading(false);
      return;
    }
    const usageLimit = parseInt(coupon.usageLimit);
    if (isNaN(usageLimit) || usageLimit < 1) {
      dispatch(showAlert({ message: "Usage limit must be a positive integer.", type: "error" }));
      setLoading(false);
      return;
    }
    if (coupon.expirationDate && isNaN(new Date(coupon.expirationDate).getTime())) {
      dispatch(showAlert({ message: "Invalid expiration date.", type: "error" }));
      setLoading(false);
      return;
    }
    const minOrderValue = coupon.minOrderValue ? parseFloat(coupon.minOrderValue) : 0;
    if (isNaN(minOrderValue) || minOrderValue < 0) {
      dispatch(showAlert({ message: "Minimum order value must be a non-negative number.", type: "error" }));
      setLoading(false);
      return;
    }
    const maxDiscountAmount = coupon.maxDiscountAmount
      ? parseFloat(coupon.maxDiscountAmount)
      : null;
    if (maxDiscountAmount !== null && (isNaN(maxDiscountAmount) || maxDiscountAmount < 0)) {
      dispatch(showAlert({ message: "Maximum discount amount must be a non-negative number.", type: "error" }));
      setLoading(false);
      return;
    }

    try {
      await createCoupon({
        code: coupon.code.trim(),
        discountPercentage: discount,
        expirationDate: coupon.expirationDate || undefined,
        usageLimit,
        minOrderValue,
        maxDiscountAmount,
        isActive: coupon.isActive,
      });
      await onAddSuccess();
    } catch (error) {
      console.error("Error adding coupon:", error);
      dispatch(showAlert({ message: error.response?.data?.message || "Failed to create coupon.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-10">
      <PageHeader title="Coupon" />
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 min-h-screen">
        <div className="mb-4">
          <label className="block font-semibold">Coupon Code</label>
          <input
            type="text"
            value={coupon.code}
            onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
            className="w-full p-2 border rounded-lg"
            required
            placeholder="e.g., SAVE10"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Discount (%)</label>
          <input
            type="number"
            value={coupon.discountPercentage}
            onChange={(e) => setCoupon({ ...coupon, discountPercentage: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="0"
            max="100"
            step="0.01"
            required
            placeholder="e.g., 10"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Minimum Order Value (₹)</label>
          <input
            type="number"
            value={coupon.minOrderValue}
            onChange={(e) => setCoupon({ ...coupon, minOrderValue: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="0"
            step="0.01"
            placeholder="e.g., 500"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Max Discount Amount (₹)</label>
          <input
            type="number"
            value={coupon.maxDiscountAmount}
            onChange={(e) => setCoupon({ ...coupon, maxDiscountAmount: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="0"
            step="0.01"
            placeholder="e.g., 100"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Expiry Date</label>
          <input
            type="date"
            value={coupon.expirationDate}
            onChange={(e) => setCoupon({ ...coupon, expirationDate: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min={new Date().toISOString().split("T")[0]}
            placeholder="Select date"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Usage Limit</label>
          <input
            type="number"
            value={coupon.usageLimit}
            onChange={(e) => setCoupon({ ...coupon, usageLimit: e.target.value })}
            className="w-full p-2 border rounded-lg"
            min="1"
            step="1"
            required
            placeholder="e.g., 100"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Active</label>
          <input
            type="checkbox"
            checked={coupon.isActive}
            onChange={(e) => setCoupon({ ...coupon, isActive: e.target.checked })}
            className="accent-yellow-500"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`bg-[#f5deb3] text-black px-4 py-2 rounded-[10px] hover:bg-[#e5c49b] ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Adding..." : "Add Coupon"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CouponManagement;