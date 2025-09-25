"use client"

import { useState, useEffect } from "react"
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  requestEmailChange,
  confirmEmailChange,
  changeUserPassword,
} from "../../../api/user/UserAPI"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { showAlert } from "../../../redux/alertSlice.js"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "react-toastify"
import UserProfileDashboard from "./UserProfileDashboard"
import Collapse from "@mui/material/Collapse";

const UserEditProfile = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    profileImage: "",
  })
  const [originalEmail, setOriginalEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [file, setFile] = useState(null)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState({
    sendOtp: false,
    verifyOtp: false,
    updateProfile: false,
  })

  useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "auto";
  };
}, []);


  useEffect(() => {
    getUserProfile()
      .then((res) => {
        setForm(res.data.user)
        setOriginalEmail(res.data.user.email)
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err)
        dispatch(
          showAlert({
            message: "Failed to fetch user profile. Please try again.",
            type: "error",
          }),
        )
      })
  }, [])
  useEffect(() => {
    if (location.state?.emailChanged && location.state?.newEmail) {
      setForm((prev) => ({ ...prev, email: location.state.newEmail }))
      navigate("/profile/edit", { replace: true })
      toast.success("Email changed successfully!")
    }
  }, [location, navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSendOtp = async () => {
    setLoading((prev) => ({ ...prev, sendOtp: true }))
    if (form.email === originalEmail) {
      dispatch(
        showAlert({
          message: "Email is the same as the original email. No need to send OTP.",
          type: "info",
        }),
      )
      return
    }
    if (!form.email) {
      dispatch(
        showAlert({
          message: "Please enter a new email address.",
          type: "info",
        }),
      )
      return
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      dispatch(
        showAlert({
          message: "Please enter a valid email address.",
          type: "info",
        }),
      )
      return
    }

    requestEmailChange(form.email)
      .then(() => {
        setOtpSent(true)
        dispatch(
          showAlert({
            message: "OTP sent to your new email address. Please check your inbox.",
            type: "success",
          }),
        )
      })
      .catch((err) => {
        console.error("Error sending OTP:", err)
        dispatch(
          showAlert({
            message: "Failed to send OTP. Please try again.",
            type: "error",
          }),
        )
      })
    setLoading((prev) => ({ ...prev, sendOtp: false }))
  }

  const handleVerifyOtp = async () => {
    setLoading((prev) => ({ ...prev, verifyOtp: true }))
    confirmEmailChange({ otp, newEmail: form.email })
      .then(() => {
        dispatch(showAlert({ message: "Email updated successfully!", type: "success" }))
        setOtpSent(false)
        setOriginalEmail(form.email)
        navigate("/profile")
      })
      .catch((err) => {
        console.error("Error verifying OTP:", err)
        dispatch(
          showAlert({
            message: "Failed to verify OTP. Please try again.",
            type: "error",
          }),
        )
      })
    setLoading((prev) => ({ ...prev, verifyOtp: false }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, updateProfile: true }))
    try {
      getUserProfile({
        firstname: form.firstname,
        lastname: form.lastname,
      })

      if (showPasswordFields && passwordForm.oldPassword && passwordForm.newPassword) {
        if (passwordForm.oldPassword === passwordForm.newPassword) {
          setPasswordError("New password cannot be same as old.")
          return
        }
        try {
          await changeUserPassword(passwordForm.oldPassword, passwordForm.newPassword)
        } catch (err) {
          console.error("Password update failed:", err)
          dispatch(
            showAlert({
              message: "Failed to update password. Check your current password.",
              type: "error",
            }),
          )
          return
        }
      }

      if (form.email !== originalEmail) {
        try {
          const res = await requestEmailChange(form.email)
          const token = res.data.emailChangeToken

          localStorage.setItem("otpToken", token)
          return
        } catch (err) {
          toast.error(err.message || "Failed to initiate email change verification.")
          return
        } finally {
          setLoading((prev) => ({ ...prev, updateProfile: false }))
        }
      }

      if (file) {
        const formData = new FormData()
        formData.append("profileImage", file)
        await uploadProfileImage(formData)
      } else {
        await updateUserProfile({
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
        })
      }

      dispatch(showAlert({ message: "Profile updated successfully!", type: "success" }))
      navigate("/profile")
    } catch (err) {
      console.error("Error updating profile:", err)
      dispatch(
        showAlert({
          message: "Failed to update profile. Please try again.",
          type: "error",
        }),
      )
    }
  }

  const handleCancel = () => navigate("/profile")

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setForm({ ...form, profileImage: URL.createObjectURL(selectedFile) })
  }

  const inputClass = "w-full h-[45px] sm:h-[50px] md:h-[55px] px-4 sm:px-5 rounded-[15px] sm:rounded-[20px] bg-[#edece9] outline-none text-sm sm:text-[16px]"
