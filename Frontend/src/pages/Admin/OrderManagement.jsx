"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminAxios from "../../api/adminAxios"; // Import axios here
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";

// Main OrderManagement Component
function OrderManagement() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const navigate = useNavigate();

  const renderView = () => {
    if (activeView === "dashboard") {
      return (
        <OrdersDashboard
          onEdit={(orderId) => {
            setSelectedOrderId(orderId);
            setActiveView("edit");
          }}
          onView={(orderId) => {
            setSelectedOrderId(orderId);
            setActiveView("view");
          }}
          onLogout={() => navigate("/admin/login")}
        />
      );
    } else if (activeView === "edit") {
      return (
        <OrderEdit
          orderId={selectedOrderId}
          onCancel={() => setActiveView("dashboard")}
          onLogout={() => navigate("/admin/login")}
        />
      );
    } else if (activeView === "view") {
      return (
        <OrderDetailsView
          orderId={selectedOrderId}
          onBack={() => setActiveView("dashboard")}
          onLogout={() => navigate("/admin/login")}
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

function OrdersDashboard({ onEdit, onView, onLogout }) {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await adminAxios.get(`/orders`, {
          params: { search, page, limit },
        });
        setOrders(response.data.orders);
        setTotal(response.data.total);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, [search, page]);

  const handleClear = () => setSearch("");

  const totalPages = Math.ceil(total / limit);

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await adminAxios.put(`/orders/${orderId}/status`, { status });
      // Refresh orders list after updating status
      const response = await adminAxios.get(`/orders`, {
        params: { search, page, limit },
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleMarkItemDelivered = async (orderId, productId) => {
    try {
      await adminAxios.put(`/orders/${orderId}/mark-delivered`, { productId });
      // Refresh orders list after marking item as delivered
      const response = await adminAxios.get(`/orders`, {
        params: { search, page, limit },
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error marking item as delivered:", error);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await adminAxios.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `invoice_${orderId}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader
        title="Orders"
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        handleClear={handleClear}
        handleLogout={onLogout}
      />
      <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
              <th className="p-[10px]">Order ID</th>
              <th className="p-[10px]">Customer</th>
              <th className="p-[10px]">Date</th>
              <th className="p-[10px]">Status</th>
              <th className="p-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="bg-[#eee9dc] border-b border-b-white">
                <td className="p-[10px]">{order.orderID}</td>
                <td className="p-[10px]">{order.user_id.firstname}</td>
                <td className="p-[10px]">{order.order_date}</td>
                <td className="p-[10px]">{order.status}</td>
                <td className="p-[10px]">
                  <button
                    className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4"
                    onClick={() => onEdit(order._id)}
                  >
                    ✎ Edit
                  </button>
                  <button
  className="bg-[#ddd] hover:bg-[#ccc] text-black rounded-[10px] py-2 px-4 ml-2"
  onClick={() => onView(order._id)}
>
  View
</button>

                  <button
                    className="bg-[#2196f3] hover:bg-[#1976d2] text-white rounded-[10px] py-2 px-4 ml-2"
                    onClick={() => handleDownloadInvoice(order._id)}
                  >
                    Download Invoice
                  </button>
                  {/* You can add more action buttons like Cancel, Deliver, etc. */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}



// OrderEdit Component with Dummy Data
function OrderEdit({ orderId, onCancel, onLogout }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await adminAxios.get(`/orders/${orderId}`);
        setOrderDetails(response.data.order);
        setStatus(response.data.order.status);
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const statusColors = {
    Pending: "bg-yellow-400 text-yellow-900",
    Delivered: "bg-green-400 text-green-900",
    Shipped: "bg-blue-400 text-blue-900",
    OutForDelivery: "bg-orange-400 text-orange-900",
    Cancelled: "bg-red-400 text-red-900",
  };

  const handleUpdateStatus = async () => {
    try {
      await adminAxios.patch(`/orders/${orderId}/status`, { status });
      console.log(status);
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status.");
    }
  };

  if (!orderDetails) return <div>Loading...</div>;

  return (
    <div className="flex-1 p-10">
      <div className="flex justify-between mb-10">
        <h1 className="text-2xl font-semibold">Edit Order</h1>
        <button
          className="px-4 py-2 bg-red-400 text-white rounded"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
      <div className="bg-gray-100 rounded p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Order ID: {orderDetails._id}</h2>
          <span className={`p-2 text-xs font-semibold rounded ${statusColors[status]}`}>
            {status}
          </span>
        </div>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Change Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded bg-white border"
          >
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="OutForDelivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button
          className="mt-6 w-full py-3 bg-lime-500 text-white rounded"
          onClick={handleUpdateStatus}
        >
          Update
        </button>
        <button
          onClick={onCancel}
          className="mt-4 w-full py-3 bg-gray-200 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function OrderDetailsView({ orderId, onBack, onLogout }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await adminAxios.get(`/orders/${orderId}`);
        setOrder(response.data.order);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const handleVerifyReturn = async (productId) => {
    try {
      await adminAxios.put(`/orders/${orderId}/verify-return`, { productId });
      alert("Return verified and amount refunded to user wallet.");
      // Refresh the data
      const response = await adminAxios.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (err) {
      console.error("Error verifying return:", err);
      alert("Failed to verify return.");
    }
  };

  if (!order) return <div className="p-10">Loading...</div>;

  return (
    <div className="flex-1 p-5 sm:p-10 bg-[#fffbf0]">
      <PageHeader title="Order Details" handleLogout={onLogout} />

      <div className="bg-[#eee9dc] p-6 rounded-[15px]">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Order #{order.orderID}</h2>
          <p>User: {order.user_id.firstname} {order.user_id.lastname}</p>
          <p>Date: {new Date(order.order_date).toLocaleString()}</p>
          <p>Status: <span className="font-semibold">{order.status}</span></p>
        </div>

        <h3 className="font-semibold text-lg mt-4 mb-2">Items:</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border border-[#d4cfc5] rounded">
            <thead className="bg-[#ded8ce] text-left">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Return</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item._id} className="border-t border-[#d4cfc5] bg-[#faf7f2]">
                  <td className="p-3">{item.product_id.title}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">₹{item.price}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">
                    {item.returnRequested && !item.returnVerified ? (
                      <button
                        onClick={() => handleVerifyReturn(item._id)}
                        className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-500"
                      >
                        Verify Return
                      </button>
                    ) : item.returnVerified ? (
                      <span className="text-green-600 font-semibold">Verified</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <p className="text-lg font-semibold">Total: ₹{order.totalAmount}</p>
          <p>Payment Method: {order.paymentMethod}</p>
        </div>

        <button
          onClick={onBack}
          className="mt-6 px-6 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded"
        >
          ← Back to Orders
        </button>
      </div>
    </div>
  );
}

export default OrderManagement; 
