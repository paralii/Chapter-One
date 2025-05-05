import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  changeUserPassword,
  requestEmailChange,
  confirmEmailChange,
} from "../../../api/user/UserAPI"; 

const UserProfileDetails = ({ initialProfile }) => {
  const [mode, setMode] = useState("view");
  const [profile, setProfile] = useState(
    initialProfile || { firstname: "", lastname: "", email: "", profileImage: "" }
  );
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [file, setFile] = useState(null);  
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialProfile) {
      getUserProfile()
        .then((response) => setProfile(response.data.user))
        .catch((err) => console.error("Error fetching profile:", err));
    }
  }, [initialProfile]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const { email, ...updates } = profile;

    updateUserProfile(updates)
      .then(() => {
        alert("Profile updated successfully!");
        setMode("view");
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Failed to update profile")
      );
  };

  const handleEmailChange = () => {
    requestEmailChange(profile.email)
      .then((response) => {
        navigate("/confirm-email-change", {
          state: {
            newEmail: profile.email,
            emailChangeToken: response.data.emailChangeToken,
          },
        });
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Failed to request email change")
      );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    changeUserPassword(oldPassword, newPassword)
      .then(() => {
        alert("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMode("view");
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Failed to change password")
      );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleProfileImageUpload = (e) => {
    e.preventDefault();
    if (file) {
      const formData = new FormData();
      formData.append("profileImage", file);
      uploadProfileImage(formData)
        .then(() => {
          alert("Profile image uploaded successfully!");
          setFile(null);  // Clear the file input
        })
        .catch((err) =>
          alert(err.response?.data?.message || "Failed to upload profile image")
        );
    } else {
      alert("Please select an image first!");
    }
  };

  return (
    <div className="p-5">
      {mode === "view" && (
        <div>
          <h2 className="text-3xl font-bold mb-5 text-[#654321]">Your Details</h2>
          <p className="text-lg">
            <strong>Name:</strong> {profile.firstname} {profile.lastname}
          </p>
          <p className="text-lg">
            <strong>Email:</strong> {profile.email}
          </p>
          {/* Display profile image */}
          {profile.profileImage && (
            <img src={profile.profileImage} alt="Profile" className="w-24 h-24 rounded-full mt-3" />
          )}
          {/* Profile Image Upload Section */}
          <div className="mt-5">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 rounded-md"
            />
            <button
              onClick={handleProfileImageUpload}
              className="bg-amber-800 text-white py-2 px-4 rounded-lg font-semibold hover:bg-amber-900 transition-colors mt-3"
            >
              Upload Image
            </button>
          </div>
          <div className="flex gap-4 mt-5">
            <button
              onClick={() => setMode("edit")}
              className="px-4 py-2 bg-[#654321] hover:bg-[#543210] text-white rounded-full transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setMode("password")}
              className="px-4 py-2 bg-[#654321] hover:bg-[#543210] text-white rounded-full transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold mb-5 text-[#654321]">Edit Profile</h2>

          {["firstname", "lastname"].map((field) => (
            <div key={field} className="flex flex-col">
              <label className="text-black font-medium mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}:
              </label>
              <input
                type="text"
                name={field}
                value={profile[field]}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <label className="text-black font-medium mb-1">Email:</label>
            <div className="flex gap-4">
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleEmailChange}
                className="bg-amber-800 text-white py-2 px-4 rounded-lg font-semibold hover:bg-amber-900 transition-colors"
              >
                Request Email Change
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-amber-800 text-white py-3 rounded-lg font-semibold hover:bg-amber-900 transition-colors"
            >
              Update Profile
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "password" && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold mb-5 text-[#654321]">Change Password</h2>
          {[{ label: "Current Password", state: oldPassword, setState: setOldPassword },
            { label: "New Password", state: newPassword, setState: setNewPassword },
            { label: "Confirm New Password", state: confirmPassword, setState: setConfirmPassword }]
            .map(({ label, state, setState }) => (
              <div key={label} className="flex flex-col">
                <label className="text-black font-medium mb-1">{label}:</label>
                <input
                  type="password"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            ))}

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-amber-800 text-white py-3 rounded-lg font-semibold hover:bg-amber-900 transition-colors"
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfileDetails;
