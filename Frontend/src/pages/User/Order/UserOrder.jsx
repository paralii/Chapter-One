import React, { useEffect, useState } from "react";
import userAxios from "../../../api/userAxios";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 

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

  const filteredOrders = orders.filter((order) => {
    const matchesOrderID = order.orderID
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = order.status
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesProductTitle = order.items?.some((item) =>
      item.product_id?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matchesOrderID || matchesStatus || matchesProductTitle;
  });

  return (
    <>
      <Navbar />
    <div className="w-full max-w-full bg-[#fff8e5]  p-8 shadow-lg mx-auto flex flex-col min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center">Your Orders</h2>
        <Link
          to="/profile"
          className="text-sm text-gray-700 hover:text-yellow-600"
        >
          &larr; Back to Profile
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search orders..."
          className="w-full h-12 rounded-3xl bg-[#edece9] px-5 text-[16px] outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />
      </div>

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center">No orders found.</p>
      ) : (
        filteredOrders.map((order) => (
          <div
            key={order._id}
            className="relative mb-6 p-6 bg-white shadow-md rounded-lg border border-gray-200"
          >
            <Link to={`/orders/${order._id}`} className="block">
              {/* Order Header */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-semibold text-gray-900">
                  Order ID:{" "}
                  <span className="font-mono tracking-wider">
                    {order.orderID}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-4 py-2 rounded-full capitalize ${
                    order.status === "Cancelled"
                      ? "bg-red-100 text-red-600"
                      : order.status === "Delivered"
                      ? "bg-blue-100 text-blue-600"
                      : order.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "Shipped"
                      ? "bg-indigo-100 text-indigo-600"
                      : order.status === "OutForDelivery"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
                                    {(order.paymentStatus === "Failed" || order.paymentStatus === "Pending") &&
                      order.paymentMethod === "ONLINE" && (
                        <span className="text-xs font-semibold px-4 py-2 rounded-full bg-red-100 text-red-600">
                          Payment {order.paymentStatus}
                        </span>
                      )}
                      </div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                <p>
                  <strong>Payment:</strong> {order.paymentMethod}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {dayjs(order.order_date).format("DD MMM YYYY, hh:mm A")}
                </p>
              </div>

              {/* Order Charges */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 border-t pt-3 mb-4">
                <p>
                  <strong>Shipping:</strong> ₹{order.shipping_chrg.toFixed(2)}
                </p>
                <p>
                  <strong>Discount:</strong> ₹{order.discount.toFixed(2)}
                </p>
              </div>

              {/* Total Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-800 font-medium border-t pt-3 mb-4">
                <p>
                  <strong>Total:</strong> ₹{order.total.toFixed(2)}
                </p>
                <p>
                  <strong>Net Amount:</strong>
                  <span className="text-green-700">
                    {" "}
                    ₹{order.netAmount.toFixed(2)}
                  </span>
                </p>
              </div>

              {/* Items List */}
              <div className="mt-4">
                <strong>Items:</strong>
                <ul className="space-y-4 mt-2">
                  {order.items.map((item) => (
                    <li key={item._id} className="flex gap-4 items-start">
                      {item.product_id ? (
                        <>
                          <img
                            src={
                              item.product_id.product_imgs?.[0] ||
                              "/fallback.jpg"
                            } // Optional fallback image
                            alt={item.product_id.title}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold text-gray-700">
                              {item.product_id.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Quantity:</strong> {item.quantity}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Price:</strong> ₹{item.price}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Total:</strong> ₹{item.total}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Status:</strong> {item.status}
                            </p>
                            {item.cancelReason && (
                              <p className="text-sm text-gray-600">
                                <strong>Cancel Reason:</strong>{" "}
                                {item.cancelReason}
                              </p>
                            )}
                            {(item.status === "returned" ||
                              item.status === "cancelled") && (
                              <p className="text-sm text-gray-600">
                                <strong>Refund Processed:</strong>{" "}
                                {item.refundProcessed ? "Yes" : "No"}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-red-600">
                          <p>
                            <strong>Product removed</strong>
                          </p>
                          <p>Details unavailable</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
    <Footer />
    </>
  );
};

export default UserOrders;
