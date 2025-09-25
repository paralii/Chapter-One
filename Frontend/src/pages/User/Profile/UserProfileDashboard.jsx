"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"

import { toast } from "react-toastify"

import { getUserProfile } from "../../../api/user/UserAPI"
import { getAllUserAddresses } from "../../../api/user/addressAPI"
import { getWallet } from "../../../api/user/walletAPI"
import { getUserOrders } from "../../../api/user/orderAPI"
import { logoutUser } from "../../../redux/authSlice"

import BookLoader from "../../../components/common/BookLoader"
import Footer from "../../../components/common/Footer"
import Navbar from "../../../components/common/Navbar"

const UserProfileDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [user, setUser] = useState(null)
  const [defaultAddress, setDefaultAddress] = useState(null)
  const [latestOrder, setLatestOrder] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)

  useEffect(() => {
    getUserProfile()
      .then((response) => {
        setUser(response.data.user)
      })
      .catch((error) => {
        console.error("Failed to fetch user profile", error)
      })

    getAllUserAddresses()
      .then((response) => {
        const addresses = response.data.addresses
        const defaultAddr = addresses.find((address) => address.isDefault)
        setDefaultAddress(defaultAddr)
      })
      .catch((error) => {
        console.error("Failed to fetch addresses", error)
      })

    getUserOrders()
    .then((response) => {
      const orders = response.data.orders;
      if (orders && orders.length > 0) {
        setLatestOrder(orders[0]);
      }
    })
    .catch((error) => {
      console.error("Failed to fetch latest order", error);
    });

    getWallet()
      .then((response) => {
        setWalletBalance(response.data.balance)
      })
      .catch((error) => {
        console.error("Failed to fetch wallet balance", error)
      })
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"))
  }

  const shareToWhatsApp = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user.referral_code}`
    const text = `Join now and get 10% off with my referral link: ${referralLink}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleLogout = () => {
    dispatch(logoutUser())
      .then(() => {
        navigate("/")
        toast.success("Logged out successfully!")
      })
      .catch((error) => {
        console.error("Logout failed", error)
      })
  }

  if (!user) return <BookLoader />

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#fff8e5] py-4 px-3 sm:py-6 sm:px-4 md:py-8 md:px-6 lg:py-12 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Profile Image */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-4 ring-[#3c2712]/10">
                <img
                  src={
                    user.profileImage ||
                    "https://res.cloudinary.com/chapter-one/image/upload/v1746419585/uploads/niizxavwwvje8ji82hmi.jpg" ||
                    "/placeholder.svg"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#3c2712] mb-1">
                  {user.firstname} {user.lastname}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600">{user.email}</p>
              </div>

              {/* Edit Profile Link */}
              <Link
                to="/profile/edit"
                className="px-4 py-2 sm:px-6 sm:py-3 bg-[#3c2712] text-white rounded-xl text-sm sm:text-base font-medium hover:bg-[#2a1b0c] transition-all duration-200"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Wallet Card */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#3c2712]">Wallet</h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#4caf50]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#4caf50] text-lg sm:text-xl">₹</span>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#4caf50] mb-2">₹{walletBalance || 0}</p>
              <Link to="/profile/wallet" className="text-xs sm:text-sm text-[#3c2712] hover:text-[#2a1b0c] font-medium">
                View History →
              </Link>
            </div>

            {/* Orders Card */}
<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#3c2712]">Orders</h3>
    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#3c2712]/10 rounded-full flex items-center justify-center">
      <span className="text-[#3c2712] text-sm sm:text-base">📦</span>
    </div>
  </div>

  {latestOrder ? (
    <div>
      <p className="text-sm sm:text-base font-medium text-gray-800 mb-1">
        Status: <span className="text-[#4caf50]">{latestOrder.status}</span>
      </p>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">
        {latestOrder.items.length} item(s)
      </p>
    </div>
  ) : (
    <p className="text-sm sm:text-base text-gray-600 mb-2">No orders yet</p>
  )}

  <Link
    to="/profile/orders"
    className="text-xs sm:text-sm text-[#3c2712] hover:text-[#2a1b0c] font-medium"
  >
    View All →
  </Link>
</div>


            {/* Address Card */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200 md:col-span-2 xl:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#3c2712]">Address</h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#3c2712]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#3c2712] text-sm sm:text-base">📍</span>
                </div>
              </div>
              {defaultAddress ? (
                <p className="text-sm sm:text-base text-gray-700 mb-2 line-clamp-2">
                  {defaultAddress.name}, {defaultAddress.place}, {defaultAddress.city}, {defaultAddress.state} -{" "}
                  {defaultAddress.pin}
                </p>
              ) : (
                <p className="text-sm sm:text-base text-gray-600 mb-2">No default address set</p>
              )}
              <Link
                to="/profile/addresses"
                className="text-xs sm:text-sm text-[#3c2712] hover:text-[#2a1b0c] font-medium"
              >
                Manage Addresses →
              </Link>
            </div>
          </div>

          {/* Referral Section */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#3c2712] mb-4 sm:mb-6">
              Referral Program
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Referral Code Input */}
              <div className="flex-1 flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={user.referral_code}
                  readOnly
                  className="flex-1 h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-5 rounded-xl sm:rounded-2xl bg-[#edece9] outline-none text-sm sm:text-base font-medium"
                />
                <button
                  onClick={() => copyToClipboard(user.referral_code)}
                  className="h-10 sm:h-12 md:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-[#3c2712] text-white text-sm sm:text-base font-semibold hover:bg-[#4d321b] transition-all duration-200"
                >
                  Copy
                </button>
              </div>

              {/* WhatsApp Share Button */}
              <button
                onClick={shareToWhatsApp}
                className="h-10 sm:h-12 md:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-[#4caf50] text-white text-sm sm:text-base font-semibold hover:bg-[#45a049] transition-all duration-200"
              >
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleLogout}
              className="flex-1 h-14 sm:h-16 bg-[#f4a261] text-white font-semibold rounded-xl sm:rounded-2xl hover:bg-[#e76f51] transition-all duration-200 text-base sm:text-lg"
            >
              Logout
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex-1 h-14 sm:h-16 bg-white border-2 border-[#3c2712] text-[#3c2712] font-semibold rounded-xl sm:rounded-2xl hover:bg-[#3c2712] hover:text-white transition-all duration-200 text-base sm:text-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default UserProfileDashboard
