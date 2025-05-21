"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import adminAxios from "../../api/adminAxios";
import PageHeader from "../../components/Admin/AdminPageHeader";


function ReferralManagement() {
  // activeView: "dashboard" for listing referrals or "edit" for editing a referral.
  const [activeView, setActiveView] = useState("dashboard");
  // When editing, store the referral ID (or the entire referral object) to update.
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {}, { withCredentials: true });
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

  const renderView = () => {
    if (activeView === "dashboard") {
      return (
        <ReferralDashboard
          onEdit={(id) => {
            setSelectedReferralId(id);
            setActiveView("edit");
          }}
          onLogout={handleLogout}
        />
      );
    } else if (activeView === "edit") {
      return (
        <ReferralEdit
          referralId={selectedReferralId}
          onCancel={() => setActiveView("dashboard")}
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

// ====================
// ReferralDashboard Component
// ====================
function ReferralDashboard({ onEdit, onLogout }) {
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchReferrals = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/referrals`, {
        params: { search, page, limit },
      });
      setReferrals(response.data.referrals);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching referrals");
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [search, page]);

  const handleClear = () => {
    setSearch("");
    setPage(1);
    fetchReferrals();
  };

  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader
        title="Referrals"
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        handleClear={handleClear}
        handleLogout={onLogout}
      />
      <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
              <th className="p-[10px]">Referral ID</th>
              <th className="p-[10px]">Referral Code</th>
              <th className="p-[10px]">Benefit (%)</th>
              <th className="p-[10px]">Expiry Date</th>
              <th className="p-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr key={referral._id} className="bg-[#eee9dc] border-b border-b-white">
                <td className="p-[10px]">{referral._id}</td>
                <td className="p-[10px]">{referral.code}</td>
                <td className="p-[10px]">{referral.benefit}</td>
                <td className="p-[10px]">{referral.expiryDate}</td>
                <td className="p-[10px]">
                  <button
                    className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px]"
                    onClick={() => onEdit(referral._id)}
                  >
                    ✎ Edit
                  </button>
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan="5" className="p-[10px] text-center">
                  No referrals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={() => setPage(page - 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded ${
            page <= 1 ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded ${
            page >= totalPages ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ====================
// ReferralEdit Component
// ====================
function ReferralEdit({ referralId, onCancel, onLogout }) {
  // Example fields for a referral offer.
  const [code, setCode] = useState("");
  const [benefit, setBenefit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/referrals/${referralId}`, {
          withCredentials: true,
        });
        const referral = response.data;
        setCode(referral.code);
        setBenefit(referral.benefit);
        setExpiryDate(referral.expiryDate);
      } catch (err) {
        setError(err.response?.data?.error || "Error fetching referral details");
      }
    };

    fetchReferral();
  }, [referralId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/admin/referrals/${referralId}`,
        { code, benefit, expiryDate },
        { withCredentials: true }
      );
      onCancel();
    } catch (err) {
      setError(err.response?.data?.error || "Error updating referral");
    }
  };

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {}, { withCredentials: true });
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex-1 p-10 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
        <h1 className="text-2xl font-semibold text-stone-600">Edit Referral</h1>
        <button
          className="px-9 py-3.5 text-base font-semibold bg-red-400 rounded-2xl border border-zinc-400 text-stone-950"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-stone-200 rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-1">Referral Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-1">Benefit (%)</label>
          <input
            type="number"
            value={benefit}
            onChange={(e) => setBenefit(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-1">Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        <button type="submit" className="w-full sm:w-[212px] py-3.5 text-2xl font-semibold text-white bg-lime-500 rounded-2xl border mx-auto">
          Update Referral
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full sm:w-[212px] py-3.5 text-2xl font-semibold text-black bg-gray-200 rounded-2xl border mx-auto"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default ReferralManagement;
