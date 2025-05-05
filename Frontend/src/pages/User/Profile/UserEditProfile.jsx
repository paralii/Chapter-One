import React, { useState, useEffect } from 'react';
import userAxios from "../../../api/userAxios";
import { useNavigate } from 'react-router-dom';

const UserEditProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', profileImage: '' });
  const [originalEmail, setOriginalEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await userAxios.get("/profile");
      setForm(res.data.user);
      setOriginalEmail(res.data.user.email);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    const res = await userAxios.post("/profile/request-email-change", { newEmail: form.email });
    setToken(res.data.emailChangeToken);
    setOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    await userAxios.post("/profile/confirm-email-change", { otp, emailChangeToken: token });
    alert("Email updated");
    setOtpSent(false);
    setOriginalEmail(form.email);
    navigate("/profile");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userAxios.put("/profile", {
        firstname: form.firstname,
        lastname: form.lastname,
      });
      if (file) {
        const formData = new FormData();
        formData.append('profileImage', file);
        await userAxios.put("/profile/upload-image", formData);
      }
      alert("Profile updated");
      navigate("/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
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
              src={form.profileImage || 'https://res.cloudinary.com/chapter-one/image/upload/v1746281035/uploads/ymzr7hhy6mfnavtuthhx.jpg'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="mb-4 text-center">
          <label htmlFor="profileImage" className="cursor-pointer text-[#8e4700] hover:underline text-sm font-medium">
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
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px]"
            placeholder="Email"
          />

          {form.email !== originalEmail && !otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full h-[50px] rounded-[20px] bg-[#3c2712] text-white font-semibold font-Outfit"
            >
              Send OTP to New Email
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
                className="w-full h-[50px] rounded-[20px] bg-green-600 text-white font-semibold font-Outfit"
              >
                Verify OTP
              </button>
            </>
          )}

          <div className="flex justify-between gap-3 mt-4">
            <button
              type="submit"
              className="w-full h-[50px] rounded-[20px] bg-[#f4a261] text-white font-semibold font-Outfit hover:bg-[#e76f51] transition"
            >
              Update
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
