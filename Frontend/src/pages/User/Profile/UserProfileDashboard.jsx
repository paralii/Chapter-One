import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import { useDispatch } from "react-redux";
import { getUserProfile } from "../../../api/user/UserAPI";
import { getAddresses } from "../../../api/user/addressAPI";
import { getWallet } from "../../../api/user/walletAPI";
import { getOrderDetails } from "../../../api/user/orderAPI";
import { logoutUser } from "../../../redux/authSlice";
import BookLoader from "../../../components/common/BookLoader";
import { toast } from "react-toastify";
const UserProfileDashboard = () => {
  const [user, setUser] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    getUserProfile()
      .then((response) => {
        setUser(response.data.user);
      })
      .catch((error) => {
        console.error("Failed to fetch user profile", error);
      });

    getAddresses()
      .then((response) => {
        const addresses = response.data.addresses;
        const defaultAddr = addresses.find((address) => address.isDefault);
        setDefaultAddress(defaultAddr);
      })
      .catch((error) => {
        console.error("Failed to fetch addresses", error);
      });

      getOrderDetails()
      .then((response) => {
        const latestOrder = response.data.orders[0]; 
        setLatestOrder(latestOrder);
      })
      .catch((error) => {
        console.error("Failed to fetch latest order", error);
      });

    // getWallet()
    // .then((response) => {
    //   setWalletBalance(response.data.balance);
    // })
    // .catch((error) => {
    //   console.error("Failed to fetch wallet balance", error);
    // });
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser())
      .then(() => {
        navigate("/");
        toast.success("Logged out successfully!");
      })
      .catch((error) => {
        console.error("Logout failed", error);
      });
  };

  
  if (!user) return <BookLoader />;

  return (
    <>
      <div className="min-h-screen bg-[#fff8e5] py-6 px-6">
          <div
            className="logo font-[Outfit] text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#696969] cursor-pointer flex justify-center"
            onClick={() => navigate("/")}
          >
            CHAPTER ONE
          </div>
        <div className="w-full">
        </div>
        <div className="bg-white shadow-xl rounded-xl w-full max-w-5xl p-8 mt-8 mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between mb-8">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="flex items-center justify-center mb-4 lg:mb-0">
                {/* Profile Image */}
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img
                    src={
                      user.profileImage ||
                      "https://res.cloudinary.com/chapter-one/image/upload/v1746419585/uploads/niizxavwwvje8ji82hmi.jpg"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="ml-0 lg:ml-6 text-center lg:text-left">
                <h2 className="text-3xl font-semibold text-[#3c2712]">
                  {user.firstname} {user.lastname}
                </h2>
                <p className="text-gray-700">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 lg:mt-0">
              <Link
                to="/profile/edit"
                className="text-[#3c2712] hover:text-[#2a1b0c] text-lg"
              >
                Edit Profile
              </Link>
            </div>
          </div>
  
          {/* Address Section */}
          <div className="flex justify-between mb-8">
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl font-semibold mb-3 text-[#3c2712]">Your Address</h3>
              <div className="text-gray-700 text-lg">
                {defaultAddress ? (
                  <p>
                    You’re all set! Here’s your current address: <br />
                    {defaultAddress.name}, {defaultAddress.place}, {defaultAddress.city}, {defaultAddress.state}, {defaultAddress.country} - {defaultAddress.pin}
                  </p>
                ) : (
                  <p>No default address set yet. Let’s add one!</p>
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/2 text-right mt-4 lg:mt-0">
              <Link
                to="/profile/addresses"
                className="text-[#3c2712] hover:text-[#2a1b0c] text-lg"
              >
                Manage Addresses
              </Link>
            </div>
          </div>
  
          {/* Wallet Section */}
          <div className="flex justify-between mb-8">
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl font-semibold mb-3 text-[#3c2712]">Your Wallet</h3>
              <div className="text-gray-700 text-lg">
                <p>Here’s what you have in your wallet: <strong>${walletBalance}</strong></p>
              </div>
            </div>
            <div className="w-full lg:w-1/2 text-right mt-4 lg:mt-0">
              <Link
                to="/profile/wallet"
                className="text-[#3c2712] hover:text-[#2a1b0c] text-lg"
              >
                View Wallet History
              </Link>
            </div>
          </div>
  
          {/* Order History Section */}
          <div className="flex justify-between mb-8">
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl font-semibold mb-3 text-[#3c2712]">Your Latest Order</h3>
              {latestOrder ? (
                <p>
                  Latest Order Status: {latestOrder.status} <br />
                  Order Details: {latestOrder.items.map((item, index) => (
                    <span key={index}>{item.name} ({item.quantity}) </span>
                  ))}
                </p>
              ) : (
                <p>No orders placed yet. Go ahead and place one!</p>
              )}
            </div>
            <div className="w-full lg:w-1/2 text-right mt-4 lg:mt-0">
              <Link
                to="/profile/orders"
                className="text-[#3c2712] hover:text-[#2a1b0c] text-lg"
              >
                View Orders
              </Link>
            </div>
          </div>
          <Link to="/profile/referrals" className="block py-3 px-4 text-[#8e4700] hover:bg-[#edece9]">
  Referral Program
</Link>
          {/* Logout Button */}
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full bg-[#f4a261] text-white font-semibold py-2 px-4 rounded hover:bg-[#e76f51] transition-all"
            >
              Logout
            </button>
          </div>
                    <div
            className="mt-3 text-[#696969] cursor-pointer flex justify-center"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
  
  
};

export default UserProfileDashboard;
