import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import BookLoader from "../../components/common/BookLoader";
import { toast } from "react-toastify";
import showConfirmDialog from "../../components/common/ConformationModal";
import useDebounce from "../../hooks/useDebounce";
import {validateUserInput} from "../../utils/userValidator.js";
import {getAllCustomers, toggleBlockCustomer, updateCustomer, deleteCustomer} from "../../api/admin/userAPI";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllCustomers({ search, page, limit });

      const fetchedUsers = response.data.users;
      const fetchedTotal = response.data.total;

      const maxPage = Math.ceil(fetchedTotal / limit);
      if (page > maxPage && maxPage > 0) {
        setPage(maxPage);
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
  }, [search,page]);

  const openModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

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
          await toggleBlockCustomer(id);
          
          setUsers((prevUsers) => 
          prevUsers.map((user) => user._id === id ? {...user, isBlock: !isBlock} : user));

          toast.success(`User ${isBlock ? "Unblocked" : "Blocked"} successfully`);
        } catch (err) {
          toast.error(err.message || "Failed to update block status.");
        }
      },
    });
  };

  const deleteUser = async (id) => {
    showConfirmDialog({
        message:"Are you sure you want to delete this user permanently?",
        twoStep: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        nextStepConfig: {
          message: `Please confirm to delete this user permanently.`,
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          inputs: [],
        },
        onConfirm: async () => {
        try {
          await deleteCustomer(id);
          setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
          toast.success("User deleted successfully!");
        } catch (err) {
          toast.error(err.message ||"Failed to delete user.");
        }
      },
    });
  };

  useEffect(() => {
    if (search !== debouncedSearch) {
      setSearch(debouncedSearch);
      setPage(1);
    }
  }, [debouncedSearch]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setPage(1);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <BookLoader />
        </div>
      )}
      <div className="bg-[#fffbf0] min-h-screen flex">
        <AdminSidebar />
        <main className="flex-1 p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16">
          <PageHeader
            title="Users"
            search={searchInput}
            onSearchChange={handleSearchChange}
            handleClear={handleClearSearch}
          />
          {error && (
            <div className="text-red-500 mb-4 text-xs xs:text-sm sm:text-base">
              {error}
            </div>
          )}
          {loading && search && (
            <div className="text-gray-500 mb-4 text-xs xs:text-sm sm:text-base">
              Searching...
            </div>
          )}

          {/* User Table */}
          <div className="bg-[#eee9dc] rounded-lg mb-6 sm:mb-8 overflow-x-auto">
            <div className="grid grid-cols-[0.5fr_1.2fr_1.2fr_1fr] xs:grid-cols-[0.5fr_1.2fr_1.2fr_1fr] sm:grid-cols-[0.5fr_1.2fr_1.2fr_1fr] md:grid-cols-[0.5fr_1.3fr_1.3fr_1fr] lg:grid-cols-[0.5fr_1.4fr_1.4fr_1fr] min-w-[600px] sm:min-w-0">
              <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center">
                #
              </div>
              <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center min-w-[120px]">
                Name
              </div>
              <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center min-w-[120px]">
                Email
              </div>
              <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center">
                Actions
              </div>
            </div>
            {!loading && users.length === 0 && (
              <div className="text-center text-gray-500 py-4 sm:py-6 text-xs xs:text-sm sm:text-base">
                No users found.
              </div>
            )}
            {users.map((user, index) => (
              <div
                key={user._id}
                className="grid grid-cols-[0.5fr_1.2fr_1.2fr_1fr] xs:grid-cols-[0.5fr_1.2fr_1.2fr_1fr] sm:grid-cols-[0.5fr_1.2fr_1.2fr_1fr] md:grid-cols-[0.5fr_1.3fr_1.3fr_1fr] lg:grid-cols-[0.5fr_1.4fr_1.4fr_1fr] min-w-[600px] sm:min-w-0 border-t border-white"
              >
                <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center">
                  {(page - 1) * limit + index + 1}
                </div>
                <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center min-w-[100px] truncate">
                  {`${user.firstname} ${user.lastname}`}
                </div>
                <div className="p-2 xs:p-3 sm:p-4 text-[#484848] text-xs xs:text-sm sm:text-base font-medium flex items-center min-w-[100px] truncate">
                  {user.email}
                </div>
                <div className="p-2 xs:p-3 sm:p-4 flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                  <button
                    className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-lg py-0.5 xs:py-1 sm:py-1.5 px-0.5 xs:px-1 sm:px-2 w-10 xs:w-12 sm:w-14 text-xs xs:text-sm sm:text-xs font-medium"
                    onClick={() => openModal(user)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${
                      user.isBlock
                        ? "bg-[#654321] hover:bg-[#543210] text-white font-light"
                        : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black font-medium"
                    } rounded-lg py-0.5 xs:py-1 sm:py-1.5 px-0.5 xs:px-1 sm:px-2 w-10 xs:w-12 sm:w-14 text-xs xs:text-xs sm:text-xs`}
                    onClick={() => toggleBlock(user._id, user.isBlock, user.firstname)}
                  >
                    {user.isBlock ? "Unblock" : "Block"}
                  </button>
                  <button
                    className={`${
                      user.isDeleted
                        ? "bg-[#654321] hover:bg-[#543210] text-white font-light"
                        : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black font-medium"
                    } rounded-lg py-0.5 xs:py-1 sm:py-1.5 px-0.5 xs:px-1 sm:px-2 w-10 xs:w-12 sm:w-14 text-xs xs:text-sm sm:text-xs `}
                    onClick={() => deleteUser(user._id)}
                  >
                    {user.isDeleted ? "Restore" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 xs:gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-2 xs:px-3 sm:px-4 py-1 xs:py-2 bg-gray-200 text-gray-800 rounded-lg text-xs xs:text-sm sm:text-base disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs xs:text-sm sm:text-base">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-2 xs:px-3 sm:px-4 py-1 xs:py-2 bg-gray-200 text-gray-800 rounded-lg text-xs xs:text-sm sm:text-base disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </main>
      </div>
      <UserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode="edit"
        userData={selectedUser}
        onUserUpdated={(updatedUser) => {
          setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
          setSelectedUser(updatedUser);
        }}
      />
    </>
  );
}

function UserModal({ isOpen, onClose, mode, userData, onUserUpdated }) {
  if (!isOpen) return null;

  const [firstname, setFirstname] = useState(userData?.firstname || "");
  const [lastname, setLastname] = useState(userData?.lastname || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [error, setError] = useState([]);

  useEffect(() => {
    if (mode === "edit" && userData) {
      setFirstname(userData.firstname);
      setLastname(userData.lastname);
      setEmail(userData.email);
      setError([]);
    }
  }, [userData, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasChanges =
      firstname !== userData.firstname ||
      lastname !== userData.lastname ||
      email !== userData.email;

    if (!hasChanges) {
      toast.info("No changes detected");
      return;
    }
    
    const validationErrors = validateUserInput({
      firstname,
      lastname,
      email,
      password: "Password@123", 
    });

    if (validationErrors.length > 0) {
      setError(validationErrors);
      return;
    }

    try {
      const updated = await updateCustomer(userData._id, { firstname, lastname, email });
      const updatedUser = updated?.data || { ...userData, firstname, lastname, email };
      toast.success("User updated successfully!");
      onUserUpdated(updatedUser);
      onClose();
      setError([]);
    } catch (err) {
      setError(err.response?.data?.message || "Error processing request");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[#fffbf0] p-4 xs:p-5 sm:p-6 rounded-lg shadow-lg w-[95%] xs:w-[90%] sm:max-w-md lg:max-w-lg">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
          Edit User
        </h2>
        {error && (
          <div className="text-red-500 mb-3 sm:mb-4 text-xs xs:text-sm sm:text-base">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3 sm:mb-4">
            <label className="block font-medium text-xs xs:text-sm sm:text-base mb-1">
              First Name
            </label>
            <input
              type="text"
              className="w-full border p-2 xs:p-3 rounded-lg text-xs xs:text-sm sm:text-base"
              value={firstname}
              onChange={(e) => {
                setFirstname(e.target.value);
                setError([]);
              }}
              required
            />
          </div>
          <div className="mb-3 sm:mb-4">
            <label className="block font-medium text-xs xs:text-sm sm:text-base mb-1">
              Last Name
            </label>
            <input
              type="text"
              className="w-full border p-2 xs:p-3 rounded-lg text-xs xs:text-sm sm:text-base"
              value={lastname}
              onChange={(e) => {
                setLastname(e.target.value)
                setError([]);
              }}
              required
            />
          </div>
          <div className="mb-3 sm:mb-4">
            <label className="block font-medium text-xs xs:text-sm sm:text-base mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border p-2 xs:p-3 rounded-lg text-xs xs:text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-between gap-2 xs:gap-3 sm:gap-4">
            <button
              type="button"
              className="bg-[#654321] hover:bg-[#543210] text-white px-3 xs:px-4 sm:px-5 py-1 xs:py-2 rounded-lg text-xs xs:text-sm sm:text-base"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                firstname === userData.firstname &&
                lastname === userData.lastname &&
                email === userData.email
              }
              className={`px-3 xs:px-4 sm:px-5 py-1 xs:py-2 rounded-lg text-xs xs:text-sm sm:text-base
                ${
                  firstname === userData.firstname &&
                  lastname === userData.lastname &&
                  email === userData.email
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                }`}
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );

}

  UserModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    mode: PropTypes.string.isRequired,
    userData: PropTypes.object,
    onUserUpdated: PropTypes.func.isRequired,
  };

export default UserManagement;