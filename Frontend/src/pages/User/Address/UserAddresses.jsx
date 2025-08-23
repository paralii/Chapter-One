import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Import dispatch
import userAxios from "../../../api/userAxios";
import { showAlert } from "../../../redux/alertSlice"; // Import your showAlert action

const UserAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize dispatch

  const fetchAddresses = async () => {
    try {
      const res = await userAxios.get("/addresses");
      setAddresses(res.data.addresses);
    } catch (err) {
      setError("Failed to fetch addresses.");
      dispatch(showAlert({ message: "Failed to fetch addresses.", type: "error" }));
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (addressId) => {
    try {
      await userAxios.delete(`/addresses/${addressId}`);
      fetchAddresses();
      dispatch(showAlert({ message: "Address deleted successfully!", type: "success" }));
    } catch {
      setError("Failed to delete address.");
      dispatch(showAlert({ message: "Failed to delete address.", type: "error" }));
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await userAxios.put(`/addresses/default/${addressId}`);
      fetchAddresses();
      dispatch(showAlert({ message: "Address set as default!", type: "success" }));
    } catch {
      setError("Failed to set default address.");
      dispatch(showAlert({ message: "Failed to set default address.", type: "error" }));
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-50 px-4 py-8 flex justify-center items-start">
      <div className="bg-white shadow-xl p-6 rounded-xl w-full max-w-4xl relative">
  
        {/* Top-right Back button */}
        <button
          onClick={() => navigate("/profile")}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-800 hover:underline"
        >
          Back to Profile
        </button>
  
        <h2 className="text-2xl font-semibold text-yellow-600 mb-6">Manage Addresses</h2>
  
        {error && <p className="text-red-500 mb-4">{error}</p>}
  
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <img src="/path-to-empty-state-icon.svg" alt="No addresses" className="w-16 h-16 mb-4" />
            <p className="text-gray-600">You don't have any addresses saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200"
              >
                <div className="text-gray-800">
                  <p className="font-semibold text-gray-900">{addr.name}</p>
                  <p>{addr.phone}</p>
                  <p>{addr.place}</p>
                  <p>{addr.city}, {addr.district}, {addr.state}, {addr.country}</p>
                  <p>{addr.pin}</p>
                  {addr.isDefault && (
                    <span className="text-green-600 text-sm font-semibold">Default Address</span>
                  )}
                </div>
  
                <div className="flex gap-3 mt-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => navigate(`/profile/addresses/edit/${addr._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDelete(addr._id)}
                  >
                    Delete
                  </button>
                  {!addr.isDefault && (
                    <button
                      className="bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition-all duration-300"
                      onClick={() => handleSetDefault(addr._id)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  
      {/* Floating Add Button */}
      <button
        onClick={() => navigate("/profile/addresses/add")}
        className="fixed bottom-8 right-8 bg-yellow-500 text-white w-14 h-14 rounded-full shadow-lg hover:bg-yellow-600 transition-all duration-300 text-3xl flex justify-center align-items-center"
        aria-label="Add Address"
      >+
      </button>
    </div>
  );
  
  
  
};

export default UserAddresses;
