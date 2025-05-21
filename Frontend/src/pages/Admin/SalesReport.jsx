"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import adminAxios from "../../api/adminAxios";


function SalesReport() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/sales-reports`, {
        params: { search, page, limit },
      });
      setReports(response.data.reports);
      setTotal(response.data.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching sales reports");
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search, page]);

  const handleClear = () => {
    setSearch("");
    setPage(1);
    fetchReports();
  };

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {}, { withCredentials: true });
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-5 sm:p-10">
        <PageHeader
          title="Sales Report"
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          handleClear={handleClear}
          handleLogout={handleLogout}
        />

        {error && <div className="text-red-500 mb-5">{error}</div>}

        <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
                <th className="p-[10px]">Report ID</th>
                <th className="p-[10px]">Date</th>
                <th className="p-[10px]">Total Sales</th>
                <th className="p-[10px]">Total Orders</th>
                <th className="p-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} className="bg-[#eee9dc] border-b border-b-white">
                  <td className="p-[10px]">{report._id}</td>
                  <td className="p-[10px]">{report.date}</td>
                  <td className="p-[10px]">{report.totalSales}</td>
                  <td className="p-[10px]">{report.totalOrders}</td>
                  <td className="p-[10px]">
                    <button
                      className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px]"
                      // Add functionality as needed, e.g., view details modal
                      onClick={() => console.log("View details for", report._id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-[10px] text-center">
                    No reports found.
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
          <span>
            Page {page} of {totalPages}
          </span>
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
    </div>
  );
}

export default SalesReport;
