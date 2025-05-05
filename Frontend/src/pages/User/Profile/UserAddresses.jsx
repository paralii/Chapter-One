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
    <div className="bg-yellow-50 min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Your Addresses</h2>
        {error && <p className="text-red-500">{error}</p>}

        {addresses.length === 0 ? (
          <p>No addresses saved.</p>
        ) : (
          addresses.map((addr) => (
            <div key={addr._id} className="border p-4 mb-4 rounded">
              <p>{addr.name}</p>
              <p>{addr.phone}</p>
              <p>{addr.place}</p>
              <p>{addr.city}, {addr.district}, {addr.state}, {addr.country} </p>
              <p>{addr.phone}</p>
              <p>{addr.pin}</p>
              {addr.isDefault && <span className="text-green-500 text-sm">Default</span>}
              <div className="flex gap-4 mt-2">
                <button
                  className="text-blue-500"
                  onClick={() => navigate(`/profile/addresses/edit/${addr._id}`)}
                >
                  Edit
                </button>
                <button
                  className="text-red-500"
                  onClick={() => handleDelete(addr._id)}
                >
                  Delete
                </button>
                {!addr.isDefault && (
                  <button
                    className="text-green-500"
                    onClick={() => handleSetDefault(addr._id)}
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => navigate("/profile/addresses/add")}
          className="mt-4 w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-yellow-600 transition-all duration-300"
        >
          Add New Address
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="mt-4 w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all duration-300"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default UserAddresses;
