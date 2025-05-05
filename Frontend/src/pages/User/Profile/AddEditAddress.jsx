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
    <div className="bg-yellow-50 min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{isEditing ? "Edit Address" : "Add Address"}</h2>
        {error && <p className="text-red-500">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              value={address.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="text"
              name="phone"
              value={address.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Street</label>
            <input
              type="text"
              name="place"
              value={address.place}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={address.city}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">District</label>
            <input
              type="text"
              name="district"
              value={address.district}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">State</label>
            <input
              type="text"
              name="state"
              value={address.state}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Zip Code</label>
            <input
              type="text"
              name="pin"
              value={address.pin}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              type="text"
              name="country"
              value={address.country}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isDefault"
                checked={address.isDefault}
                onChange={() => setAddress({ ...address, isDefault: !address.isDefault })}
                className="mr-2"
              />
              Set as Default Address
            </label>
          </div>

          <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded">
            {isEditing ? "Update Address" : "Add Address"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEditAddress;
