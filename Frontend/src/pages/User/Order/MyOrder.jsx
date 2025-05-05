"use client";
import React, { useState } from "react";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";

const IconUser = ({ size = 70 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21c0-3.5 2.5-6 6.5-6 4 0 6.5 2.5 6.5 6" />
  </svg>
);

const OrdersPage = () => {
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const orders = [
    {
      id: "ORD-1001", // unique, consistent orderID
      title: "Die for you",
      status: "Processing",
      date: "13.12.2024",
      price: "₹499.00",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/5d7fc9153d8c22782e6a2124603228ff2b84ab36",
    },
    {
      id: "ORD-1002",
      title: "ram C/O Anandhi",
      status: "Out for delivery",
      date: "13.12.2024",
      price: "₹319.00",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/1f8af112ae4a06b7fd478c02b753626f0bfca922",
    },
    {
      id: "ORD-1003",
      title: "India Before the Ambanis",
      status: "Delivered",
      date: "13.12.2024",
      price: "₹699.00",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/8c56d19d5efaadf2aa1194f10171dd760dd60bb4",
    },
  ];

  // When a user clicks the cancel button
  const handleCancelClick = (orderId) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
  };

  // Submit cancellation (optional reason)
  const submitCancelOrder = async () => {
    try {
      await axios.patch(
        `http://localhost:2211/orders/${selectedOrderId}/cancel`,
        { reason: cancelReason } // reason is optional
      );
      alert("Order cancelled successfully");
      // Ideally refresh the order list here
    } catch (error) {
      alert(
        "Error cancelling order: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setShowCancelModal(false);
      setCancelReason("");
      setSelectedOrderId(null);
    }
  };

  // When a user clicks the return button
  const handleReturnClick = (orderId) => {
    setSelectedOrderId(orderId);
    setShowReturnModal(true);
  };

  // Submit return request (reason mandatory)
  const submitReturnOrder = async () => {
    if (!returnReason.trim()) {
      alert("Please provide a reason for return.");
      return;
    }
    try {
      await axios.patch(
        `http://localhost:2211/orders/${selectedOrderId}/return`,
        { reason: returnReason }
      );
      alert("Return request submitted successfully");
      // Ideally refresh the order list here
    } catch (error) {
      alert(
        "Error processing return: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setShowReturnModal(false);
      setReturnReason("");
      setSelectedOrderId(null);
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&family=Outfit:wght@300;400;500;600&family=Poppins:wght@400;600;700&family=Coolvetica:wght@400&display=swap"
      />
      <div className="w-full min-h-screen bg-yellow-50">
        {/* Header */}
        <Navbar />

        <div className="flex px-28 py-0 max-md:flex-col max-md:px-5 max-md:py-0">
          {/* Sidebar */}
          <div className="pt-14 w-[273px] max-md:flex max-md:flex-col max-md:items-center max-md:w-full">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center text-7xl bg-orange-200 rounded-full h-[174px] text-slate-800 w-[174px]">
                <IconUser size={70} />
              </div>
              <div className="px-12 py-2 mt-10 text-3xl rounded-xl bg-yellow-950 text-[white]">
                User Name
              </div>
            </div>
            <div className="mt-10">
              <div className="relative px-12 py-6 text-xl text-stone-700">
                Account Overview
              </div>
              <div className="relative px-12 py-6 text-xl text-stone-700">
                My Order
              </div>
              <div className="relative px-12 py-6 text-xl text-stone-700">
                Manage Addresses
              </div>
              <div className="relative px-12 py-6 text-xl text-stone-700">
                Wallet
              </div>
            </div>
            <button className="mt-10 h-11 text-xl font-bold bg-amber-500 cursor-pointer border-[none] rounded-[50px] text-[white] w-[204px]">
              Logout
            </button>
          </div>

          {/* Orders Listing */}
          <div className="flex-1 p-10 max-md:px-0 max-md:py-5">
            <div className="relative mb-10">
              <input
                type="text"
                placeholder="Search your Orders using name, Order ID, Amount"
                className="px-7 py-0 w-full text-base rounded-xl border-2 border-solid border-yellow-950 h-[49px]"
              />
              <button className="absolute top-0 right-0 h-full rounded-none bg-yellow-950 border-[none] text-[white] w-[110px]">
                Search
              </button>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                className="flex p-5 mb-5 border-4 border-orange-200 border-solid rounded-[37px] max-sm:flex-col max-sm:items-center max-sm:text-center"
              >
                <img
                  src={order.image}
                  alt={order.title}
                  className="object-cover h-52 rounded-2xl w-[135px]"
                />
                <div className="flex-1 ml-5 max-sm:mx-0 max-sm:my-5">
                  <div className="text-2xl font-semibold text-yellow-950">
                    {order.title}
                  </div>
                  <div className="mt-1.5 text-base text-yellow-950">
                    {/* You can include a short description here */}
                    A Vampire Mystery Romance
                  </div>
                  <div className="mt-1.5 text-lg text-yellow-950">
                    Lauren Jackson
                  </div>
                  <div className="mt-5 text-2xl text-lime-600">
                    {order.price}
                  </div>
                </div>
                <div className="text-right min-w-[141px] max-sm:text-center">
                  <div className="mb-1.5 text-base">
                    Status : {order.status}
                  </div>
                  <div className="mb-5 text-base text-[black]">
                    Date : {order.date}
                  </div>
                  {/* Render buttons based on order status */}
                  {(order.status === "Processing" ||
                    order.status === "Out for delivery") && (
                    <button
                      onClick={() => handleCancelClick(order.id)}
                      className="text-lg font-semibold bg-red-600 rounded-2xl cursor-pointer border-[none] h-[37px] text-[white] w-[141px]"
                    >
                      Cancel
                    </button>
                  )}
                  {order.status === "Delivered" && (
                    <button
                      onClick={() => handleReturnClick(order.id)}
                      className="text-lg font-semibold bg-cyan-600 rounded-2xl cursor-pointer border-[none] h-[37px] text-[white] w-[141px]"
                    >
                      Return
                    </button>
                  )}
                  {/* Optionally, you might have a "Review" button for returned/completed orders */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Cancel Order</h2>
              <p className="mb-2">
                Optional: Provide a reason for cancellation.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border p-2 mb-4"
                placeholder="Reason (optional)"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Close
                </button>
                <button
                  onClick={submitCancelOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Order Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Return Order</h2>
              <p className="mb-2">
                Please provide a reason for return (mandatory).
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full border p-2 mb-4"
                placeholder="Reason (required)"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Close
                </button>
                <button
                  onClick={submitReturnOrder}
                  className="px-4 py-2 bg-cyan-600 text-white rounded"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default OrdersPage;
