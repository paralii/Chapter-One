import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';  
import userAxios from "../../../api/userAxios";
import Navbar from '../../../components/common/Navbar';  
import Footer from '../../../components/common/Footer';   
import { useDispatch } from 'react-redux';  
import { logoutUser } from '../../../redux/authSlice';
import { toast } from 'react-toastify';

const UserProfileDashboard = () => {
  const [user, setUser] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null); // Wallet state
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userAxios.get('/profile');  
        setUser(response.data.user);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    // Fetch the default address
    const fetchDefaultAddress = async () => {
      try {
        const response = await userAxios.get('/address/default');  // Adjust this API endpoint
        setDefaultAddress(response.data.address);
      } catch (err) {
        console.error("Failed to fetch default address", err);
      }
    };

    // Fetch wallet balance
    // const fetchWalletBalance = async () => {
    //   try {
    //     const response = await userAxios.get('/balance');  // Adjust the endpoint
    //     setWalletBalance(response.data.balance);
    //   } catch (err) {
    //     console.error("Failed to fetch wallet balance", err);
    //   }
    // };

    fetchUserProfile();
    fetchDefaultAddress();
    // fetchWalletBalance();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser())  
      .then(() => {
        navigate('/');  
        toast.success("Logged out successfully!");
      })
      .catch((error) => {
        console.error("Logout failed", error);
      });
  };

  if (!user || !defaultAddress ) return <div>Loading...</div>;

  return (
    <>
    <Navbar />
    <div className="bg-[#fff8e5] min-h-screen flex flex-col items-center py-12 px-6">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-5xl p-8 mt-8">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="flex items-center justify-center mb-4 lg:mb-0">
              {/* Profile Image */}
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img 
                  src={user.profileImage || 'https://res.cloudinary.com/chapter-one/image/upload/v1746419585/uploads/niizxavwwvje8ji82hmi.jpg'} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="ml-0 lg:ml-6 text-center lg:text-left">
              <h2 className="text-3xl font-semibold text-[#3c2712]">{user.firstname} {user.lastname}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 lg:mt-0">
            <Link to="/profile/edit" className="text-[#3c2712] hover:text-[#2a1b0c] text-lg">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Address Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-[#3c2712]">Address</h3>
          <div className="text-gray-700 text-lg">
          {defaultAddress ? (
              <p>Your current Address: <br />{defaultAddress.name}, {defaultAddress.place}, {defaultAddress.city}, {defaultAddress.state}, {defaultAddress.country} - {defaultAddress.pin}</p>
            ) : (
              <p>No default address set yet.</p>
            )}
          </div>
          <Link to="/profile/addresses" className="text-[#3c2712] hover:text-[#2a1b0c] mt-2 inline-block text-lg">
            Manage Addresses
          </Link>
        </div>

        {/* Wallet Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-[#3c2712]">Wallet</h3>
          <div className="text-gray-700 text-lg">
            <p>Your current wallet balance: <strong>${walletBalance}</strong></p>
          </div>
          <Link to="/profile/wallet" className="text-[#3c2712] hover:text-[#2a1b0c] mt-2 inline-block text-lg">
            View Wallet History
          </Link>
        </div>

        {/* Order History Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-[#3c2712]">Order History</h3>
          <Link to="/profile/orders" className="text-[#3c2712] hover:text-[#2a1b0c] mt-2 inline-block text-lg">
          View and manage your orders.          </Link>
        </div>

        {/* Change Password Section */}
        <div className="flex justify-between mt-6">
          <Link to="/profile/password-management" className="text-[#3c2712] hover:text-[#2a1b0c] text-lg">
            Manage Password
          </Link>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
            <button 
              onClick={handleLogout} 
              className="w-full bg-[#f4a261] text-white font-semibold py-2 px-4 rounded hover:bg-[#e76f51]"
            >
              Logout
            </button>
          </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default UserProfileDashboard;
