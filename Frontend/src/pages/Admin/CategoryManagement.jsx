import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import useDebounce from "../../hooks/useDebounce";
import {getCategories, createCategory, updateCategory, deleteCategory,} from "../../api/admin/categoryAPI";
function CategoryManagement() {

  // State for categories, pagination, and filters
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showListedOnly, setShowListedOnly] = useState(true);
  const totalPages = Math.ceil(total / limit);

  // Modal & form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Error state
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await getCategories({
        search,
        page,
        limit,
        isDeleted: !showListedOnly ? false : undefined,
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

  // Handle add or edit submit
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
      try {
        await updateCategory(editingCategory._id, cleanedData);
        toast.success("Category updated successfully!");
        setModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: "", description: "" });
        fetchCategories();
      } catch (err) {
        toast.error(err.response?.data?.error || "Error updating category");
      }
    } else {
      try {
        await createCategory(cleanedData);
        toast.success("Category added successfully!");
        setModalOpen(false);
        setFormData({ name: "", description: "" });
        fetchCategories();
      } catch (err) {
        toast.error(err.response?.data?.error || "Error adding category");
      }
    }
  };

  // Open the modal for editing
  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description,
    });
    setModalOpen(true);
  };

  // Open modal for adding a new category
  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setModalOpen(true);
  };

  // Delete/Restore handler
  const handleDelete = async (id, isDeleted, isListed) => {
    confirmAlert({
      title: "Confirm Action",
      message: `Are you sure you want to ${isDeleted ? "restore" : "delete"} this category?`,
      customUI: ({ onClose }) => (
        <div className="p-4 sm:p-5 bg-white rounded-lg max-w-sm w-full">
          <h2 className="text-base sm:text-lg font-semibold text-[#654321]">
            {`Are you sure you want to ${isDeleted ? "restore" : "delete"} this category?`}
          </h2>
          <div className="flex gap-4 mt-4 justify-center">
            <button
              className="bg-[#654321] text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
              onClick={async () => {
                try {
                  await deleteCategory(id, { params: { isDeleted: !isDeleted, isListed: !isListed } });
                  fetchCategories();
                  toast.success(`${isDeleted ? "Category Restored" : "Category deleted!"}`);
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
              className="bg-[#f5deb3] text-[#654321] px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
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
  }, [debouncedSearch]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <>
      <div className="flex min-h-screen bg-[#fffbf0]">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-16">
          <PageHeader
            title="Categories"
            search={search}
            onSearchChange={handleSearchChange}
            handleClear={handleClear}
          />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
            <div className="flex items-center">
              <label className="mr-2 text-xs sm:text-sm lg:text-base font-semibold text-[#484848]">
                Show only Available Categories:
              </label>
              <input
                type="checkbox"
                checked={showListedOnly}
                onChange={() => setShowListedOnly(!showListedOnly)}
                className="h-5 w-5"
              />
            </div>
            <button
              className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-lg text-xs sm:text-sm lg:text-base font-medium w-full sm:w-auto"
              onClick={openAddModal}
            >
              + Add New Category
            </button>
          </div>

          {error && (
            <div className="text-red-500 mb-4 sm:mb-6 text-sm sm:text-base">{error}</div>
          )}

          <div className="overflow-x-auto bg-[#eee9dc] rounded-xl mb-6 sm:mb-8">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#eee9dc] border-b border-white text-[#484848] text-xs sm:text-sm font-medium text-left">
                  <th className="p-2 sm:p-3">S.No</th>
                  <th className="p-2 sm:p-3">Category Name</th>
                  <th className="p-2 sm:p-3">Description</th>
                  <th className="p-2 sm:p-3">Listed</th>
                  <th className="p-2 sm:p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <tr key={cat._id} className="bg-[#eee9dc] border-b border-white hover:bg-[#e5d9c0] transition-colors">
                      <td className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base font-medium w-[10%]">
                        {index + 1 + (page - 1) * limit}
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base font-medium w-[25%] truncate">
                        {cat.name}
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base font-medium w-[35%] truncate">
                        {cat.description}
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base font-medium w-[15%]">
                        {cat.isDeleted ? "Deleted" : "Listed"}
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 flex items-center gap-2 sm:gap-3 lg:gap-4 w-[15%]">
                        <button
                          className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-lg px-3 py-1 sm:px-4 sm:py-1.5 lg:px-5 lg:py-2 text-xs sm:text-sm lg:text-base font-medium transition-colors"
                          onClick={() => openEditModal(cat)}
                        >
                          Edit
                        </button>
                        <button
                          className={`rounded-lg px-3 py-1 sm:px-4 sm:py-1.5 lg:px-5 lg:py-2 text-xs sm:text-sm lg:text-base font-medium cursor-pointer transition-colors ${
                            cat.isDeleted
                              ? "bg-[#654321] hover:bg-[#543210] text-white"
                              : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
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
                      <td
                        className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base font-medium text-center"
                        colSpan="5"
                      >
                        No categories found.
                      </td>
                    </tr>
                    )
                }
              </tbody>
            </table>
          </div>
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

      {/* Modal for Adding/Editing Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="bg-[#eee9dc] rounded-xl shadow-lg w-full max-w-xs sm:max-w-md lg:max-w-lg p-4 sm:p-6">
            <div className="flex justify-between items-center border-b border-white pb-2 sm:pb-3">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#654321]">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#654321] hover:text-[#543210] text-sm sm:text-base font-medium"
              >
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-medium text-[#484848]">
                  Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full p-2 border border-[#f5deb3] rounded-lg bg-[#fffbf0] text-xs sm:text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-medium text-[#484848]">
                  Description
                </label>
                <input
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-2 border border-[#f5deb3] rounded-lg bg-[#fffbf0] text-xs sm:text-sm font-medium text-[#484848] focus:outline-none focus:border-[#654321]"
                />
              </div>
              <div className="flex justify-end gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-[#f5deb3] text-[#654321] rounded-lg text-xs sm:text-sm font-medium hover:bg-[#e5c49b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-[#654321] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#543210]"
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