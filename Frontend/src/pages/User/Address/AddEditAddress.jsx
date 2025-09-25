"use client"

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useDispatch } from "react-redux" // Import dispatch
import userAxios from "../../../api/userAxios"
import { showAlert } from "../../../redux/alertSlice" // Import your showAlert action
import UserProfileDashboard from "../Profile/UserProfileDashboard"

const AddEditAddress = () => {
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    place: "",
    city: "",
    district: "",
    state: "",
    country: "",
    pin: "",
    isDefault: false,
  })

  const [error, setError] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const dispatch = useDispatch() // Initialize dispatch

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  useEffect(() => {
    if (isEditing) {
      const fetchAddress = async () => {
        try {
          const res = await userAxios.get(`/addresses/${id}`)
          setAddress(res.data.address)
        } catch {
          dispatch(showAlert({ message: "Failed to fetch address details.", type: "error" }))
        }
      }
      fetchAddress()
    }
  }, [id, dispatch])

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await userAxios.put(`/addresses/${id}`, address)
      } else {
        await userAxios.post("/addresses", address)
      }
      dispatch(showAlert({ message: `Address ${isEditing ? "updated" : "added"} successfully!`, type: "success" }))
      navigate("/profile/addresses")
    } catch (error) {
      if (error.response && error.response.data.errors) {
        const errorMessages = error.response.data.errors.map((err) => err.msg)
        setError(errorMessages.join(", "))
      } else {
        setError("Failed to save address.")
      }
      dispatch(showAlert({ message: "Failed to save address.", type: "error" }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      {/* Blurred dashboard background */}
      <div className="absolute inset-0 blur-sm brightness-50 pointer-events-none">
        <UserProfileDashboard />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative bg-white shadow-xl p-4 sm:p-6 lg:p-8 rounded-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl border border-[#3c2712]/10 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
    <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-[#3c2712]">
      {isEditing ? "Edit Address" : "Add Address"}
    </h2>

    <button
      onClick={() => navigate("/profile/addresses")}
      className="text-xs sm:text-sm text-[#3c2712] hover:text-[#5a3a1a] hover:underline font-medium transition-colors duration-200"
    >
      ← Cancel
    </button>
  </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={address.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
            />
            <p className="text-xs text-[#3c2712]/60 mt-1">
              Use your full legal name as it appears on official documents
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={address.phone}
              onChange={handleChange}
              placeholder="+971 50 123 4567"
              className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
            />
            {/* <p className="text-xs text-[#3c2712]/60 mt-1">Include country code for international numbers</p> */}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">Street</label>
            <input
              type="text"
              name="place"
              value={address.place}
              onChange={handleChange}
              placeholder="123 Main Street, Apt 4B"
              className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
            />
            <p className="text-xs text-[#3c2712]/60 mt-1">
              Include house number, street name, and apartment/unit if applicable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">City</label>
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={handleChange}
                placeholder="Bur-Dubai"
                className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
              />
              <p className="text-xs text-[#3c2712]/60 mt-1">Enter the city name</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">District</label>
              <input
                type="text"
                name="district"
                value={address.district}
                onChange={handleChange}
                placeholder="Jumeirah"
                className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
              />
              <p className="text-xs text-[#3c2712]/60 mt-1">District, borough, or county</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">State</label>
              <input
                type="text"
                name="state"
                value={address.state}
                onChange={handleChange}
                placeholder="Dubai"
                className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
              />
              <p className="text-xs text-[#3c2712]/60 mt-1">State, province, or region</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">Zip Code</label>
              <input
                type="text"
                name="pin"
                value={address.pin}
                onChange={handleChange}
                placeholder="00000"
                className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
              />
              <p className="text-xs text-[#3c2712]/60 mt-1">Postal code without spaces or dashes</p>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3c2712] mb-1 sm:mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={address.country}
              onChange={handleChange}
              placeholder="United Arab Emirates"
              className="w-full p-2 border border-[#3c2712]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c2712] focus:border-[#3c2712] text-sm sm:text-base transition-all duration-200 bg-[#fff8e5]/30"
            />
            <p className="text-xs text-[#3c2712]/60 mt-1">Enter the full country name</p>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-[#fff8e5]/50 rounded-lg border border-[#3c2712]/10">
            <input
              type="checkbox"
              name="isDefault"
              checked={address.isDefault}
              onChange={() => setAddress({ ...address, isDefault: !address.isDefault })}
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#3c2712] border-[#3c2712]/30 rounded focus:ring-[#3c2712] focus:ring-2"
            />
            <label className="text-xs sm:text-sm text-[#3c2712] font-medium">Set as Default Address</label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#3c2712] hover:bg-[#5a3a1a] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isEditing ? "Update Address" : "Add Address"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile/addresses")}
              className="flex-1 sm:flex-none sm:px-8 bg-white border-2 border-[#3c2712] text-[#3c2712] hover:bg-[#3c2712] hover:text-white py-2 sm:py-3 px-4  rounded-lg transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEditAddress
