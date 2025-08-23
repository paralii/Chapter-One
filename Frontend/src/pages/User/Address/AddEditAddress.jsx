import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Import dispatch
import userAxios from "../../../api/userAxios";
import { showAlert } from "../../../redux/alertSlice"; // Import your showAlert action

const AddEditAddress = () => {
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    place: '',
    city: '',
    district: '',
    state: '',
    country: '',
    pin: '',
    isDefault: false
  });
  
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const dispatch = useDispatch(); // Initialize dispatch

  useEffect(() => {
    if (isEditing) {
      const fetchAddress = async () => {
        try {
          const res = await userAxios.get(`/addresses/${id}`);
          setAddress(res.data.address);
        } catch {
          dispatch(showAlert({ message: "Failed to fetch address details.", type: "error" }));
        }
      };
      fetchAddress();
    }
  }, [id, dispatch]);

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await userAxios.put(`/addresses/${id}`, address);
      } else {
        await userAxios.post('/addresses', address);
      }
      dispatch(showAlert({ message: `Address ${isEditing ? "updated" : "added"} successfully!`, type: "success" }));
      navigate("/profile/addresses");
    } catch (error) {
      if (error.response && error.response.data.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg);
        setError(errorMessages.join(", "));
      } else {
        setError("Failed to save address.");
      }
      dispatch(showAlert({ message: "Failed to save address.", type: "error" }));
    }
  };

  return (
    <div className="bg-yellow-50 min-h-screen py-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          {isEditing ? "Edit Address" : "Add Address"}
        </h2>
  
        {error && <p className="text-red-500 mb-4">{error}</p>}
  
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={address.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={address.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
            <input
              type="text"
              name="place"
              value={address.place}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
  
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                name="district"
                value={address.district}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
  
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={address.state}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                name="pin"
                value={address.pin}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={address.country}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
  
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isDefault"
              checked={address.isDefault}
              onChange={() =>
                setAddress({ ...address, isDefault: !address.isDefault })
              }
              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
            />
            <label className="text-sm text-gray-700">Set as Default Address</label>
          </div>
  
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            {isEditing ? "Update Address" : "Add Address"}
          </button>
        </form>
      </div>
    </div>
  );
  
};

export default AddEditAddress;
