import React, { useEffect, useState } from "react";
import userAxios from "../../../api/userAxios";
import { Link } from "react-router-dom";
import dayjs from "dayjs"; // For formatting date

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // Added search state

  const fetchOrders = async () => {
    const res = await userAxios.get("/orders");
    setOrders(res.data.orders);
  };

  const handleCancel = async (orderId) => {
    await userAxios.put(`/orders/${orderId}/cancel`);
    fetchOrders();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.orderID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.product_id.title.toLowerCase().includes(searchQuery.toLowerCase())  
  );

  return (
    <div className="bg-yellow-50 min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Your Orders</h2>

        {/* Search Bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search orders..."
          className="border p-2 rounded w-full mb-4"
        />

        {filteredOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="relative mb-4">
              <Link to={`/orders/${order._id}`}>
                <div className="border p-4 rounded hover:bg-yellow-100 transition cursor-pointer">
                  <p><strong>Order ID:</strong> {order.orderID}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                  <p><strong>Order Date:</strong> {dayjs(order.order_date).format("DD MMM YYYY, HH:mm")}</p>
                  <p><strong>Shipping Charge:</strong> ₹{order.shipping_chrg}</p>
                  <p><strong>Discount:</strong> ₹{order.discount}</p>
                  <p><strong>Total:</strong> ₹{order.total}</p>
                  <p><strong>Net Amount:</strong> ₹{order.netAmount}</p>
                  <p><strong>Items:</strong></p>
                  <ul className="list-disc pl-6">
                    {order.items.map((item, index) => (
                      <li key={item._id} className="mb-2">
                        <p><strong>Quantity:</strong> {item.quantity}</p>
                        <p><strong>Price:</strong> ₹{item.price}</p>
                        <p><strong>Total:</strong> ₹{item.total}</p>
                        <p><strong>Status:</strong> {item.status}</p>
                        {item.cancelReason && <p><strong>Cancel Reason:</strong> {item.cancelReason}</p>}
                        <p><strong>Refund Processed:</strong> {item.refundProcessed ? "Yes" : "No"}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>

              {order.status === "Placed" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent link navigation
                    e.preventDefault(); // Prevent link default behavior
                    handleCancel(order._id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
                >
                  Cancel Order
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserOrders;
