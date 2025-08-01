import React, { useState, useEffect } from "react";
import adminAxios from "../../api/adminAxios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import BookLoader from "../../components/common/BookLoader";
import { toast } from "react-toastify";
import showConfirmDialog from "../../components/common/ConformationModal";
import axios from "axios";


function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0); 
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
  setLoading(true);
  try {
    const response = await adminAxios.get(`/customers`, {
      params: { search, page, limit },
    });
    const fetchedUsers = response.data.users;
    const fetchedTotal = response.data.total;

    // Auto-correct if page number is too high
    const maxPage = Math.ceil(fetchedTotal / limit);
    if (page > maxPage && maxPage > 0) {
      setPage(maxPage); // triggers useEffect to refetch
    } else {
      setUsers(fetchedUsers);
      setTotal(fetchedTotal);
    }
    setError(null);
  } catch (err) {
    setError(err.response?.data?.message || "Error fetching users");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

const toggleBlock = async (id, isBlock, name) => {
  showConfirmDialog({
    message: `Are you sure you want to ${isBlock ? "Unblock" : "Block"} ${name}?`,
    twoStep: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    nextStepConfig: {
      message: `Please confirm to ${isBlock ? "Unblock" : "Block"} ${name}`,
      confirmButtonText: isBlock ? "Unblock" : "Block",
      cancelButtonText: "Cancel",
      inputs: [],
    },
    onConfirm: async () => {
      try {
        await adminAxios.patch(`/customers/${id}/toggle-block`);
        fetchUsers();
        toast.success(`User ${isBlock ? "Unblocked" : "Blocked"} successfully`);
      } catch (err) {
        toast.error("Failed to update block status.");
      }
    },
  });
};


  const deleteUser = async (id) => {
    showConfirmDialog(
      "Are you sure you want to delete this user permanently?",
      async () => {
        try {
          await adminAxios.delete(`/customers/${id}`);
          fetchUsers();
          toast.success("User deleted successfully!");
        } catch (err) {
          console.error("Error deleting user:", err);
          toast.error("Failed to delete user.");
        }
      }
    );
  };

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {}, { withCredentials: true });
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

  return (
    <>{loading && <BookLoader />}
      <div className="bg-[#fffbf0] min-h-screen flex flex-col sm:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-5 sm:p-10">
          <PageHeader 
            title="Users"
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            handleClear={handleClear}
            handleLogout={handleLogout}
          />

          {/* <button
            className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-lg mb-4 font-medium"
            onClick={() => openModal("add")}
          >
            + Add New User
          </button> */}

          <div className="bg-[#eee9dc] rounded-[15px] mb-[30px] overflow-x-auto sm:overflow-hidden">
            <div className="bg-[#eee9dc] border-b border-b-white p-[10px] flex min-w-[800px] sm:min-w-0">
              <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                ID
              </div>
              <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                Email
              </div>
              <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                Name
              </div>
              {/* <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                Block Status
              </div> */}
              <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                Actions
              </div>
            </div>
            {!loading && users.length === 0 && (
                <div className="text-center text-gray-500 py-6">No users found.</div>
              )}
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-[#eee9dc] border-b border-b-white p-[10px] flex min-w-[800px] sm:min-w-0"
              >
                <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                  {user._id}
                </div>
                <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                  {user.email}
                </div>
                <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                  {`${user.firstname} ${user.lastname}`}
                </div>
                {/* <div className="flex-1 p-[10px] text-[#484848] text-[14px] font-medium flex items-center">
                  {user.isBlock ? "Blocked" : "Active"}
                </div> */}
                <div className="flex-1 p-[10px] flex items-center">
                  <button
                    className={`${
                      user.isBlock
                        ? "bg-[#654321] hover:bg-[#543210] text-white"
                        : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                    } rounded-[10px] py-2 px-4 text-[14px] font-medium cursor-pointer mr-4`}
                    onClick={() => toggleBlock(user._id, user.isBlocked, user.firstname)}
                  >
                    {user.isBlock ? "Unblock" : "Block"}
                  </button>

                  <button
                    className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px] font-medium cursor-pointer mr-2"
                    onClick={() => openModal("edit", user)}
                  >
                    ✎
                  </button>
                  <button
                    className={`${
                      user.isDeleted
                        ? "bg-[#654321] hover:bg-[#543210] text-white"
                        : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                    } rounded-[10px] py-2 px-4 text-[14px] font-medium cursor-pointer`}
                    onClick={() => deleteUser(user._id)}
                  >
                    {user.isDeleted ? "Restore" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
                page <= 1 ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
                page >= totalPages ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>

        </main>
      </div>
      <UserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        userData={selectedUser}
        onUserUpdated={fetchUsers}
      />
    </>
  );
}

function UserModal({ isOpen, onClose, mode, userData, onUserUpdated }) {
  if (!isOpen) return null;

  const [firstname, setFirstname] = useState(userData?.firstname || "");
  const [lastname, setLastname] = useState(userData?.lastname || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === "edit" && userData) {
      setFirstname(userData.firstname);
      setLastname(userData.lastname);
      setEmail(userData.email);
    }
  }, [userData, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "add") {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/customers`,
          { firstname, lastname, email, password },
          { withCredentials: true }
        );
      } else {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/admin/customers/${userData._id}`,
          { firstname, lastname, email },
          { withCredentials: true }
        );
      }
      onUserUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error processing request");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="bg-[#fffbf0] p-6 rounded-lg shadow-lg w-[90%] max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {mode === "add" ? "Add New User" : "Edit User"}
        </h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium">First Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium">Last Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {mode === "add" && (
            <div className="mb-4">
              <label className="block font-medium">Password</label>
              <input
                type="password"
                className="w-full border p-2 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          <div className="flex justify-between">
            <button
              type="button"
              className="bg-[#654321] hover:bg-[#543210] text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black px-4 py-2 rounded"
            >
              {mode === "add" ? "Add User" : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
