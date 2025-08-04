import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import adminAxios from "../../api/adminAxios";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import useDebounce from "../../hooks/useDebounce";
import { use } from "react";

function CategoryManagement() {
    const navigate = useNavigate();
  
    // State for categories, pagination, and filters.
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [showListedOnly, setShowListedOnly] = useState(true);
    const totalPages = Math.ceil(total / limit);
  
    // Modal & form state.
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
      name: "",
      description: "",
    });
    
    // Added error state.
    const [error, setError] = useState(null);
  
    const [searchInput, setSearchInput] = useState(search);
    const debouncedSearch = useDebounce(searchInput, 500);

    // Fetch categories from API.
    const fetchCategories = async () => {
      try {
        const response = await adminAxios.get(`/categories`, {
          params: {
            search,
            page,
            limit,
            // If "showListedOnly" is true, we don't send isDeleted filter.
            isDeleted: !showListedOnly ? false : undefined,
          },
          withCredentials: true,
        });
        setCategories(response.data.categories);
        setTotal(response.data.total);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || "Error fetching categories");
        toast.error(err.response?.data?.error || "Error fetching categories");
      }
    };
  
    useEffect(() => {
      fetchCategories();
    }, [page, search, showListedOnly]);
  
    // Handle add or edit submit.
    const handleSubmit = async (e) => {
      e.preventDefault();

        const trimmedName = formData.name.trim();
        const trimmedDescription = formData.description.trim();

        const validName = /^[a-zA-Z0-9\s&-]+$/;
        if (!validName.test(trimmedName)) {
          toast.error("Category name contains invalid characters.");
          return;
        }
        const validDesc = /^[a-zA-Z0-9\s.,'’\-()&!]*$/;
        if (trimmedDescription && !validDesc.test(trimmedDescription)) {
          toast.error("Description contains invalid characters.");
          return;
        }
        if (trimmedDescription && trimmedDescription.length < 3) {
          toast.error("Description is too short (minimum 3 characters).");
          return;
        }
        if (trimmedDescription.length > 300) {
          toast.error("Description is too long (maximum 300 characters).");
          return;
        }

          const cleanedData = {
            name: trimmedName,
            description: trimmedDescription,
          };

      if (editingCategory) {
        // Edit Category
        try {
          await adminAxios.put(
            `/categories/${editingCategory._id}`,
            cleanedData,
            { withCredentials: true }
          );
          toast.success("Category updated successfully!");
          setModalOpen(false);
          setEditingCategory(null);
          setFormData({ name: "", description: "" });
          fetchCategories();
        } catch (err) {
          toast.error(err.response?.data?.error || "Error updating category");
        }
      } else {
        // Add Category
        try {
          await adminAxios.post(`/categories`, cleanedData, {
            withCredentials: true,
          });
          toast.success("Category added successfully!");
          setModalOpen(false);
          setFormData({ name: "", description: "" });
          fetchCategories();
        } catch (err) {
          toast.error(err.response?.data?.error || "Error adding category");
        }
      }
    };
  
    // Open the modal for editing.
    const openEditModal = (cat) => {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        description: cat.description,
      });
      setModalOpen(true);
    };
  
    // Open modal for adding a new category.
    const openAddModal = () => {
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      setModalOpen(true);
    };
  
    // Delete/Restore handler.
    const handleDelete = async (id, isDeleted, isListed) => {
      confirmAlert({
        title: "Confirm Action",
        message: `Are you sure you want to ${isDeleted ? "restore" : "delete"} this category?`,
        customUI: ({ onClose }) => (
          <div className="p-5 bg-white rounded-lg">
            <h2 className="text-lg font-semibold text-[#654321]">
              {`Are you sure you want to ${isDeleted ? "restore" : "delete"} this category?`}
            </h2>
            <div className="flex gap-4 mt-4 justify-center">
              <button
                className="bg-[#654321] text-white px-4 py-2 rounded"
                onClick={async () => {
                  try {
                    await adminAxios.patch(
                      `categories/${id}`,
                      { isDeleted: !isDeleted, isListed: !isListed },
                      { withCredentials: true }
                    );
                    fetchCategories();
                    toast.success(
                      `${isDeleted ? "Category Restored" : "Category deleted!"}`
                    );
                    onClose();
                  } catch (err) {
                    toast.error(err.response?.data?.error || "Failed to delete the category.");
                    onClose();
                  }
                }}
              >
                Yes
              </button>
              <button
                className="bg-[#f5deb3] text-[#654321] px-4 py-2 rounded"
                onClick={onClose}
              >
                No
              </button>
            </div>
          </div>
        ),
      });
    };
  
    useEffect(() => {
      if (search !== debouncedSearch) {
        setSearch(debouncedSearch);
        setPage(1);
      }
    },[debouncedSearch]);
      
    const handleSearchChange = (value) => {
      setSearchInput(value);
    }  
    
    const handleClear = () => {
      setSearch("");
      setPage(1);
    };
    return (
      <>
          <div className="flex min-h-screen bg-[#fffbf0]">
          <AdminSidebar />
          <main className="flex-1 p-5 sm:p-10">
            <PageHeader
              title="Categories"
              search={search}
              onSearchChange={handleSearchChange}
              handleClear={handleClear}
            />
  
            <button
              className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-lg mb-4 font-medium"
              onClick={openAddModal}
            >
              + Add New Category
            </button>
  
            <div className="flex items-center mb-4">
              <label className="mr-2 font-semibold">Show only Available Categories:</label>
              <input
                type="checkbox"
                checked={showListedOnly}
                onChange={() => setShowListedOnly(!showListedOnly)}
                className="h-5 w-5"
              />
            </div>
  
            {error && <div className="text-red-500 mb-5">{error}</div>}
  
            <div className="overflow-x-auto bg-[#eee9dc] rounded-[15px] mb-8">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#eee9dc] border-b border-white text-[#484848] text-sm font-medium text-left">
                    <th className="p-2">S.No</th>
                    <th className="p-2">Category Name</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Listed</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((cat, index) => (
                      <tr key={cat._id} className="bg-[#eee9dc] border-b border-white">
                        <td className="p-2 text-sm font-medium">{index + 1 + (page - 1) * limit}</td>
                        <td className="p-2 text-sm font-medium">{cat.name}</td>
                        <td className="p-2 text-sm font-medium">{cat.description}</td>
                        <td className="p-2 text-sm font-medium">{cat.isDeleted ? "Deleted" : "Listed"}</td>
                        <td className="p-2 flex items-center gap-2">
                          <button className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded px-3 py-1 text-sm font-medium" onClick={() => openEditModal(cat)}>
                            Edit
                          </button>
                          <button
                            className={`rounded px-3 py-1 text-sm font-medium cursor-pointer ${
                              cat.isDeleted ? "bg-[#654321] hover:bg-[#543210] text-white" : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                            }`}
                            onClick={() => handleDelete(cat._id, cat.isDeleted, cat.isListed)}
                          >
                            {cat.isDeleted ? "Restore" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2 text-sm font-medium" colSpan="5">No categories found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 mt-5">
            <button
              onClick={() => setPage(page - 1)}
              className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
                page <= 1 ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              className={`px-4 py-2 bg-gray-200 text-gray-800 rounded transition-opacity duration-300 ${
                page >= totalPages ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
            >
              Next
            </button>
          </div>
          </main>
        </div>
  
        {/* Modal for Adding/Editing Category */}
{modalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65">
    <div className="bg-[#eee9dc] rounded-[15px] shadow-lg w-full max-w-md p-6">
      <div className="flex justify-between items-center border-b border-white pb-3">
        <h2 className="text-xl font-semibold text-[#654321]">
          {editingCategory ? "Edit Category" : "Add New Category"}
        </h2>
        <button
          onClick={() => setModalOpen(false)}
          className="text-[#654321] hover:text-[#543210] font-medium"
        >
          ✖
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#484848]">Name</label>
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            className="w-full p-2 border border-[#f5deb3] rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#484848]">Description</label>
          <input
            name="description"
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full p-2 border border-[#f5deb3] rounded-[5px] bg-[#fffbf0] text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321]"
          />
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 bg-[#f5deb3] text-[#654321] rounded-[5px] text-sm font-medium hover:bg-[#e5c49b]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#654321] text-white rounded-[5px] text-sm font-medium hover:bg-[#543210]"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      </>
    );
  }
  
export default CategoryManagement;

