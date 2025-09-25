"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import userAxios from "../../../api/userAxios"
import { showAlert } from "../../../redux/alertSlice" 
import UserProfileDashboard from "../Profile/UserProfileDashboard";

const UserAddresses = () => {
  const [addresses, setAddresses] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await userAxios.get("/addresses")
      setAddresses(res.data.addresses)
    } catch (err) {
      setError("Failed to fetch addresses.")
      dispatch(showAlert({ message: "Failed to fetch addresses.", type: "error" }))
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const handleDelete = async (addressId) => {
    try {
      await userAxios.delete(`/addresses/${addressId}`)
      fetchAddresses()
      dispatch(showAlert({ message: "Address deleted successfully!", type: "success" }))
    } catch {
      setError("Failed to delete address.")
      dispatch(showAlert({ message: "Failed to delete address.", type: "error" }))
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      await userAxios.put(`/addresses/default/${addressId}`)
      fetchAddresses()
      dispatch(showAlert({ message: "Address set as default!", type: "success" }))
    } catch {
      setError("Failed to set default address.")
      dispatch(showAlert({ message: "Failed to set default address.", type: "error" }))
    }
  }

  return (
  <div className="relative min-h-screen">
    {/* Blurred dashboard background */}
    <div className="absolute inset-0 blur-sm brightness-50 pointer-events-none">
      <UserProfileDashboard />
    </div>

    {/* Dark overlay */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

    {/* Modal content */}
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xs sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl bg-white rounded-2xl shadow-xl border border-[#3c2712]/10 flex flex-col max-h-[90vh] overflow-y-auto p-6 relative">

        <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-[#3c2712]">
            Manage Addresses
          </h2>

          <button
            onClick={() => navigate("/profile")}
            className="text-xs sm:text-sm text-[#3c2712] hover:text-[#5a3a1a] hover:underline font-medium transition-colors duration-200"
          >
            ← Back to Profile
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Empty State */}
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#3c2712]/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#3c2712]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p className="text-[#3c2712]/70 text-sm sm:text-base lg:text-lg text-center max-w-xs sm:max-w-sm">
              You don't have any addresses saved yet.
            </p>
            <p className="text-[#3c2712]/50 text-xs sm:text-sm mt-2 text-center">
              Add your first address to get started
            </p>

            {/* Add Address button for empty state */}
            <button
              onClick={() => navigate("/profile/addresses/add")}
              className="mt-4 bg-[#3c2712] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-[#5a3a1a] hover:shadow-md transition-all duration-300"
            >
              + Add Address
            </button>
          </div>
        ) : (
          <>
          {addresses.length > 0 && (
            <button
              onClick={() => navigate("/profile/addresses/add")}
              className="bg-[#3c2712] text-white  my-2 py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-[#5a3a1a] hover:shadow-md transition-all duration-300"
            >
              + Add Address
            </button>
          )}
            {/* Addresses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="bg-white border border-[#3c2712]/10 p-3 sm:p-4 lg:p-5 rounded-xl shadow-sm hover:shadow-lg hover:shadow-[#3c2712]/10 transition-all duration-300 hover:scale-[1.02] relative group"
                >
                  {addr.isDefault && (
                    <div className="absolute -top-2 -right-2 bg-[#4caf50] text-white text-xs px-2 py-1 rounded-full shadow-md">
                      <span className="hidden sm:inline">Default</span>
                      <span className="sm:hidden">★</span>
                    </div>
                  )}

                  <div className="text-[#3c2712] space-y-1 sm:space-y-2">
                    <p className="font-bold text-sm sm:text-base lg:text-lg mb-2">{addr.name}</p>
                    <p className="text-xs sm:text-sm text-[#3c2712]/80 font-medium">{addr.phone}</p>
                    <p className="text-xs sm:text-sm text-[#3c2712]/70">{addr.place}</p>
                    <p className="text-xs sm:text-sm text-[#3c2712]/70 leading-relaxed">
                      {addr.city}, {addr.district}
                    </p>
                    <p className="text-xs sm:text-sm text-[#3c2712]/70">
                      {addr.state}, {addr.country} - {addr.pin}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button
                      className="text-xs sm:text-sm text-[#3c2712] hover:text-[#5a3a1a] hover:underline font-medium transition-colors duration-200"
                      onClick={() => navigate(`/profile/addresses/edit/${addr._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs sm:text-sm text-red-500 hover:text-red-700 hover:underline font-medium transition-colors duration-200"
                      onClick={() => handleDelete(addr._id)}
                    >
                      Delete
                    </button>
                    {!addr.isDefault && (
                      <button
                        className="bg-[#3c2712] text-white py-1 sm:py-2 px-2 sm:px-3 lg:px-4 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#5a3a1a] transition-all duration-300 hover:shadow-md"
                        onClick={() => handleSetDefault(addr._id)}
                      >
                        <span className="hidden sm:inline">Set as Default</span>
                        <span className="sm:hidden">Default</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

};

export default UserAddresses
