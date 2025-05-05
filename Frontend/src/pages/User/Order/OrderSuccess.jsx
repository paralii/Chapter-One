"use client";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const orderId = location.state?.orderId;

  const handleViewOrderDetails = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      alert("Order ID not found.");
    }
  };

  const handleContinueShopping = () => {
    // Navigate to your homepage or shopping page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="max-w-[600px] text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-6">Thank You!</h1>
          <p className="text-xl text-yellow-950 mb-8">
            Your order has been placed successfully.
          </p>
          {/* <img
            src="https://via.placeholder.com/300x200?text=Order+Success"
            alt="Order Success Illustration"
            className="mx-auto mb-8"
          /> */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleViewOrderDetails}
              className="w-full p-4 text-lg font-bold bg-lime-600 rounded-2xl text-neutral-50"
            >
              View Order Details
            </button>
            <button
              onClick={handleContinueShopping}
              className="w-full p-4 text-lg font-bold bg-neutral-400 rounded-2xl text-neutral-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default OrderSuccess;
