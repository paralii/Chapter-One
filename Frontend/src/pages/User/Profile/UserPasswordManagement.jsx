import { useState } from "react";
import { useNavigate } from "react-router-dom";
import userAxios from "../../../api/userAxios";
import { Eye, EyeOff } from "lucide-react";

const UserPasswordManagement = () => {
  const navigate = useNavigate();
  const [changeForm, setChangeForm] = useState({ oldPassword: '', newPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle input changes for password fields
  const handleChangeInput = (e) => {
    setChangeForm({ ...changeForm, [e.target.name]: e.target.value });
  };

  // Handle password change form submission
  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      // Make the API request to change the password
      const response = await userAxios.put('/profile/change-password', changeForm);
      
      if (response.status === 200) {
        alert("Password updated successfully!");
        navigate("/profile");
      }
    } catch (err) {
      if (err.response) {
        // Backend error (incorrect old password, etc.)
        setErrorMessage(err.response.data.message);
      } else {
        // Network error or any other issue
        setErrorMessage("Something went wrong, please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg flex flex-col items-center relative">
        
        <button
          className="absolute top-4 right-4 text-xl text-gray-500 hover:text-black"
          onClick={() => navigate("/profile")}
        >
          &times;
        </button>

        <form onSubmit={handleChangePassword} className="w-full">
          <h1 className="text-[22px] sm:text-[26px] font-bold text-center mb-5 font-Outfit">
            Change Password
          </h1>

          <div className="mb-4 relative">
            <input
              type={showOldPassword ? "text" : "password"}
              placeholder="Old Password"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 pr-12 text-[16px] outline-none font-Inter"
              value={changeForm.oldPassword}
              onChange={handleChangeInput}
              name="oldPassword"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowOldPassword((prev) => !prev)}
            >
              {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="mb-4 relative">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 pr-12 text-[16px] outline-none font-Inter"
              value={changeForm.newPassword}
              onChange={handleChangeInput}
              name="newPassword"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowNewPassword((prev) => !prev)}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl mb-4 bg-[#3c2712] text-white font-semibold text-base font-Outfit"
          >
            Update Password
          </button>
        </form>

        <button
          className="text-sm text-[#8e4700] cursor-pointer mb-3"
          onClick={() => navigate("/profile")}
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default UserPasswordManagement;
