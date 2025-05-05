"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";

function OfferManagement() {
  const [activeTab, setActiveTab] = useState("product");
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const navigate = useNavigate();

  const renderView = () => {
    if (activeView === "dashboard") {
      return activeTab === "product" ? (
        <ProductOfferDashboard onEdit={(id) => {
          setSelectedOfferId(id);
          setActiveView("edit");
        }} />
      ) : (
        <CategoryOfferDashboard onEdit={(id) => {
          setSelectedOfferId(id);
          setActiveView("edit");
        }} />
      );
    }
  };

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-5 sm:p-10">
        <div className="flex gap-4 mb-5">
          <button onClick={() => { setActiveTab("product"); setActiveView("dashboard"); }}
            className={`px-4 py-2 rounded ${activeTab === "product" ? "bg-[#654321] text-white" : "bg-gray-200 text-black"}`}>
            Product Offers
          </button>
          <button onClick={() => { setActiveTab("category"); setActiveView("dashboard"); }}
            className={`px-4 py-2 rounded ${activeTab === "category" ? "bg-[#654321] text-white" : "bg-gray-200 text-black"}`}>
            Category Offers
          </button>
        </div>
        {renderView()}
      </div>
    </div>
  );
}

function ProductOfferDashboard({ onEdit }) {
  const dummyOffers = [
    { _id: "1", bookTitle: "The Great Gatsby", discount: 15, expiryDate: "2025-12-31" },
    { _id: "2", bookTitle: "To Kill a Mockingbird", discount: 20, expiryDate: "2025-11-30" },
    { _id: "3", bookTitle: "1984", discount: 10, expiryDate: "2026-01-15" },
    { _id: "4", bookTitle: "Moby-Dick", discount: 25, expiryDate: "2025-10-20" }
  ];
  

  return (
    <div>
      <PageHeader title="Product Offers" />
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th>Offer ID</th><th>Product</th><th>Discount (%)</th><th>Expiry Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dummyOffers.map((offer) => (
            <tr key={offer._id}>
              <td>{offer._id}</td>
              <td>{offer.bookTitle}</td>
              <td>{offer.discount}</td>
              <td>{offer.expiryDate}</td>
              <td>
                <button onClick={() => onEdit(offer._id)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryOfferDashboard({ onEdit }) {
const dummyOffers = [
  { _id: "1", categoryName: "Fiction", discount: 15, expiryDate: "2025-12-31" },
  { _id: "2", categoryName: "Non-Fiction", discount: 25, expiryDate: "2025-11-30" },
  { _id: "3", categoryName: "Mystery & Thriller", discount: 20, expiryDate: "2026-01-15" },
  { _id: "4", categoryName: "Science Fiction", discount: 10, expiryDate: "2025-10-20" }
];

  return (
    <div>
      <PageHeader title="Category Offers" />
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th>Offer ID</th><th>Category</th><th>Discount (%)</th><th>Expiry Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dummyOffers.map((offer) => (
            <tr key={offer._id}>
              <td>{offer._id}</td>
              <td>{offer.categoryName}</td>
              <td>{offer.discount}</td>
              <td>{offer.expiryDate}</td>
              <td>
                <button onClick={() => onEdit(offer._id)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OfferManagement;