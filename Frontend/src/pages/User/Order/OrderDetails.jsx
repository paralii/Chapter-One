import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../redux/alertSlice";
import dayjs from "dayjs";
import showConfirmDialog from "../../../components/common/ConformationModal";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import { getOrderDetails, placeOrder, cancelOrderOrItem, returnOrderItem, downloadInvoice } from "../../../api/user/orderAPI";
import BookLoader from "../../../components/common/BookLoader";
import { createRazorpayOrder, verifyPayment } from "../../../api/user/paymentAPI";
import userAxios from "../../../api/userAxios";

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const fetchOrder = async () => {
    try {
    const response = await getOrderDetails(id);
      setOrder(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load order details");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  const handleCancelItem = async (item) => {
    showConfirmDialog({
      message: "Are you sure you want to cancel this item?",
      requireReason: true,
      placeholder: "Enter cancellation reason (required)",
      onConfirm: async (reason) => {
        setActionLoading(true);
        try {
          await cancelOrderOrItem({
          orderId: order._id,
          productId: item.product_id._id,
          reason,
        });
          fetchOrder();
          dispatch(showAlert({ message: 'Item cancelled successfully', type: 'success' }));
        } catch (err) {
          dispatch(
            showAlert({ message: "Cancellation failed", type: "error" })
          );
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReturnItem = async (item) => {
    showConfirmDialog({
      message: "Are you sure you want to return this item?",
      requireReason: true,
      placeholder: "Enter return reason (required)",
      reasonRequired: true,
      onConfirm: async (reason) => {
                setActionLoading(true);

        try {
          await returnOrderItem({
          orderId: order._id,
itemId: item._id, // this is the order item's ID, not the product
          reason,
        });
          fetchOrder();
                    dispatch(showAlert({ message: 'Return request submitted', type: 'success' }));

        } catch (err) {
          dispatch(
            showAlert({ message: err.message, type: "error" })
          );
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handlecancelOrderOrItem = async () => {
    showConfirmDialog({
      message: "Are you sure you want to cancel the entire order?",
      requireReason: true,
      placeholder: "Enter cancellation reason (required)",
      onConfirm: async (reason) => {
                setActionLoading(true);

        try {
          await cancelOrderOrItem({
          orderId: order._id,
          reason,
        });
          fetchOrder();
                    dispatch(showAlert({ message: 'Order cancelled successfully', type: 'success' }));

        } catch (err) {
          dispatch(
            showAlert({ message: "Order cancellation failed", type: "error" })
          );
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

 const handleDownloadInvoice = async () => {
      setActionLoading(true);

  try {
    const res = await downloadInvoice(order._id);
    const blob = new Blob([res.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${order.orderID}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
      dispatch(showAlert({ message: 'Invoice downloaded successfully', type: 'success' }));
  } catch {
    dispatch(
      showAlert({ message: "Invoice download failed", type: "error" })
    );
  } finally {
      setActionLoading(false);
    }
};

const handleRetryPayment = async () => {
    if (!window.Razorpay) {
      dispatch(showAlert({ message: "Razorpay script not loaded", type: "error" }));
      return;
    }
    setActionLoading(true);
    try {
      const { data: razor } = await userAxios.post("/payment/create-order", {
        amount: order.netAmount,
        order_id: order._id,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razor.order.amount,
        currency: razor.order.currency,
        name: "My Shop",
        description: `Order ${order.orderID}`,
        order_id: razor.order.id,
        handler: async function (response) {
          await userAxios.post("/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: order._id,
          });
          navigate("/order-success", { state: { orderId: order._id } });
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9876543210",
        },
        theme: { color: "#F37254" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      dispatch(showAlert({ message: `Retry payment failed: ${err.response?.data?.message || err.message}`, type: "error" }));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-10"><BookLoader/></p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <>
      <Navbar />
    <div className="w-full max-w-full bg-[#fff8e5]  p-8 shadow-lg mx-auto flex flex-col min-h-screen">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center">Order Details</h2>
        <Link
          to="/profile/orders"
          className="text-sm text-gray-700 hover:text-yellow-600"
        >
          &larr; Back to Orders
        </Link>
      </div>

      {/* Order Header */}
{/* Order Header & Shipping Address */}
<div className="mb-6 bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-4">
  {/* Order Info */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <h3 className="text-lg font-semibold text-gray-800">
      Order ID: <span className="font-mono tracking-wide text-gray-600">{order.orderID}</span>
    </h3>
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full capitalize border ${
        order.status === "Cancelled"
          ? "bg-red-50 text-red-600 border-red-200"
          : order.status === "Delivered"
          ? "bg-blue-50 text-blue-600 border-blue-200"
          : order.status === "Pending"
          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : order.status === "Shipped"
          ? "bg-indigo-50 text-indigo-600 border-indigo-200"
          : order.status === "OutForDelivery"
          ? "bg-purple-50 text-purple-600 border-purple-200"
          : "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {order.status}
    </span>
  </div>

  {/* Order Date */}
  <p className="text-sm text-gray-600">
    <strong>Order Date:</strong>{" "}
    {dayjs(order.order_date).format("DD MMM YYYY, hh:mm A")}
  </p>

  {/* Shipping Address */}
  <div>
    <h4 className="text-base font-semibold text-gray-800 mb-1">Shipping Address</h4>
    <div className="text-sm text-gray-700 leading-relaxed space-y-1">
      <p>
        <strong>{order.address_id.name}</strong>
        <span className="ml-2 text-gray-500">({order.address_id.type})</span>
      </p>
      <p>{order.address_id.place}</p>
      <p>
        {order.address_id.city}, {order.address_id.district}
      </p>
      <p>
        {order.address_id.state}, {order.address_id.country} - {order.address_id.pin}
      </p>
      <p>
        <span className="text-gray-500">Phone:</span> {order.address_id.phone}
      </p>
    </div>
  </div>
</div>


      {/* Items List */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Items</h3>
        <ul className="space-y-6">
          {order.items.map((item, index) => (
            <li
              key={index}
              className="flex gap-4 items-start border-b pb-4 last:border-b-0"
            >
              {item.product_id ? (
                <>
                  <img
                    src={item.product_id.product_imgs?.[0] || "/fallback.jpg"}
                    alt={item.product_id.title}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex flex-col text-sm text-gray-700 flex-1">
                    <p className="font-semibold">{item.product_id.title}</p>
                    <p>
                      <strong>Quantity:</strong> {item.quantity}
                    </p>
                    <p>
                      <strong>Price:</strong> ₹{item.price.toFixed(2)}
                    </p>
                    <p>
                      <strong>Total:</strong> ₹{item.total.toFixed(2)}
                    </p>
                    <p>
                      <strong>Status:</strong> {item.status}
                    </p>
                    {item.cancelReason && (
                      <p className="text-red-600">
                        <strong>Cancel Reason:</strong> {item.cancelReason}
                      </p>
                    )}
                    {item.returnReason && (
                      <p className="text-blue-600">
                        <strong>Return Reason:</strong> {item.returnReason}
                      </p>
                    )}
                    {item.status === 'Returned' && (
                        <p>
                          <strong>Return Status:</strong>{' '}
                          {item.returnVerified
                            ? item.returnDecision === 'approved'
                              ? 'Approved'
                              : 'Rejected'
                            : 'Pending Verification'}
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
              <div className="flex flex-col gap-2 mt-2">
                {item.status === "Pending" && (
                  <button
                    onClick={() => handleCancelItem(item)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                )}
                {item.status === "Delivered" && (
                  <button
                    onClick={() => handleReturnItem(item)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Return
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <p>
            <strong>Subtotal:</strong> ₹{order.total.toFixed(2)}
          </p>
          <p>
            <strong>Shipping:</strong> ₹{order.shipping_chrg.toFixed(2)}
          </p>
          <p>
            <strong>Taxes</strong> ₹{order.taxes.toFixed(2)}
          </p>
          <p>
            <strong>Discount:</strong> ₹{order.discount.toFixed(2)}
          </p>
          <p>
            <strong>Total Paid:</strong>{" "}
            <span className="text-green-700 font-semibold">
              ₹{order.netAmount.toFixed(2)}
            </span>
          </p>
          <p>
            <strong>Payment:</strong> {order.paymentMethod}
          </p>
          <p>
            <strong>Status:</strong> {order.paymentStatus}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {order.status === "Delivered"  && (
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 disabled:opacity-50"
            disabled={actionLoading}
          >
            Download Invoice
          </button>
        )}
        {order.status !== "Cancelled" &&
          order.items.every((item) => item.status === "Pending") && (
            <button
              onClick={handlecancelOrderOrItem}
              className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 disabled:opacity-50"
              disabled={actionLoading}
            >
              Cancel Entire Order
            </button>
          )}
          {order.paymentMethod === "ONLINE" &&
            ["Pending", "Failed"].includes(order.paymentStatus) &&
            order.status === "Pending" && (
              <button
                onClick={handleRetryPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 disabled:opacity-50"
                disabled={actionLoading}
              >
                Retry Payment
              </button>
            )}
      </div>

    </div>
      <Footer />
    </>
  );
};

export default OrderDetails;