const buttonClass = "w-full h-[45px] sm:h-[50px] md:h-[55px] rounded-[15px] sm:rounded-[20px] text-sm sm:text-base font-Outfit disabled:opacity-60"

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 blur-sm brightness-50 pointer-events-none">
        <UserProfileDashboard />
      </div>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
          
          <h2 className="text-2xl font-bold text-center text-[#3c2712] mb-6 font-Outfit">Edit Profile</h2>

          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#f4a261]">
              <img src={form.profileImage || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="text-center mb-4">
            <label htmlFor="profileImage" className="cursor-pointer text-[#8e4700] hover:underline text-sm">Change Profile Picture</label>
            <input type="file" id="profileImage" className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4 font-Inter flex-grow">
            <input type="text" name="firstname" value={form.firstname} onChange={handleChange} className={inputClass} placeholder="First Name" />
            <input type="text" name="lastname" value={form.lastname} onChange={handleChange} className={inputClass} placeholder="Last Name" />

            <div className="relative">
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="Email" readOnly={form.email === originalEmail && !otpSent} />
              {form.email === originalEmail && !otpSent && (
                <button type="button" onClick={() => setForm({ ...form, email: "" })} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8e4700] text-sm font-medium">
                  Edit
                </button>
              )}
            </div>
            {form.email !== originalEmail && !otpSent && (
              <p className="text-xs text-yellow-600">An OTP will be sent to this new email for verification.</p>
            )}

            <div>
              <button type="button" onClick={() => setShowPasswordFields(!showPasswordFields)} className="text-sm text-[#8e4700] hover:underline">
                {showPasswordFields ? "Hide Change Password" : "Change Password"}
              </button>
            </div>

            {/* Collapse for Change Password */}
            <Collapse in={showPasswordFields} timeout="auto" unmountOnExit>
              <div className="space-y-3 mt-3">
                <div className="relative">
                  <input type={showOldPassword ? "text" : "password"} name="oldPassword" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} placeholder="Old Password" className={inputClass + " pr-10"} />
                  <span onClick={() => setShowOldPassword(prev => !prev)} className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600">
                    {showOldPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </span>
                </div>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} name="newPassword" value={passwordForm.newPassword} onChange={(e) => {
                    const val = e.target.value;
                    setPasswordForm({...passwordForm, newPassword: val});
                    setPasswordError(val === passwordForm.oldPassword ? "New password cannot be same as old." : "");
                  }} placeholder="New Password" className={inputClass + " pr-10"} />
                  <span onClick={() => setShowNewPassword(prev => !prev)} className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600">
                    {showNewPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </span>
                </div>
                {passwordError && <p className="text-red-600 text-xs">{passwordError}</p>}
              </div>
            </Collapse>

            {/* Collapse for Send OTP */}
            <Collapse in={form.email !== originalEmail && !otpSent} timeout="auto" unmountOnExit>
              <button type="button" onClick={handleSendOtp} className={buttonClass + " bg-[#3c2712] text-white mt-3"} disabled={loading.sendOtp}>
                {loading.sendOtp ? "Sending OTP..." : "Send OTP to New Email"}
              </button>
            </Collapse>

            {/* Collapse for Verify OTP */}
            <Collapse in={otpSent} timeout="auto" unmountOnExit>
              <div className="space-y-3 mt-3">
                <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className={inputClass} />
                <button type="button" onClick={handleVerifyOtp} className={buttonClass + " bg-green-600 text-white"} disabled={loading.verifyOtp}>
                  {loading.verifyOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </Collapse>

            {/* Always Visible Buttons */}
            <div className="flex flex-col xs:flex-row gap-3 mt-4">
              <button type="submit" className={buttonClass + " bg-[#f4a261] text-white hover:bg-[#e76f51]"} disabled={loading.updateProfile}>
                {loading.updateProfile ? "Updating..." : "Update"}
              </button>
              <button type="button" onClick={handleCancel} className={buttonClass + " border border-gray-400 text-gray-700 hover:bg-gray-100"}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
export default UserEditProfile
