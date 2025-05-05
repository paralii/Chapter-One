import React from "react";
import { format } from "date-fns";

const OrderCard = ({ order, onViewDetails, onCancel, onReturn }) => {
  return (
    <div className="p-6 bg-white border-4 border-orange-200 rounded-[34px] shadow-lg mb-6">
      {/* Header: Order ID and Date */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-[#654321]">
          Order #{order.orderID || "N/A"}
        </h3>
        <span className="text-base text-gray-600">
          {order.order_date
            ? format(new Date(order.order_date), "MMM d, yyyy 'at' h:mm a")
            : "Invalid Date"}
        </span>
      </div>

      {/* Order Details */}
      <div className="mt-3 text-lg">
        <p className="flex items-center">
          <span className="font-medium text-yellow-950 mr-1">Status:</span>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              order.status === "pending"
                ? "bg-yellow-200 text-yellow-800"
                : order.status === "shipped"
                ? "bg-blue-200 text-blue-800"
                : order.status === "delivered"
                ? "bg-green-200 text-green-800"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {order.status}
          </span>
        </p>
        <p>
          <span className="font-medium text-yellow-950">Total:</span> ₹
          {Number(order.netAmount).toFixed(2)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex gap-3">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(order)}
            className="px-4 py-2 bg-[#654321] hover:bg-[#543210] text-white rounded-full text-lg transition-colors"
          >
            View Details
          </button>
        )}

        {/* Show Cancel button if order status is "pending" or "shipped" */}
        {["pending", "shipped"].includes(order.status) && onCancel && (
          <button
            onClick={() => onCancel(order)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-lg transition-colors"
          >
            Cancel Order
          </button>
        )}

        {/* Show Return button only if order status is "delivered" */}
        {order.status === "delivered" && onReturn && (
          <button
            onClick={() => onReturn(order)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-lg transition-colors"
          >
            Return Order
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
