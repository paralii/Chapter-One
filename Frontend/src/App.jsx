// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomAlert from "./components/common/CustomAlert";

// --- User Authentication ---
import Login from "./pages/User/Authentication/Login";
import Signup from "./pages/User/Authentication/Signup";
import GoogleAuthHandler from "./components/User/GoogleAuthHandler";
import OTPVerification from "./pages/User/Authentication/OTPVerification";
import ForgotPassword from "./pages/User/Authentication/ForgotPassword";
import ResetPassword from "./pages/User/Authentication/ResetPassword";

// --- User Pages ---
import Home from "./pages/User/Home";
import UserProfile from "./pages/User/UserProfile";
import EmailChangeOTPVerification from "./components/User/Profile/EmailchangeOTPVerification";
import ProductList from "./pages/User/Product/ProductList";
import ProductDetail from "./pages/User/Product/ProductDetail";
import CartPage from "./pages/User/Cart";
import Checkout from "./pages/User/Checkout";
import OrderSuccess from "./components/User/Order/OrderSuccess";
import ContactUs from "./pages/User/ContactUs";
import WalletHistory from "./components/User/Profile/UserWalletHistory";
import Wishlist from "./pages/User/Wishlist";
// --- Admin Authentication & Dashboard ---
import AdminSignin from "./pages/Admin/AdminSignin";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// --- Admin Management Pages ---
import CategoryManagement from "./pages/Admin/CategoryManagement";
import CouponManagement from "./pages/Admin/CouponManagement";
import InventoryManagement from "./pages/Admin/InventoryManagement";
import OfferManagement from "./pages/Admin/OfferManagement";
import OrderManagement from "./pages/Admin/OrderManagement";
import ProductManagement from "./pages/Admin/ProductManagement";
import ReferralManagement from "./pages/Admin/ReferralManagement";
import SalesReport from "./pages/Admin/SalesReport";
import UserManagement from "./pages/Admin/UserManagement";
import OrderDetails from "./pages/User/OrderDetails";


import { SearchProvider  } from './context/SearchContext';
axios.defaults.withCredentials = true;

function App() {
  return (
    <>
    <SearchProvider >
    <CustomAlert />
      <Routes>
        {/* --- Public User Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* --- Protected User Routes --- */}
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/contactus" element={<ContactUs />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/checkout" element={<Checkout />} />
        
        <Route path="/wishlist" element={<Wishlist/>} />
        <Route path="/order-details" element={<OrderDetails />} />
        <Route path="/confirm-email-change" element={<EmailChangeOTPVerification />} />
        <Route path="/wallet" element={<WalletHistory />} />

        {/* --- Admin Public Route --- */}
        <Route path="/admin/login" element={<AdminSignin />} />

        {/* --- Admin Protected Routes --- */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/category-management" element={<CategoryManagement />} />
        <Route path="/admin/coupon-management" element={<CouponManagement />} />
        <Route path="/admin/inventory-management" element={<InventoryManagement />} />
        <Route path="/admin/offer-management" element={<OfferManagement />} />
        <Route path="/admin/order-management" element={<OrderManagement />} />
        <Route path="/admin/product-management" element={<ProductManagement />} />
        <Route path="/admin/referral-management" element={<ReferralManagement />} />
        <Route path="/admin/sales-report" element={<SalesReport />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
      </Routes>
      <ToastContainer position="top-center"/>
    </SearchProvider >
    </>
  );
}

export default App;
