import React, { useEffect, useState } from "react";
import userAxios from "../../../api/userAxios";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux"; // Import the useDispatch hook
import { showAlert } from "../../../redux/alertSlice"; // Import the showAlert action
import dayjs from "dayjs"; // For formatting date

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch(); // Initialize dispatch
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = async () => {
    try {
      const response = await userAxios.get(`/orders/${id}`);
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

  // Cancel a specific item
  const handleCancelItem = async (item) => {
    if (!window.confirm("Are you sure you want to cancel this item?")) return;
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    try {
      await userAxios.put("/orders/cancel", {
        orderId: order._id,
        productId: item.product_id._id,
        reason,
      });
      fetchOrder(); // Refresh order details after cancellation
    } catch (err) {
      dispatch(showAlert({ message: "Cancellation failed", type: "error" }));
    }
  };

  // Return a specific item
  const handleReturnItem = async (item) => {
    if (!window.confirm("Are you sure you want to return this item?")) return;
    const reason = prompt("Enter return reason:");
    if (!reason) return;

    try {
      await userAxios.put("/orders/return", {
        orderId: order._id,
        productId: item.product_id._id,
        reason,
      });
      fetchOrder(); // Refresh order details after return
    } catch (err) {
      dispatch(showAlert({ message: "Return request failed", type: "error" }));
    }
  };

  // Cancel the entire order
  const handleCancelOrder = async () => {
    if (!window.confirm("Cancel the entire order?")) return;
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    try {
      await userAxios.put("/orders/cancel", {
        orderId: order._id,
        reason,
      });
      fetchOrder(); // Refresh order details after full cancellation
    } catch (err) {
      dispatch(showAlert({ message: "Order cancellation failed", type: "error" }));
    }
  };

  const downloadInvoice = () => {
    userAxios
      .get(`/orders/invoice/${order._id}`, { responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${order.orderID}.pdf`;
        link.click();
      })
      .catch(() => dispatch(showAlert({ message: "Invoice download failed", type: "error" })));
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Order #{order.orderID}</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
        <p>{order.address_id.fullname}</p>
        <p>{order.address_id.address_line}</p>
        <p>
          {order.address_id.city}, {order.address_id.state} -{" "}
          {order.address_id.pincode}
        </p>
        <p>Phone: {order.address_id.phone}</p>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Items</h3>
        {order.items.map((item, index) => (
          <div
            key={index}
            className="border-b border-gray-200 py-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{item.product_id.title}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Price: ₹{item.price}</p>
              <p>Total: ₹{item.total}</p>
              <p>Status: <span className="font-semibold">{item.status}</span></p>
              {item.cancelReason && (
                <p className="text-sm text-red-500">
                  Cancel Reason: {item.cancelReason}
                </p>
              )}
              {item.returnReason && (
                <p className="text-sm text-blue-500">
                  Return Reason: {item.returnReason}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {item.status === "Pending" && (
                <button
                  onClick={() => handleCancelItem(item)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded"
                >
                  Cancel
                </button>
              )}
              {item.status === "Delivered" && (
                <button
                  onClick={() => handleReturnItem(item)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                >
                  Return
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <p>Subtotal: ₹{order.total}</p>
        <p>Shipping: ₹{order.shipping_chrg}</p>
        <p>Discount: ₹{order.discount}</p>
        <p className="font-bold text-lg">Total Paid: ₹{order.netAmount}</p>
        <p>Payment: {order.paymentMethod} - {order.paymentStatus}</p>
        <p><strong>Order Date:</strong> {dayjs(order.order_date).format("DD MMM YYYY, HH:mm")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
  {order.status === "Delivered" && (
    <button
      onClick={downloadInvoice}
      className="px-4 py-2 bg-yellow-500 text-white rounded"
    >
      Download Invoice
    </button>
  )}


        {order.status !== "Cancelled" &&
          order.items.every((item) => item.status === "Pending") && (
            <button
              onClick={handleCancelOrder}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Cancel Entire Order
            </button>
          )}
      </div>
    </div>
  );
};

export default OrderDetails;
