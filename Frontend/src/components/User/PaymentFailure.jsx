import React from "react";
import { Link } from "react-router-dom";

const PaymentFailure = ({ onClose }) => {
  const colors = {
    failure: "#e63946", // Red color for failure
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-sm p-8 bg-white border-4 border-red-300 rounded-3xl shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
        >
          &times;
        </button>

        {/* Animated X Mark */}
        <div className="flex justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <line
              x1="22"
              y1="22"
              x2="22"
              y2="22"
              stroke={colors.failure}
              strokeWidth="4"
              strokeLinecap="round"
            >
              <animate attributeName="x2" from="22" to="42" dur="1s" repeatCount="indefinite" />
              <animate attributeName="y2" from="22" to="42" dur="1s" repeatCount="indefinite" />
            </line>
            <line
              x1="42"
              y1="22"
              x2="42"
              y2="22"
              stroke={colors.failure}
              strokeWidth="4"
              strokeLinecap="round"
            >
              <animate attributeName="x2" from="42" to="22" dur="1s" repeatCount="indefinite" />
              <animate attributeName="y2" from="22" to="42" dur="1s" repeatCount="indefinite" />
            </line>
          </svg>
        </div>

        {/* Message */}
        <h1 className="mt-4 text-3xl font-bold text-red-800 text-center">Payment Failed</h1>
        <p className="mt-2 text-lg text-gray-700 text-center">
          Unfortunately, your payment could not be processed.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex flex-col space-y-3">
          <Link
            to="/retry-payment"
            className="w-full px-6 py-3 text-lg font-bold text-white bg-red-600 rounded-xl shadow-md hover:bg-red-700 transition duration-300 text-center"
          >
            🔄 Retry Payment
          </Link>
          <Link
            to="/order-details"
            className="w-full px-6 py-3 text-lg font-bold text-white bg-gray-700 rounded-xl shadow-md hover:bg-gray-800 transition duration-300 text-center"
          >
            📄 View Order Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
