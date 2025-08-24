import React, { useState, useEffect } from "react";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  requestEmailChange,
  confirmEmailChange,
  changeUserPassword,
} from "../../../api/user/UserAPI";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../redux/alertSlice.js";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const UserEditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    profileImage: "",
  });
  const [originalEmail, setOriginalEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [file, setFile] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState({
    sendOtp: false,
    verifyOtp: false,
    updateProfile: false,
  });

  useEffect(() => {
    getUserProfile()
      .then((res) => {
        setForm(res.data.user);
        setOriginalEmail(res.data.user.email);
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        dispatch(showAlert({
          message: "Failed to fetch user profile. Please try again.",
          type: "error",
        }));
      });
  }, []);
  useEffect(() => {
    if (location.state?.emailChanged && location.state?.newEmail) {
      setForm((prev) => ({ ...prev, email: location.state.newEmail }));
      navigate("/profile/edit", { replace: true }); 
      toast.success("Email changed successfully!");
    }
  }, [location, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    setLoading((prev) => ({ ...prev, sendOtp: true }));
    if (form.email === originalEmail) {
      dispatch(
        showAlert({
          message:
            "Email is the same as the original email. No need to send OTP.",
          type: "info",
        })
      );
      return;
    }
    if (!form.email) {
      dispatch(
        showAlert({
          message: "Please enter a new email address.",
          type: "info",
        })
      );
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      dispatch(
        showAlert({
          message: "Please enter a valid email address.",
          type: "info",
        })
      );
      return;
    }

    requestEmailChange(form.email)
      .then(() => {
        setOtpSent(true);
        dispatch(
          showAlert({
            message:
              "OTP sent to your new email address. Please check your inbox.",
            type: "success",
          })
        );
      })
      .catch((err) => {
        console.error("Error sending OTP:", err);
        dispatch(
          showAlert({
            message: "Failed to send OTP. Please try again.",
            type: "error",
          })
        );
      });
    setLoading((prev) => ({ ...prev, sendOtp: false }));
  };

  const handleVerifyOtp = async () => {
    setLoading((prev) => ({ ...prev, verifyOtp: true }));
    confirmEmailChange({otp, newEmail: form.email})
      .then(() => {
        dispatch(
          showAlert({ message: "Email updated successfully!", type: "success" })
        );
        setOtpSent(false);
        setOriginalEmail(form.email);
        navigate("/profile");
      })
      .catch((err) => {
        console.error("Error verifying OTP:", err);
        dispatch(
          showAlert({
            message: "Failed to verify OTP. Please try again.",
            type: "error",
          })
        );
      });
    setLoading((prev) => ({ ...prev, verifyOtp: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, updateProfile: true }));
    try {
      getUserProfile({
        firstname: form.firstname,
        lastname: form.lastname,
      });

      if (
        showPasswordFields &&
        passwordForm.oldPassword &&
        passwordForm.newPassword
      ) {
        if (passwordForm.oldPassword === passwordForm.newPassword) {
          setPasswordError("New password cannot be same as old.");
          return;
        }
        try {
          await changeUserPassword(
            passwordForm.oldPassword,
            passwordForm.newPassword
          );
        } catch (err) {
          console.error("Password update failed:", err);
          dispatch(
            showAlert({
              message:
                "Failed to update password. Check your current password.",
              type: "error",
            })
          );
          return;
        }
      }

      if (form.email !== originalEmail) {
        try {
          const res = await requestEmailChange(form.email);
          const token = res.data.emailChangeToken;

          localStorage.setItem("otpToken", token);
          return; 
        } catch (err) {
          toast.error( err.message || "Failed to initiate email change verification.");
          return;
        } finally {
          setLoading((prev) => ({ ...prev, updateProfile: false }));
        }
      }

      if (file) {
        const formData = new FormData();
        formData.append("profileImage", file);
        await uploadProfileImage(formData);
      } else {
        await updateUserProfile({
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
        });
      }

      dispatch(
        showAlert({ message: "Profile updated successfully!", type: "success" })
      );
      navigate("/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      dispatch(
        showAlert({
          message: "Failed to update profile. Please try again.",
          type: "error",
        })
      );
    }
  };

  const handleCancel = () => navigate("/profile");

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setForm({ ...form, profileImage: URL.createObjectURL(selectedFile) });
  };

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg">
        <h2 className="text-[22px] sm:text-[26px] font-bold text-center mb-6 font-Outfit text-[#3c2712]">
          Edit Profile
        </h2>

        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#f4a261]">
            <img
              src={
                form.profileImage ||
                "https://res.cloudinary.com/chapter-one/image/upload/v1746281035/uploads/ymzr7hhy6mfnavtuthhx.jpg"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="mb-4 text-center">
          <label
            htmlFor="profileImage"
            className="cursor-pointer text-[#8e4700] hover:underline text-sm font-medium"
          >
            Change Profile Picture
          </label>
          <input
            type="file"
            id="profileImage"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-Inter">
          <input
            type="text"
            name="firstname"
            value={form.firstname}
            onChange={handleChange}
            className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
            placeholder="First Name"
          />
          <input
            type="text"
            name="lastname"
            value={form.lastname}
            onChange={handleChange}
            className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
            placeholder="Last Name"
          />
          <div className="relative">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
              placeholder="Email"
              readOnly={form.email === originalEmail && !otpSent}
            />
            {form.email === originalEmail && !otpSent && (
              <button
                type="button"
                onClick={() => setForm({ ...form, email: "" })}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8e4700] text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>
          {form.email !== originalEmail && !otpSent && (
            <p className="text-xs text-yellow-600 mt-1">
              An OTP will be sent to this new email for verification.
            </p>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="text-sm text-[#8e4700] hover:underline"
            >
              {showPasswordFields ? "Hide Change Password" : "Change Password"}
            </button>

            {showPasswordFields && (
              <>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        oldPassword: e.target.value,
                      })
                    }
                    placeholder="Old Password"
                    className="w-full h-[50px] px-5 pr-12 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
                  />
                  <span
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                  >
                    {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPasswordForm({ ...passwordForm, newPassword: val });
                      setPasswordError(
                        val === passwordForm.oldPassword
                          ? "New password cannot be same as old."
                          : ""
                      );
                    }}
                    placeholder="New Password"
                    className="w-full h-[50px] px-5 pr-12 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
                  />
                  <span
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                {passwordError && (
                  <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                )}
              </>
            )}
          </div>

          {form.email !== originalEmail && !otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full h-[50px] rounded-[20px] bg-[#3c2712] text-white font-semibold font-Outfit disabled:opacity-60"
              disabled={loading.sendOtp}
            >
              {loading.sendOtp ? "Sending OTP..." : "Send OTP to New Email"}
            </button>
          )}

          {otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full h-[50px] rounded-[20px] bg-green-600 text-white font-semibold font-Outfit disabled:opacity-60"
                disabled={loading.verifyOtp}
              >
                {loading.verifyOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          <div className="flex justify-between gap-3 mt-4">
            <button
              type="submit"
              className="w-full h-[50px] rounded-[20px] bg-[#f4a261] text-white font-semibold font-Outfit hover:bg-[#e76f51] transition disabled:opacity-60"
              disabled={loading.updateProfile}
            >
              {loading.updateProfile ? "Updating..." : "Update"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full h-[50px] rounded-[20px] border border-gray-400 text-gray-700 font-Outfit hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};
export default UserEditProfile;
