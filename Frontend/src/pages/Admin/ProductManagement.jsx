import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import Cropper from "react-easy-crop";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import PageHeader from "../../components/Admin/AdminPageHeader";
import adminAxios from "../../api/adminAxios";
import useDebounce from "../../hooks/useDebounce";

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = (error) => {
      reject(error);
    };
  });
};

// ================================
// Main ProductManagement Component
// ================================
function ProductManagement() {
  const [activeView, setActiveView] = useState("manage");
  const [editProductId, setEditProductId] = useState(null);
  const navigate = useNavigate();

  const renderView = () => {
    if (activeView === "manage") {
      return (
        <ManageProducts
          onAdd={() => setActiveView("add")}
          onEdit={(id) => {
            setEditProductId(id);
            setActiveView("edit");
          }}
          onLogout={() => navigate("/admin/login")}
        />
      );
    } else if (activeView === "add") {
      return (
        <AddProduct
          onCancel={() => setActiveView("manage")}
          onLogout={() => navigate("/admin/login")}
        />
      );
    } else if (activeView === "edit") {
      return (
        <EditProduct
          productId={editProductId}
          onCancel={() => setActiveView("manage")}
          onLogout={() => navigate("/admin/login")}
        />
      );
    }
  };

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      {renderView()}
    </div>
  );
}

