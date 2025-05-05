import React from "react";
import { Link } from "react-router-dom";

const PaymentSuccess = () => {
  const colors = {
    success: "#2ecc71", // Green color for success
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-10 bg-white border-4 border-green-300 rounded-3xl text-center shadow-2xl w-[90%] max-w-md">
        <svg width="80" height="80" viewBox="0 0 64 64" className="mx-auto mb-6">
          <path
            d="M20 34 L28 42 L44 26"
            stroke={colors.success}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            strokeDashoffset="100"
          >
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
        <h1 className="text-4xl font-extrabold text-green-800 mb-2">Payment Successful!</h1>
        <p className="text-lg text-gray-700 mb-6">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/order-details"
            className="px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-full shadow-md transform transition-all hover:scale-105"
          >
            View Order
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-gray-500 to-gray-700 rounded-full shadow-md transform transition-all hover:scale-105"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
