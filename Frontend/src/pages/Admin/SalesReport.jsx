import React, { useState, useEffect } from "react";
import { useNavigate} from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import adminAxios from "../../api/adminAxios";
import { adminLogout } from "../../redux/adminSlice";
import { useDispatch } from "react-redux";

function SalesReport() {
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalDiscount: 0,
    netRevenue: 0,
    orders: [],
  });
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validateDates = () => {
    const today = new Date().toISOString().split("T")[0];
    if (fromDate && new Date(fromDate) > new Date(today)) {
      setError("From date cannot be in the future");
      return false;
    }
    if (toDate && new Date(toDate) > new Date(today)) {
      setError("To date cannot be in the future");
      return false;
    }
    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
      setError("To date must be after from date");
      return false;
    }
    return true;
  };

  const fetchReports = async () => {
    if (filterType === "custom" && (!fromDate || !toDate)) {
      setError("Please select both from and to dates for custom range");
      return;
    }
    if (filterType === "custom" && !validateDates()) {
      return;
    }
    try {
      const params = { type: filterType, page, limit };
      if (filterType === "custom" && fromDate && toDate) {
        params.fromDate = fromDate;
        params.toDate = toDate;
      }
      const response = await adminAxios.get("/sales-report", {
        params,
        withCredentials: true,
      });
      setReportData(response.data.data);
      setTotal(response.data.data.totalOrders);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching sales reports");
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterType, fromDate, toDate, page]);

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
    if (e.target.value !== "custom") {
      setFromDate("");
      setToDate("");
      setError(null);
    }
  };

  const handleDownload = async (format) => {
    if (filterType === "custom" && (!fromDate || !toDate)) {
      setError("Please select both from and to dates for custom range");
      return;
    }
    if (filterType === "custom" && !validateDates()) {
      return;
    }
    try {
      const params = { type: filterType };
      if (filterType === "custom" && fromDate && toDate) {
        params.fromDate = fromDate;
        params.toDate = toDate;
      }
      const response = await adminAxios.get(`/sales-report/${format}`, {
        params,
        responseType: "blob",
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sales-report-${filterType || "custom"}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Error downloading report");
    }
  };

  const handleClear = () => {
    setFilterType("daily");
    setFromDate("");
    setToDate("");
    setPage(1);
    setError(null);
    fetchReports();
  };

  const handleLogout = async () => {
    try {
      dispatch(adminLogout());
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
          handleClear={handleClear}
          handleLogout={handleLogout}
        />

        {error && <div className="text-red-500 mb-5">{error}</div>}

        {/* Filter Section */}
        <div className="mb-5 bg-[#eee9dc] p-5 rounded-[15px]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-[#484848] mb-2">Report Type</label>
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            {filterType === "custom" && (
              <>
                <div className="flex-1">
                  <label className="block text-[#484848] mb-2">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[#484848] mb-2">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    max={new Date().toISOString().split("T")[0]}
                    min={fromDate || "2005-11-22"}
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => handleDownload("pdf")}
              className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px]"
            >
              Download PDF
            </button>
            <button
              onClick={() => handleDownload("excel")}
              className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px]"
            >
              Download Excel
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-5 bg-[#eee9dc] p-5 rounded-[15px]">
          <h2 className="text-lg font-semibold text-[#484848] mb-4">Report Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[#484848]">Total Orders</p>
              <p className="text-2xl font-bold">{reportData.totalOrders}</p>
            </div>
            <div>
              <p className="text-[#484848]">Total Sales</p>
              <p className="text-2xl font-bold">₹{reportData.totalSales.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[#484848]">Total Discount</p>
              <p className="text-2xl font-bold">₹{reportData.totalDiscount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[#484848]">Net Revenue</p>
              <p className="text-2xl font-bold">₹{reportData.netRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
                <th className="p-[10px]">Order ID</th>
                <th className="p-[10px]">User</th>
                <th className="p-[10px]">Date</th>
                <th className="p-[10px]">Total</th>
                <th className="p-[10px]">Discount</th>
                <th className="p-[10px]">Net Payable</th>
                <th className="p-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.orders.map((order) => (
                <tr key={order._id} className="bg-[#eee9dc] border-b border-b-white">
                  <td className="p-[10px]">{order.orderID}</td>
                  <td className="p-[10px]">{`${order.user_id.firstname}`}</td>
                  <td className="p-[10px]">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-[10px]">₹{order.total.toFixed(2)}</td>
                  <td className="p-[10px]">₹{order.discount.toFixed(2)}</td>
                  <td className="p-[10px]">₹{order.netAmount.toFixed(2)}</td>
                  <td className="p-[10px]">{order.status}</td>
                </tr>
              ))}
              {reportData.orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-[10px] text-center">
                    No orders found.
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