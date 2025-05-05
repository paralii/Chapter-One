"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import adminAxios from "../../api/adminAxios";

function CouponManagement() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);

  // Fetch coupons from backend
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await adminAxios.get("/coupons"); 
        setCoupons(response.data.coupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      }
    };
    fetchCoupons();
  }, []);

  const renderView = () => {
    if (activeView === "dashboard") {
      return (
        <CouponsDashboard
          coupons={coupons}
          onAdd={() => setActiveView("add")}
          onEdit={(couponId) => {
            setSelectedCouponId(couponId);
            setActiveView("edit");
          }}
          onLogout={() => navigate("/login")}
        />
      );
    } else if (activeView === "edit") {
      return (
        <CouponEdit
          couponId={selectedCouponId}
          onCancel={() => setActiveView("dashboard")}
          onLogout={() => navigate("/login")}
        />
      );
    } else if (activeView === "add") {
      return (
        <CouponAdd
          onCancel={() => setActiveView("dashboard")}
          onAddSuccess={() => {
            setActiveView("dashboard"); // Redirect back to dashboard on success
            // You can also re-fetch coupons here if you want to update the list immediately
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

// CouponsDashboard View with Dummy Data
function CouponsDashboard({ coupons,onAdd, onEdit, onLogout }) {
  const handleDelete = async (id) => {
    try {
      await adminAxios.delete(`/coupons/${id}/delete`);
      // Update state after deletion
      setCoupons(coupons.filter((coupon) => coupon._id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader title="Coupons" handleLogout={onLogout} />
      <button onClick={onAdd} className="bg-green-500 text-white px-6 py-2 rounded-md mb-4">
  + Add New Coupon
</button>

      <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
              <th className="p-[10px]">Coupon Code</th>
              <th className="p-[10px]">Discount (%)</th>
              <th className="p-[10px]">Expiry Date</th>
              <th className="p-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.map((coupon) => (
              <tr key={coupon._id} className="bg-[#eee9dc] border-b border-b-white">
                <td className="p-[10px]">{coupon.code}</td>
                <td className="p-[10px]">{coupon.discountPercentage}</td>
                <td className="p-[10px]">{coupon.expirationDate}</td>
                <td className="p-[10px] flex gap-2">
                  <button className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4" onClick={() => onEdit(coupon._id)}>
                    ✎ Edit
                  </button>
                  <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => handleDelete(coupon._id)}>
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
            {coupons?.length === 0 && (
              <tr>
                <td colSpan="4" className="p-[10px] text-center text-[#484848]">
                  No coupons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// CouponEdit View with Dummy Data
function CouponEdit({ couponId, onCancel }) {
  const [coupon, setCoupon] = useState(null);

  // Fetch coupon details for editing
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const response = await adminAxios.get(`/coupons/${couponId}`);
        setCoupon(response.data.coupon);
      } catch (error) {
        console.error("Error fetching coupon:", error);
      }
    };
    fetchCoupon();
  }, [couponId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAxios.put(`/coupons/${couponId}/update`, {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        expirationDate: coupon.expirationDate,
      });
      onCancel(); // Go back to the dashboard after submitting
    } catch (error) {
      console.error("Error updating coupon:", error);
    }
  };

  if (!coupon) return <div>Loading...</div>;

  return (
    <div className="flex-1 p-10">
      <h1 className="text-2xl font-semibold text-stone-600 mb-6">Edit Coupon</h1>
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6">
        <div className="mb-4">
          <label className="block font-semibold">Coupon Code</label>
          <input
            type="text"
            value={coupon.code}
            onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Discount (%)</label>
          <input
            type="number"
            value={coupon.discountPercentage}
            onChange={(e) => setCoupon({ ...coupon, discountPercentage: e.target.value })}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Expiry Date</label>
          <input
            type="date"
            value={coupon.expirationDate}
            onChange={(e) => setCoupon({ ...coupon, expirationDate: e.target.value })}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <button type="submit" className="bg-[#f5deb3] text-black px-4 py-2 rounded-[10px]">
          Save Changes
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-300 text-black px-4 py-2 rounded ml-4">
          Cancel
        </button>
      </form>
    </div>
  );
}

function CouponAdd({ onCancel, onAddSuccess }) {
  const [coupon, setCoupon] = useState({
    code: "",
    discountPercentage: "",
    expirationDate: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAxios.post("/coupons/create", coupon); // Post request to create a new coupon
      onAddSuccess(); // Go back to the dashboard on success
    } catch (error) {
      console.error("Error adding coupon:", error);
    }
  };

  return (
    <div className="flex-1 p-10">
      <h1 className="text-2xl font-semibold text-stone-600 mb-6">Add New Coupon</h1>
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6">
        <div className="mb-4">
          <label className="block font-semibold">Coupon Code</label>
          <input
            type="text"
            value={coupon.code}
            onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Discount (%)</label>
          <input
            type="number"
            value={coupon.discountPercentage}
            onChange={(e) => setCoupon({ ...coupon, discountPercentage: e.target.value })}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Expiry Date</label>
          <input
            type="date"
            value={coupon.expirationDate}
            onChange={(e) => setCoupon({ ...coupon, expirationDate: e.target.value })}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <button type="submit" className="bg-[#f5deb3] text-black px-4 py-2 rounded-[10px]">
          Add Coupon
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-300 text-black px-4 py-2 rounded ml-4">
          Cancel
        </button>
      </form>
    </div>
  );
}
export default CouponManagement;
