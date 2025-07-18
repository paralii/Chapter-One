import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import confetti from "canvas-confetti";
import { FaCheckCircle } from "react-icons/fa";

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      toast.error("Order ID not found. Redirecting to home...", {
        autoClose: 3000,
      });
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } else {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, i * 300);
      }
    }
  }, [orderId, navigate]);

  const handleViewOrderDetails = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };

  const handleContinueShopping = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-md w-full text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <FaCheckCircle className="text-lime-600 text-5xl mb-2" />
            <h1 className="text-4xl font-bold text-neutral-900 mt-2">
              Thank You!
            </h1>
            <p className="text-lg text-yellow-950 mt-1">
              Your order has been placed successfully.
            </p>
          </div>

          {/* ✅ Action Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleViewOrderDetails}
              disabled={!orderId}
              className={`w-full p-4 text-lg font-bold rounded-2xl text-white transition ${
                orderId
                  ? "bg-lime-600 hover:bg-lime-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              View Order Details
            </button>

            <button
              onClick={handleContinueShopping}
              className="w-full p-4 text-lg font-bold bg-neutral-500 hover:bg-neutral-600 rounded-2xl text-white transition"
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
1;
