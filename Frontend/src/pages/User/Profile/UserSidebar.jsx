import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../../redux/authSlice";

const UserSidebar = ({ activeTab, setActiveTab, profile }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap(); 
      localStorage.removeItem("accessToken_user"); 
      navigate("/"); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const navItems = [
    { key: "profile", label: "Account Overview" },
    { key: "orders", label: "My Orders" },
    { key: "address", label: "Manage Address" },
    { key: "wallet", label: "Wallet" },
  ];

  return (
    <aside className="w-full md:w-[300px] bg-[#f5efdf] border-r border-[#e0e0e0] p-5">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-4">
          {profile?.firstname ? `${profile.firstname} ${profile.lastname}` : "User"}
        </h2>
      </div>

      <nav className="flex flex-col space-y-2">
        {navItems.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center py-2 px-3 rounded transition-colors focus:outline-none focus:ring-2 ${
              activeTab === key
                ? "bg-[#c29d78] text-white"
                : "hover:bg-[#c29d787c] hover:text-white"
            }`}
          >
            <span className="text-base">{label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-10 w-full py-3 bg-red-500 hover:bg-red-600 rounded-full text-white font-bold"
      >
        Logout
      </button>
    </aside>
  );
};

export default UserSidebar;
