import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

import { registerSocket } from "./utils/socketClient";
import { SearchProvider } from './context/SearchContext';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
axios.defaults.withCredentials = true;


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
import UserEditProfile from "./pages/User/Profile/UserEditProfile";
import UserAddresses from "./pages/User/Address/UserAddresses";
import UserOrder from "./pages/User/Order/UserOrder";
import UserWallet from "./pages/User/Wallet/UserWalletHistory";
import Cart from "./pages/User/Flow/Cart";
import Checkout from "./pages/User/Flow/Checkout";
import OrderDetails from "./pages/User/Order/OrderDetails";
import Wishlist from "./pages/User/Flow/Wishlist";
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
import SalesReport from "./pages/Admin/SalesReport";

// --- Component pages ---
import CustomAlert from "./components/common/CustomAlert";
import OrderSuccess from "./components/User/OrderSuccess";
import OrderFailure from "./components/User/OrderFailure";

// --- Private route HOC ---
import withUserAuth from "./hoc/withUserAuth";
import withAdminAuth from "./hoc/withAdminAuth";

const ProtectedUserProfileDashboard = withUserAuth(UserProfileDashboard);
const ProtectedUserEditProfile = withUserAuth(UserEditProfile);
const ProtectedUserAddresses = withUserAuth(UserAddresses);
const ProtectedUserWallet = withUserAuth(UserWallet);
const ProtectedCart = withUserAuth(Cart);
const ProtectedCheckout = withUserAuth(Checkout);
const ProtectedOrderDetails = withUserAuth(OrderDetails);
const ProtectedOrder = withUserAuth(UserOrder);
const ProtectedWishlist = withUserAuth(Wishlist);
const ProtectedOrderSuccess = withUserAuth(OrderSuccess);
const ProtectedOrderFailure = withUserAuth(OrderFailure);

const ProtectedAdminDashboard = withAdminAuth(AdminDashboard);
const ProtectedCategoryManagement = withAdminAuth(CategoryManagement);
const ProtectedProductManagement = withAdminAuth(ProductManagement);
const ProtectedUserManagement = withAdminAuth(UserManagement);
const ProtectedOrderManagement = withAdminAuth(OrderManagement);
const ProtectedInventoryManagement = withAdminAuth(InventoryManagement);
const ProtectedCouponManagement = withAdminAuth(CouponManagement);
const ProtectedOfferManagement = withAdminAuth(OfferManagement);
const ProtectedSalesReport = withAdminAuth(SalesReport);

function App() {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation(); 
  const state = location.state;
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      registerSocket(user._id);
    }
  }, [user?._id]);

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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        {/* --- Protected User Routes --- */}
        <Route path="/profile" element={<ProtectedUserProfileDashboard />} />
        <Route path="/profile/edit" element={<ProtectedUserEditProfile />} />
        <Route path="/profile/addresses" element={<ProtectedUserAddresses />} />
        <Route path="/profile/wallet" element={<ProtectedUserWallet />} />
        <Route path="/cart" element={<ProtectedCart />} />
        <Route path="/checkout" element={<ProtectedCheckout />} />
        <Route path="/orders/:id" element={<ProtectedOrderDetails />} />
        <Route path="/profile/orders" element={<ProtectedOrder />} />
        <Route path="/wishlist" element={<ProtectedWishlist />} />
        <Route path="/order-success" element={<ProtectedOrderSuccess />} />
        <Route path="/order-failure" element={<ProtectedOrderFailure />} />

        {/* --- Public Admin Route --- */}
        <Route path="/admin/login" element={<AdminSignin />} />

        {/* --- Protected Admin Routes --- */}
        <Route path="/admin/dashboard" element={<ProtectedAdminDashboard />} />
        <Route path="/admin/category-management" element={<ProtectedCategoryManagement />} />
        <Route path="/admin/product-management" element={<ProtectedProductManagement />} />
        <Route path="/admin/user-management" element={<ProtectedUserManagement />} />
        <Route path="/admin/order-management" element={<ProtectedOrderManagement />} />
        <Route path="/admin/inventory-management" element={<ProtectedInventoryManagement />} />
        <Route path="/admin/coupon-management" element={<ProtectedCouponManagement />} />
        <Route path="/admin/offer-management" element={<ProtectedOfferManagement />} />
        <Route path="/admin/sales-report" element={<ProtectedSalesReport />} />
      </Routes>

      {/* --- Modal Routes (Background Routes Handling) --- */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/signup" element={<Signup onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/login" element={<Login onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/verify-otp" element={<OTPVerification onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/forgot-password" element={<ForgotPassword onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/reset-password" element={<ResetPassword onClose={() => navigate(state.backgroundLocation)} />} />
          <Route path="/profile/edit" element={<UserEditProfile onClose={() => navigate(state.backgroundLocation)} />} />
        </Routes>
      )}

      <ToastContainer position="top-center" />
    </SearchProvider>
  );
}

export default App;
