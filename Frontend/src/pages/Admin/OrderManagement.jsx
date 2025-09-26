import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import { adminLogout } from "../../redux/adminSlice";
import { listOrdersAdmin, getOrderDetailsAdmin, updateOrderStatus, markItemDelivered, downloadAdminInvoice, verifyReturnRequest } from "../../api/admin/orderAPI";
import BookLoader from "../../components/common/BookLoader";
import { showAlert } from "../../redux/alertSlice";
import { useDispatch } from "react-redux";
import showConfirmDialog from "../../components/common/ConformationModal";
import useDebounce from "../../hooks/useDebounce";

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
          onLogout={() => {
            adminLogout();
            navigate("/admin/login");
          }}
        />
      );
    } else if (activeView === "edit") {
      return (
        <OrderEdit
          orderId={selectedOrderId}
          onCancel={() => setActiveView("dashboard")}
          onLogout={() => {
            adminLogout();
            navigate("/admin/login");
          }}
        />
      );
    } else if (activeView === "view") {
      return (
        <OrderDetailsView
          orderId={selectedOrderId}
          onBack={() => setActiveView("dashboard")}
          onLogout={() => {
            adminLogout();
            navigate("/admin/login");
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

function OrdersDashboard({ onEdit, onView, onLogout }) {
  const [search, setSearch] = useState("");

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const limit = 10;

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 500);
  const dispatch = useDispatch();

    useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listOrdersAdmin({
          search,
          page,
          limit,
          sort,
          sortOrder,
          status: statusFilter,
          paymentMethod: paymentMethodFilter,
        });
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [search, page, sort, sortOrder, statusFilter, paymentMethodFilter]);

  const handleClear = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentMethodFilter('');
    setSort('order_date');
    setSortOrder('desc');
    setPage(1);
  };
  const totalPages = Math.ceil(total / limit);

//     const handleSoftDeleteOrder = (orderId) => {
//   showConfirmDialog({
//     message: "Do you really want to delete this order?",
//     requireReason: true,
//     placeholder: "Provide reason for deletion",
//     onConfirm: async (reason) => {
//       try {
//         await softDeleteOrder(orderId, reason); // include reason in backend if expected
//         const data = await listOrdersAdmin({
//           search,
//           page,
//           limit,
//           sort,
//           sortOrder,
//           status: statusFilter,
//           paymentMethod: paymentMethodFilter,
//         });
//         setOrders(data.orders || []);
//         setTotal(data.total || 0);
//         dispatch(showAlert({ message: "Order deleted successfully!", type: "success" }));
//       } catch (err) {
//         dispatch(showAlert({ message: err.message || "Failed to delete order", type: "error" }));
//       }
//     },
//   });
// };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await downloadAdminInvoice(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoice_${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      dispatch(showAlert({ message: err.message || 'Failed to download invoice', type: 'error' }));
    }
  };

  useEffect(() => {
    if(search !== debouncedSearch) {
      setSearch(debouncedSearch);
      setPage(1);
    }
  },[debouncedSearch]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  
  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader
        title="Orders"
        search={search}
        onSearchChange={handleSearchChange}
        handleClear={handleClear}
      />
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Sort by:</label>
    <div className="flex gap-2">
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="border rounded px-2 py-1 flex-1"
      >
        <option value="order_date">Order Date</option>
        <option value="status">Status</option>
      </select>
      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="border rounded px-2 py-1 flex-1"
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </div>
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Filter by Status:</label>
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="border rounded px-2 py-1"
    >
      <option value="">All</option>
      <option value="Pending">Pending</option>
      <option value="Shipped">Shipped</option>
      <option value="OutForDelivery">Out for Delivery</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
    </select>
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Filter by Payment:</label>
    <select
      value={paymentMethodFilter}
      onChange={(e) => setPaymentMethodFilter(e.target.value)}
      className="border rounded px-2 py-1"
    >
      <option value="">All</option>
      <option value="COD">COD</option>
      <option value="ONLINE">Online</option>
    </select>
  </div>
</div>

      {loading ? (
        <div className="text-center"><BookLoader/></div>
      ) : orders.length === 0 ? (
        <div className="text-center">No orders found</div>
      ) : (
        <>
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
                    <td className="p-[10px]">
                      {order.user_id.firstname} {order.user_id.lastname}
                    </td>
                    <td className="p-[10px]">{new Date(order.order_date).toLocaleString()}</td>
                    <td className="p-[10px]">{order.status}</td>
                    <td className="p-[10px] flex gap-2">
                      <button
                        className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4"
                        onClick={() => onEdit(order._id)}
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="bg-[#ddd] hover:bg-[#ccc] text-black rounded-[10px] py-2 px-4"
                        onClick={() => onView(order._id)}
                      >
                        View
                      </button>
                      <button
                        className="bg-[#2196f3] hover:bg-[#1976d2] text-white rounded-[10px] py-2 px-4"
                        onClick={() => handleDownloadInvoice(order._id)}
                      >
                        Download Invoice
                      </button>
                      {/* <button
                        className="bg-[#ff4444] hover:bg-[#cc0000] text-white rounded-[10px] py-2 px-4"
                        onClick={() => handleSoftDeleteOrder(order._id)}
                      >
                        Delete
                      </button> */}
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
        </>
      )}
    </div>
  );
}



