"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";

function PlaceOrderCOD() {
  const navigate = useNavigate();

  const handlePlaceOrder = () => {
    // Here you can call your API to place the order.
    // For now, we simulate a successful order placement.
    navigate("/order-success");
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      <Navbar />
      <div className="max-w-[1200px] mx-auto my-10 px-5">
        <h1 className="text-4xl text-center text-neutral-900 mb-10">
          Place Order with Cash on Delivery
        </h1>
        <div className="bg-zinc-100 border-4 border-neutral-300 rounded-[37px] p-8">
          {/* You can include an order summary here if needed */}
          <p className="text-lg text-yellow-950 mb-6">
            Review your order details before placing your order with Cash on Delivery.
          </p>
          <button
            onClick={handlePlaceOrder}
            className="w-full p-4 text-lg font-bold bg-lime-600 rounded-2xl text-neutral-50"
          >
            Confirm Order
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PlaceOrderCOD;
