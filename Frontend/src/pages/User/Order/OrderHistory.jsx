// src/pages/User/OrderHistory.jsx
import React, { useEffect, useState } from 'react';
import { getOrders, cancelOrder, returnOrder } from '../../../api/user/orderAPI';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch orders on mount
  useEffect(() => {
    setLoading(true);
    getOrders()
      .then((res) => {
        setOrders(res.orders || res.data?.orders || res.data); // adjust based on your API response structure
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const handleCancel = (orderId) => {
    const reason = prompt('Optional: Provide a reason for cancellation.');
    if (reason === null) return; // user cancelled the prompt
    cancelOrder(orderId, { reason })
      .then(() => {
        alert('Order cancelled successfully!');
        // Optionally update local orders state or refetch orders
      })
      .catch((err) => {
        alert(`Cancellation failed: ${err}`);
      });
  };

  const handleReturn = (orderId) => {
    const reason = prompt('Please provide a reason for return (mandatory):');
    if (!reason) return alert("Return reason is mandatory.");
    returnOrder(orderId, { reason })
      .then(() => {
        alert('Return request submitted.');
        // Optionally update local orders state or refetch orders
      })
      .catch((err) => {
        alert(`Return request failed: ${err}`);
      });
  };

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error fetching orders: {error}</p>;

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderID} className="border p-4 mb-4">
            <p><strong>Order ID:</strong> {order.orderID}</p>
            <p>
              <strong>Date:</strong> {new Date(order.date).toLocaleDateString()}
            </p>
            <p><strong>Status:</strong> {order.status}</p>
            <div className="mt-2 flex gap-4">
              <button
                onClick={() => handleCancel(order.orderID)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Cancel Order
              </button>
              {order.status === 'delivered' && (
                <button
                  onClick={() => handleReturn(order.orderID)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Return Order
                </button>
              )}
              <button
                onClick={() => window.open(`/invoice/${order.orderID}`)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Download Invoice
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;