// OrderEdit Component with Dummy Data
function OrderEdit({ orderId, onCancel, onLogout }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const order = await getOrderDetailsAdmin(orderId);
        setOrderDetails(order);
        setStatus(order.status);
      } catch (err) {
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const statusColors = {
    Processing: 'bg-yellow-400 text-yellow-900',
    Delivered: 'bg-green-400 text-green-900',
    Shipped: 'bg-blue-400 text-blue-900',
    OutForDelivery: 'bg-orange-400 text-orange-900',
    Cancelled: 'bg-red-400 text-red-900',
  };

  const handleUpdateStatus = async () => {
    setLoading(true);
    setError('');
    try {
      await updateOrderStatus(orderId, status);
      dispatch(showAlert({ message: 'Order status updated successfully!', type: 'success' }));
      onCancel();
    } catch (err) {
      dispatch(showAlert({ message: err.message || 'Failed to update order status', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

//     const handleSoftDeleteOrder = () => {
//   showConfirmDialog({
//     message: "Are you sure you want to delete this order?",
//     requireReason: true,
//     placeholder: "Please provide a reason for deleting this order",
//     onConfirm: async (reason) => {
//       setLoading(true);
//       setError("");
//       try {
//         await softDeleteOrder(orderId, reason); // include reason if needed
//         dispatch(showAlert({ message: "Order deleted successfully!", type: "success" }));
//         onCancel();
//       } catch (err) {
//         setError(err.message || "Failed to delete order");
//       } finally {
//         setLoading(false);
//       }
//     },
//   });
// };

  if (loading) return <div className="p-10"><BookLoader/></div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!orderDetails) return <div className="p-10">No order data</div>;

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
          <h2 className="text-xl font-semibold">Order ID: {orderDetails.orderID}</h2>
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
            disabled={loading}
          >
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="OutForDelivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button
          className="mt-6 w-full py-3 bg-lime-500 text-white rounded disabled:opacity-50"
          onClick={handleUpdateStatus}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
        {/* <button
          className="mt-4 w-full py-3 bg-red-500 text-white rounded disabled:opacity-50"
          onClick={handleSoftDeleteOrder}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete Order'}
        </button> */}
        <button
          onClick={onCancel}
          className="mt-4 w-full py-3 bg-gray-200 rounded"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function OrderDetailsView({ orderId, onBack, onLogout }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const orderData = await getOrderDetailsAdmin(orderId);
        setOrder(orderData);
      } catch (err) {
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const handleMarkItemDelivered = async (productId) => {
    setLoading(true);
    setError('');
    try {
      await markItemDelivered(orderId, productId);
      dispatch(showAlert({ message: 'Item marked as delivered!', type: 'success' }));
      const orderData = await getOrderDetailsAdmin(orderId);
      setOrder(orderData);
    } catch (err) {
      setError(err.message || 'Failed to mark item as delivered');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReturn = async (productId, decision) => {
    setLoading(true);
    setError('');
    try {
      await verifyReturnRequest(orderId, productId._id || productId, decision);
      dispatch(showAlert({ message: `Return request ${decision ? 'approved' : 'rejected'}!`, type: 'success' }));
      const orderData = await getOrderDetailsAdmin(orderId);
      setOrder(orderData);
    } catch (err) {
      setError(err.message || 'Failed to verify return request');
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <div className="p-10"><BookLoader/></div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!order) return <div className="p-10">No order data</div>;

  return (
    <div className="flex-1 p-5 sm:p-10 bg-[#fffbf0]">
      <PageHeader title="Order Details" handleLogout={onLogout} />
      <div className="bg-[#eee9dc] p-6 rounded-[15px]">
        <div className="mb-4">
  <h2 className="text-xl font-bold mb-2">Order #{order.orderID}</h2>
  <p>User: {order.user_id.firstname} {order.user_id.lastname}</p>
  <p>Date: {new Date(order.order_date).toLocaleString()}</p>
  <p>Status: <span className="font-semibold">{order.status}</span></p>

  {order.address_id && (
    <div className="mt-2">
      <h3 className="font-semibold">Shipping Address:</h3>
      <p>{order.address_id.name}</p>
      <p>{order.address_id.place}, {order.address_id.city}, {order.address_id.district}</p>
      <p>{order.address_id.state}, {order.address_id.country} - {order.address_id.pin}</p>
      <p>Phone: {order.address_id.phone}</p>
      <p>Type: {order.address_id.type}</p>
    </div>
  )}
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
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
                      {order.items.map((item) => (
                <tr
                  key={item.product_id?.toString() || item._id}
                  className="border-t border-[#d4cfc5] bg-[#faf7f2]"
                >
                  <td className="p-3">{item.product_id?.title || 'Deleted Product'}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">₹{item.price.toFixed(2)}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">
                    {item.status === 'Returned' && !item.returnVerified ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyReturn(item.product_id, true)}
                          className="bg-green-400 text-black px-4 py-1 rounded hover:bg-green-500"
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerifyReturn(item.product_id, false)}
                          className="bg-red-400 text-black px-4 py-1 rounded hover:bg-red-500"
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    ) : item.returnVerified ? (
                      <span
                        className={
                          item.returnDecision === 'approved' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {item.returnDecision.charAt(0).toUpperCase() + item.returnDecision.slice(1)}
                      </span>
                    ) : item.status === 'OutForDelivery' ? (
                      <button
                        onClick={() => handleMarkItemDelivered(item.product_id)}
                        className="bg-blue-400 text-black px-4 py-1 rounded hover:bg-blue-500"
                        disabled={loading}
                      >
                        Mark Delivered
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <p className="text-lg font-semibold">Total: ₹{order.netAmount.toFixed(2)}</p>
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