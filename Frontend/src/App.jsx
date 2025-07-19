// src/App.jsx
import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomAlert from "./components/common/CustomAlert";
import UserPrivateRoute from "./components/User/UserPrivateRoute";
import AdminPrivateRoute from "./components/Admin/AdminPrivateRoute";
import OrderSuccess from "./components/User/OrderSuccess";
import OrderFailure from "./components/User/OrderFailure";

// --- User Authentication ---
import Login from "./pages/User/Authentication/Login";
import Signup from "./pages/User/Authentication/Signup";
import GoogleAuthHandler from "./components/User/GoogleAuthHandler";
import OTPVerification from "./pages/User/Authentication/OTPVerification";
import ForgotPassword from "./pages/User/Authentication/ForgotPassword";
import ResetPassword from "./pages/User/Authentication/ResetPassword";

// --- User Pages ---
import Home from "./pages/User/Home";
import ProductList from "./pages/User/Product/ProductList";
import ProductDetail from "./pages/User/Product/ProductDetail";
import UserProfileDashboard from "./pages/User/Profile/UserProfileDashboard";
import UserEditProfile from "./pages/User/Profile/Profile Overview/UserEditProfile";
import UserAddresses from "./pages/User/Profile/Address/UserAddresses";
import AddEditAddress from "./pages/User/Profile/Address/AddEditAddress";
import UserOrder from "./pages/User/Profile/Order/UserOrder";
import UserWallet from "./pages/User/Profile/Wallet/UserWalletHistory";
import Cart from "./pages/User/Profile/Profile Overview/Cart";
import Checkout from "./pages/User/Profile/Profile Overview/Checkout";
import OrderDetails from "./pages/User/Profile/Order/OrderDetails";
import Wishlist from "./pages/User/Profile/Profile Overview/Wishlist";
import ReferralDashboard from "./pages/User/Profile/Profile Overview/ReferralDashboard";
// --- Admin Authentication & Dashboard ---
import AdminSignin from "./pages/Admin/AdminSignin";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// --- Admin Management Pages ---
import CategoryManagement from "./pages/Admin/CategoryManagement";
import ProductManagement from "./pages/Admin/ProductManagement";
import UserManagement from "./pages/Admin/UserManagement";
import OrderManagement from "./pages/Admin/OrderManagement";
import InventoryManagement from "./pages/Admin/InventoryManagement";
import CouponManagement from "./pages/Admin/CouponManagement";
import OfferManagement from "./pages/Admin/OfferManagement";
import ReferralManagment from "./pages/Admin/ReferralManagement";
import SalesReport from "./pages/Admin/SalesReport";

import { SearchProvider } from './context/SearchContext';
axios.defaults.withCredentials = true;

function App() {
  const location = useLocation();
  const state = location.state;
  const navigate = useNavigate();

  return (
    <SearchProvider>
      <CustomAlert />

      <Routes location={state?.backgroundLocation || location}>
        {/* --- Public User Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        {/* --- Protected User Routes --- */}
        <Route element={<UserPrivateRoute />}>
          <Route path="/profile" element={<UserProfileDashboard />} />
          <Route path="/profile/edit" element={<UserEditProfile />} />
          <Route path="/profile/addresses" element={<UserAddresses />} />
          <Route path="/profile/addresses/add" element={<AddEditAddress />} />
          <Route path="/profile/addresses/edit/:id" element={<AddEditAddress />} />
          <Route path="/profile/orders" element={<UserOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile/referrals" element={<ReferralDashboard />} />
          <Route path="/profile/wallet" element={<UserWallet />} />
          <Route path="/wishlist" element={<Wishlist />} />

          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/order-failure" element={<OrderFailure />} />
        </Route>

        {/* --- Public Admin Route --- */}
        <Route path="/admin/login" element={<AdminSignin />} />

        {/* --- Protected Admin Routes --- */}
        <Route element={<AdminPrivateRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/category-management" element={<CategoryManagement />} />
          <Route path="/admin/product-management" element={<ProductManagement />} />
          <Route path="/admin/user-management" element={<UserManagement />} />
          <Route path="/admin/order-management" element={<OrderManagement />} />
          <Route path="/admin/inventory-management" element={<InventoryManagement />} />
          <Route path="/admin/coupon-management" element={<CouponManagement />} />
          <Route path="/admin/offer-management" element={<OfferManagement />} />
          <Route path="/admin/referral-management" element={<ReferralManagment />} />
          <Route path="/admin/sales-report" element={<SalesReport />} />

        </Route>
      </Routes>

      {/* --- Modal Routes (Background Routes Handling) --- */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/signup" element={<Signup onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/login" element={<Login onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/verify-otp" element={<OTPVerification onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/forgot-password" element={<ForgotPassword onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/reset-password/:token" element={<ResetPassword onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/profile/edit" element={<UserEditProfile onClose={() => navigate(state.backgroundLocation)} />} />
        </Routes>
      )}

      <ToastContainer position="top-center" />
    </SearchProvider>
  );
}

export default App;