// ================================
// 1. ManageProducts Inner Component
// ================================
function ManageProducts({ onAdd, onEdit, onLogout }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showListedOnly, setShowListedOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 500);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/products`, {
        params: {
          search,
          page,
          limit,
          isDeleted: !showListedOnly ? true : undefined,
        },
        withCredentials: true,
      });
      setProducts(response.data.products);
      setTotal(response.data.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, page, showListedOnly]);

  const toggleListing = async (id, isDeleted) => {
    confirmAlert({
      title: "Confirm Action",
      message: `Are you sure you want to ${isDeleted ? "restore" : "delete"} this Product?`,
      customUI: ({ onClose }) => (
        <div className="custom-confirm-modal">
          <h2 className="text-[#654321] text-lg font-semibold">
            {`Are you sure you want to ${isDeleted ? "restore" : "delete"} this Product?`}
          </h2>
          <div className="flex justify-center gap-4 mt-4">
            <button
              className="bg-[#654321] text-white px-4 py-2 rounded"
              onClick={async () => {
                try {
                  await axios.patch(
                    `${import.meta.env.VITE_API_BASE_URL}/admin/products/${id}/toggle`,
                    { isDeleted: !isDeleted },
                    { withCredentials: true }
                  );
                  fetchProducts();
                  toast.success(`${isDeleted ? "Product Restored" : "Product deleted!"}`);
                } catch (err) {
                  setError(err.response?.data?.error || "Error updating listing status");
                  toast.error("Failed to update the Product.");
                }
                onClose();
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
    if(search !== debouncedSearch){
      setSearch(debouncedSearch);
      setPage(1);
    }
  },[debouncedSearch]);

  const handleSearchChange = (value) => {
    setSearchInput(value)

  }

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 p-5 sm:p-10">
      <PageHeader 
        title="Products"
        search={search}
        onSearchChange={handleSearchChange}
        handleClear={handleClear}
      />
      
      <div className="mb-4">
        <button
          className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-lg font-medium"
          onClick={onAdd}
        >
          + Add New Product
        </button>
      </div>
      <div className="flex items-center mb-4">
        <label className="mr-2 font-semibold">Show only Available Products:</label>
        <input
          type="checkbox"
          checked={showListedOnly}
          onChange={() => setShowListedOnly(!showListedOnly)}
          className="h-5 w-5"
        />
      </div>
      {error && <div className="text-red-500 mb-5">{error}</div>}
      {loading ? (
        <div className="text-center text-[#654321] font-semibold">Loading...</div>
      ) : (
        <>
          <div className="bg-[#eee9dc] rounded-[15px] mb-[30px] overflow-x-auto sm:overflow-hidden">
            <table className="w-full border-collapse min-w-[800px] sm:min-w-0">
              <thead>
                <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
                  <th className="p-[10px]">Image</th>
                  <th className="p-[10px]">Book Name</th>
                  <th className="p-[10px]">Category</th>
                  <th className="p-[10px]">Price</th>
                  <th className="p-[10px]">Stock</th>
                  <th className="p-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((prod) => {
                    const imgUrl =
                      prod.product_imgs?.[0] || "https://via.placeholder.com/50x70";
                    return (
                      <tr key={prod._id} className="bg-[#eee9dc] border-b border-b-white">
                        <td className="p-[10px]">
                          <img
                            src={imgUrl}
                            alt={prod.title}
                            className="w-[50px] h-[70px] object-cover"
                          />
                        </td>
                        <td className="p-[10px]">{prod.title}</td>
                        <td className="p-[10px]">
                          {prod.category_id && prod.category_id.name ? prod.category_id.name : "N/A"}
                        </td>
                        <td className="p-[10px]">₹{prod.price}</td>
                        <td className="p-[10px]">{prod.available_quantity}</td>
                        <td className="p-[10px] flex items-center gap-2">
                          <button
                            className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px] font-medium"
                            onClick={() => onEdit(prod._id)}
                          >
                            ✎
                          </button>
                          <button
                            className={`${
                              prod.isDeleted
                                ? "bg-[#654321] hover:bg-[#543210] text-white"
                                : "bg-[#f5deb3] hover:bg-[#e5c49b] text-black"
                            } rounded-[10px] py-2 px-4 text-[14px] font-medium`}
                            onClick={() => toggleListing(prod._id, prod.isDeleted)}
                          >
                            {prod.isDeleted ? "Restore" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-[10px]" colSpan="6">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button
              onClick={() => setPage(page - 1)}
              className={`px-4 py-2 bg-gray-200 text-gray-800 rounded ${
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
              className={`px-4 py-2 bg-gray-200 text-gray-800 rounded ${
                page >= totalPages ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ================================
// 2. AddProduct Inner Component
// ================================
function AddProduct({ onCancel, onLogout }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [price, setPrice] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [specs, setSpecs] = useState("");
  const [discount, setDiscount] = useState(0);
  const [publisher, setPublisher] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setCategoriesLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/admin/categories`, {
        params: { search: "", page: 1, limit: 100, isDeleted: "true" },
        withCredentials: true,
      })
      .then((res) => {
        setCategories(res.data.categories);
        setCategoriesLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error fetching categories");
        setCategoriesLoading(false);
      });
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length < 3) {
      setError("Please upload at least 3 images.");
      return;
    }
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () =>
              resolve({
                file,
                preview: reader.result,
                croppedImage: null,
              });
            reader.onerror = (error) => reject(error);
          })
      )
    )
      .then((imageObjs) => {
        setImages(imageObjs);
        setError(null);
      })
      .catch((err) => {
        console.error("Error reading files:", err);
        setError("Error processing images");
      });
  };

  const openCropModal = (index) => {
    setCurrentImageIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    try {
      const imageObj = images[currentImageIndex];
      const croppedBlob = await getCroppedImg(imageObj.preview, croppedAreaPixels);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      const updatedImages = [...images];
      updatedImages[currentImageIndex].croppedImage = croppedBlob;
      updatedImages[currentImageIndex].preview = croppedUrl;
      setImages(updatedImages);
      setCropModalOpen(false);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length < 3 || images.some((img) => !img.croppedImage)) {
      setError("Please ensure at least 3 images are cropped.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category_id", category);
    formData.append("author_name", authorName);
    formData.append("price", price);
    formData.append("available_quantity", availableQuantity);
    formData.append("description", description);
    formData.append("highlights", highlights);
    formData.append("specs", specs);
    formData.append("discount", discount);
    formData.append("publisher", publisher);

    images.forEach((imgObj) => {
      formData.append("images", imgObj.croppedImage);
    });
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/products`, formData, {
        withCredentials: true,
      });
      toast.success("Product added successfully!");
      onCancel();
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error adding product";
        setError(errorMessage);
        if (errorMessage === "Product title already exists") {
          toast.error("A product with this title already exists.");
        } else {
          toast.error("Failed to add product.");
        }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await adminAxios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/logout`, {}, {
        withCredentials: true,
      });
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;600;700&family=Roboto:wght@400;600;700&family=Nunito+Sans:wght@700&display=swap"
        rel="stylesheet"
      />
      <div className="flex-1 p-5 sm:p-10 bg-[#fffbf0]">
        <PageHeader
          title="Add Product"
          handleLogout={handleLogout}
        />
        {error && (
          <div className="text-red-500 mb-5 text-center font-semibold">{error}</div>
        )}
        {categoriesLoading ? (
          <div className="text-center text-[#654321] font-semibold">Loading categories...</div>
        ) : (
          <form className="max-w-[900px] mx-auto" onSubmit={handleSubmit}>
            <div className="bg-[#eee9dc] rounded-[15px] p-6 mb-6">
              <h2 className="text-[#654321] font-semibold text-lg mb-4">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Book Title
                  </label>
                  <input
                    type="text"
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Author Name
                  </label>
                  <input
                    type="text"
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Category
                  </label>
                  <select
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Publisher
                  </label>
                  <input
                    type="text"
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={discount > 100 ? 100 : discount < 0 ? 0 : discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Upload Images (At least 3)
                </label>
                <div className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] flex justify-center items-center w-full h-[50px]">
                  <label htmlFor="fileInput" className="cursor-pointer text-[#484848]">
                    Choose Images
                  </label>
                  <input
                    type="file"
                    id="fileInput"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
{images.length > 0 && (
  <div className="mt-4 grid grid-cols-3 gap-4">
    {images.map((img, index) => (
      <div key={index} className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
        <img
          src={img.preview}
          alt={`Preview ${index + 1}`}
          className="w-full h-full object-cover rounded-[10px] border border-[#cbcbcb]"
        />
        <button
          type="button"
          className="absolute inset-0 bg-[#00000080] bg-opacity-50 text-white flex items-center justify-center text-xs rounded-[10px] hover:bg-opacity-70 transition-opacity"
          onClick={() => openCropModal(index)}
        >
          Crop
        </button>
      </div>
    ))}
  </div>
)}
              </div>
              <div className="mb-4">
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Description
                </label>
                <textarea
                  className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[120px] p-4 text-[14px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Highlights
                </label>
                <textarea
                  className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[120px] p-4 text-[14px]"
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Specifications
                </label>
                <textarea
                  className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[120px] p-4 text-[14px]"
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="submit"
                className="py-2 px-6 bg-[#654321] hover:bg-[#543210] text-white rounded-[10px] font-medium text-[16px]"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Product"}
              </button>
              <button
                type="button"
                className="py-2 px-6 bg-[#f5deb3] hover:bg-[#e5c49b] text-[#654321] rounded-[10px] font-medium text-[16px]"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {cropModalOpen && currentImageIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-[90%] max-w-[500px] bg-[#eee9dc] p-6 rounded-[15px]">
              <h2 className="text-[#654321] text-lg font-semibold mb-4">Crop Image</h2>
              <div className="w-full h-64 relative">
                <Cropper
                  image={images[currentImageIndex].preview}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setCropModalOpen(false)}
                  className="py-2 px-4 bg-[#f5deb3] hover:bg-[#e5c49b] text-[#654321] rounded-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCroppedImage}
                  className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-[10px]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ================================
// 3. EditProduct Inner Component
// ================================
function EditProduct({ productId, onCancel, onLogout }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [price, setPrice] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [specs, setSpecs] = useState("");
  const [discount, setDiscount] = useState(0);
  const [publisher, setPublisher] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setProductLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/admin/products/${productId}`, {
        withCredentials: true,
      })
      .then((res) => {
        const prod = res.data;
        setTitle(prod.title);
        setCategory(prod.category_id._id);
        setAuthorName(prod.author_name);
        setPrice(prod.price);
        setAvailableQuantity(prod.available_quantity);
        setDescription(prod.description);
        setHighlights(prod.highlights || "");
        setSpecs(prod.specs || "");
        setDiscount(prod.discount || 0);
        setPublisher(prod.publisher || "");
        setImagePreviews(prod.product_imgs || []);
        setProductLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error fetching product");
        setProductLoading(false);
      });

    setCategoriesLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/admin/categories`, {
        params: { search: "", page: 1, limit: 100, isDeleted: "true" },
        withCredentials: true,
      })
      .then((res) => {
        setCategories(res.data.categories);
        setCategoriesLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error fetching categories");
        setCategoriesLoading(false);
      });
  }, [productId]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length < 3) {
      setError("Please upload at least 3 images.");
      return;
    }
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () =>
              resolve({
                file,
                preview: reader.result,
                croppedImage: null,
              });
            reader.onerror = (error) => reject(error);
          })
      )
    )
      .then((imageObjs) => {
        setImages(imageObjs);
        setImagePreviews(imageObjs.map((img) => img.preview));
        setError(null);
      })
      .catch((err) => {
        console.error("Error reading files:", err);
        setError("Error processing images");
      });
  };

  const openCropModal = (index) => {
    setCurrentImageIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    try {
      const imageObj = images[currentImageIndex];
      const croppedBlob = await getCroppedImg(imageObj.preview, croppedAreaPixels);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      const updatedImages = [...images];
      updatedImages[currentImageIndex].croppedImage = croppedBlob;
      updatedImages[currentImageIndex].preview = croppedUrl;
      setImages(updatedImages);
      const updatedPreviews = [...imagePreviews];
      updatedPreviews[currentImageIndex] = croppedUrl;
      setImagePreviews(updatedPreviews);
      setCropModalOpen(false);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length > 0 && images.some((img) => !img.croppedImage)) {
      setError("Please ensure at least 3 images are cropped.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category_id", category);
    formData.append("author_name", authorName);
    formData.append("price", price);
    formData.append("available_quantity", availableQuantity);
    formData.append("description", description);
    formData.append("highlights", highlights);
    formData.append("specs", specs);
    formData.append("discount", discount);
    formData.append("publisher", publisher);

    if (images.length > 0) {
      images.forEach((imgObj) => {
        formData.append("images", imgObj.croppedImage);
      });
    }
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/products/${productId}`, formData, {
        withCredentials: true,
      });
      toast.success("Product updated successfully!");
      onCancel();
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error updating product";
        setError(errorMessage);
        if (errorMessage === "Product title already exists") {
          toast.error("A product with this title already exists.");
        } else {
          toast.error("Failed to update product.");
        }
      } finally {
        setLoading(false);
      }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/logout`, {}, {
        withCredentials: true,
      });
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryName = categories.find(cat => cat._id === category)?.name || "Select Category";

  return (
    <div className="flex-1 p-5 sm:p-10 bg-[#fffbf0]">
      <PageHeader
        title="Edit Product"
        handleLogout={handleLogout}
      />
      {error && (
        <div className="text-red-500 mb-5 text-center font-semibold">{error}</div>
      )}
      {productLoading || categoriesLoading ? (
        <div className="text-center text-[#654321] font-semibold">Loading product details...</div>
      ) : (
        <form className="max-w-[900px] mx-auto" onSubmit={handleSubmit}>
          <div className="bg-[#eee9dc] rounded-[15px] p-6 mb-6">
            <h2 className="text-[#654321] font-semibold text-lg mb-4">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Book Title
                </label>
                <input
                  type="text"
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Author Name
                </label>
                <input
                  type="text"
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Category
                </label>
                <select
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value={category}>{currentCategoryName}</option>
                  {categories
                    .filter(cat => cat._id !== category)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Publisher
                </label>
                <input
                  type="text"
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Price (₹)
                </label>
                <input
                  type="number"
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Discount (%)
                </label>
                <input
                  type="number"
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={discount > 100 ? 100 : discount < 0 ? 0 : discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                  Available Quantity
                </label>
                <input
                  type="number"
                  className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[50px] px-4 text-[14px]"
                  value={availableQuantity}
                  onChange={(e) => setAvailableQuantity(e.target.value)}
                  required
                  min="0"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                Upload New Images (At least 3 if replacing)
              </label>
              <div className="bg-[#ececec] border border-[#cbcbcb] rounded-[10px] flex justify-center items-center w-full h-[50px]">
                <label htmlFor="fileInputEdit" className="cursor-pointer text-[#484848]">
                  Choose Images
                </label>
                <input
                  type="file"
                  id="fileInputEdit"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
<div className="mt-4">
  {images.length > 0 && (
    <div className="grid grid-cols-3 gap-4">
      {images.map((img, index) => (
        <div key={index} className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
          <img
            src={img.preview}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover rounded-[10px] border border-[#cbcbcb]"
          />
          <button
            type="button"
            className="absolute inset-0 bg-[#00000080] bg-opacity-50 text-white flex items-center justify-center text-xs rounded-[10px] hover:bg-opacity-70 transition-opacity"
            onClick={() => openCropModal(index)}
          >
            Crop
          </button>
        </div>
      ))}
    </div>
  )}
  {imagePreviews.length > 0 && images.length === 0 && (
    <div className="grid grid-cols-3 gap-4">
      {imagePreviews.map((imgUrl, index) => (
        <div key={index} className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
          <img
            src={imgUrl}
            alt={`Current ${index + 1}`}
            className="w-full h-full object-cover rounded-[10px] border border-[#cbcbcb]"
          />
        </div>
      ))}
    </div>
  )}
</div>
            </div>
            <div className="mb-4">
              <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                Description
              </label>
              <textarea
                className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[120px] p-4 text-[14px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                Highlights
              </label>
              <textarea
                className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[120px] p-4 text-[14px]"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#484848] mb-2 font-Outfit text-[16px]">
                Specifications
              </label>
              <textarea
                className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[10px] w-full h-[120px] p-4 text-[14px]"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="py-2 px-6 bg-[#654321] hover:bg-[#543210] text-white rounded-[10px] font-medium text-[16px]"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Product"}
            </button>
            <button
              type="button"
              className="py-2 px-6 bg-[#f5deb3] hover:bg-[#e5c49b] text-[#654321] rounded-[10px] font-medium text-[16px]"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {cropModalOpen && currentImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[90%] max-w-[500px] bg-[#eee9dc] p-6 rounded-[15px]">
            <h2 className="text-[#654321] text-lg font-semibold mb-4">Crop Image</h2>
            <div className="w-full h-64 relative">
              <Cropper
                image={images[currentImageIndex].preview}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCropModalOpen(false)}
                className="py-2 px-4 bg-[#f5deb3] hover:bg-[#e5c49b] text-[#654321] rounded-[10px]"
              >
                Cancel
              </button>
              <button
                onClick={saveCroppedImage}
                className="py-2 px-4 bg-[#654321] hover:bg-[#543210] text-white rounded-[10px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;