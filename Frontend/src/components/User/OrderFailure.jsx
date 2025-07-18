import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { FaTimesCircle } from "react-icons/fa";

function OrderFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, errorMessage } = location.state || {};

  useEffect(() => {
    toast.error(errorMessage || "Payment failed. Please try again.", {
      autoClose: 3000,
    });
  }, [errorMessage]);

  const handleRetryPayment = () => {
    navigate("/checkout", { state: { tempOrderId: orderId } });
  };

  const handleViewOrderDetails = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate("/profile/orders");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-md w-full text-center">
          <FaTimesCircle className="text-red-600 text-5xl mb-2" />
          <h1 className="text-4xl font-bold text-neutral-900 mt-2">
            Payment Failed!
          </h1>
          <p className="text-lg text-yellow-950 mt-1">
            {errorMessage || "Something went wrong with your payment. Please try again."}
          </p>
          <div className="flex flex-col gap-4 mt-6">
            <button
              onClick={handleRetryPayment}
              className="w-full p-4 text-lg font-bold bg-yellow-600 hover:bg-yellow-700 rounded-2xl text-white transition"
              disabled={!orderId}
            >
              Retry Payment
            </button>
            <button
              onClick={handleViewOrderDetails}
              className="w-full p-4 text-lg font-bold bg-neutral-500 hover:bg-neutral-600 rounded-2xl text-white transition"
              disabled={!orderId}
            >
              View Order Details
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default OrderFailure;