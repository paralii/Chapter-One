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
import * as productApi from "../../api/admin/productAPI";

// ---------- Helper Function for Cropping ----------
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous"; // Enable CORS if necessary
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
  // Manage which view to display: "manage", "add", or "edit"
  const [activeView, setActiveView] = useState("manage");
  // When editing, store the product id to edit
  const [editProductId, setEditProductId] = useState(null);

  // Navigation function (if needed in inner components)
  const navigate = useNavigate();

  // Render the appropriate inner component based on the active view
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
      {/* Render the selected view */}
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
  const limit = 10;

  const fetchProducts = async () => {
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
        onSearchChange={(e) => setSearch(e.target.value)}
        handleClear={handleClear}
        handleLogout={onLogout}
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
    </div>
  );
}

// ================================
// 2. AddProduct Inner Component
// ================================
function AddProduct({ onCancel, onLogout }) {
  // Product details
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
  const navigate = useNavigate();

  // For images: array of objects { file, preview, croppedImage }
  const [images, setImages] = useState([]);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/admin/categories`, {
        params: { search: "", page: 1, limit: 100, isDeleted: "true" },
      })
      .then((res) => setCategories(res.data.categories))
      .catch((err) => console.error(err))
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
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/products`, formData, { withCredentials: true });
      onCancel(); // Go back to manage view after successful submission
    } catch (err) {
      setError(err.response.data.error || "Error adding product");
    }
  };

  const handleLogout = async () => {
    try {
      await adminAxios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/logout`, {}, { withCredentials: true });
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;600;700&family=Roboto:wght@400;600;700&family=Nunito+Sans:wght@700&display=swap"
        rel="stylesheet"
      />
      <div className="flex-1 py-[46px] px-[32px] bg-[#fffbf0]">
        <header className="flex justify-between items-center mb-[40px]">
          <h1 className="text-[#202224] font-bold text-[32px] font-[Nunito Sans]">
            Add Product
          </h1>
          <button
            className="h-[46px] px-[20px] text-[16px] font-semibold text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-[19px] cursor-pointer"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>
        {error && (
          <div className="text-red-500 font-Inter text-[18px] mb-[20px] text-center">
            {error}
          </div>
        )}
        <form className="max-w-[900px] mx-auto" onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-[16px] mb-[33px]">
            <div className="flex-1">
              <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
                Book Title
              </label>
              <input
                type="text"
                className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
                Author Name
              </label>
              <input
                type="text"
                className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-[16px] mb-[33px]">
            <div className="flex-1">
              <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
                Price
              </label>
              <input
                type="number"
                className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
                Available Quantity
              </label>
              <input
                type="number"
                className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-[16px] mb-[33px]">
            <div className="flex-1">
              <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
                Category
              </label>
              <select
                className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
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
            <div className="flex-1">
              <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
                Upload Images
              </label>
              <div className="cursor-pointer bg-[#ececec] border border-[#cbcbcb] rounded-[15px] flex justify-center items-center w-full h-[58px]">
                <label htmlFor="fileInput" className="cursor-pointer">
                  <i className="ti-upload"></i>
                </label>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full"
                />
              </div>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        className="absolute inset-0 bg-opacity-50 text-black flex items-center justify-center text-xs"
                        onClick={() => openCropModal(index)}
                      >
                        Crop
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-[33px]">
            <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
              Description
            </label>
            <textarea
              className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[188px] p-[20px] text-[16px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="mb-[33px]">
  <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
    Highlights
  </label>
  <textarea
    className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[120px] p-[20px] text-[16px]"
    value={highlights}
    onChange={(e) => setHighlights(e.target.value)}
  />
</div>

<div className="mb-[33px]">
  <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
    Specifications
  </label>
  <textarea
    className="resize-none bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[120px] p-[20px] text-[16px]"
    value={specs}
    onChange={(e) => setSpecs(e.target.value)}
  />
</div>

<div className="flex flex-col lg:flex-row gap-[16px] mb-[33px]">
  <div className="flex-1">
    <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
      Discount (%)
    </label>
    <input
      type="number"
      className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
      value={discount > 100 ? 100 : discount < 0 ? 0 : discount}
      onChange={(e) => setDiscount(Number(e.target.value))}
      />
  </div>
  <div className="flex-1">
    <label className="block text-[#4d4d4d] mb-[2px] font-Outfit text-[20px]">
      Publisher
    </label>
    <input
      type="text"
      className="bg-[#ececec] border border-[#cbcbcb] rounded-[15px] w-full h-[59px] px-[20px] text-[16px]"
      value={publisher}
      onChange={(e) => setPublisher(e.target.value)}
    />
  </div>
</div>

          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="text-white bg-[#97c900] border border-[#cbcbcb] rounded-[15px] w-[212px] h-[58px] font-Roboto text-[26px] font-semibold"
            >
              Add Product
            </button>
            <button type="button" className="text-black bg-gray-200 rounded px-4 py-2" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
      {cropModalOpen && currentImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-[90%] max-w-[500px] bg-white p-4">
            <h2 className="text-lg font-semibold mb-4">Crop Image</h2>
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
              <button onClick={() => setCropModalOpen(false)} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button onClick={saveCroppedImage} className="px-4 py-2 bg-[#3c2712] text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ================================
// 3. EditProduct Inner Component
// ================================
function EditProduct({ productId, onCancel, onLogout }) {
  // Instead of using useParams, we receive productId via props
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [price, setPrice] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [highlight, setHighlight] = useState("");
const [specifications, setSpecifications] = useState("");
const [discount, setDiscount] = useState("");
const [publisher, setPublisher] = useState("");

  const [error, setError] = useState(null);

  // For new images (with cropping)
  const [images, setImages] = useState([]);
  // Holds current image preview URLs (fetched product images or newly selected files)
  const [imagePreviews, setImagePreviews] = useState([]);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    // Fetch product details and pre-fill fields
    axios
  .get(`${import.meta.env.VITE_API_BASE_URL}/admin/products/${productId}`, { withCredentials: true })
  .then((res) => {
    const prod = res.data;
    setTitle(prod.title);
    setCategory(prod.category_id._id);
    setAuthorName(prod.author_name);
    setPrice(prod.price);
    setAvailableQuantity(prod.available_quantity);
    setDescription(prod.description);
    setHighlight(prod.highlights || "");
    setSpecifications(prod.specs || "");
    setDiscount(prod.discount || "0");
    setPublisher(prod.publisher || "");
    setImagePreviews(prod.product_imgs);
  })
      .catch((err) =>
        setError(err.response?.data?.message || "Error fetching product")
      );

    // Fetch categories
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/admin/categories`, {
        params: { search: "", page: 1, limit: 100, isDeleted: "true" },
      })
      .then((res) => setCategories(res.data.categories))
      .catch((err) => console.error(err));
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
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category_id", category);
    formData.append("author_name", authorName);
    formData.append("price", price);
    formData.append("available_quantity", availableQuantity);
    formData.append("description", description);
    formData.append("highlights", highlight);
    formData.append("specs", specifications);
    formData.append("discount", discount);
    formData.append("publisher", publisher);
images.forEach((img) => formData.append("images", img.croppedImage));

    
    if (images.length > 0) {
      if (images.some((img) => !img.croppedImage)) {
        setError("Please ensure at least 3 images are cropped.");
        return;
      }
      images.forEach((imgObj) => {
        formData.append("images", imgObj.croppedImage);
      });
    }
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/products/${productId}`, formData, {
        withCredentials: true,
      });
      onCancel(); 
    } catch (err) {
      setError(err.response?.data?.error || "Error updating product");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/logout`, {}, { withCredentials: true });
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };
  const currentCategoryName = categories.find(cat => cat._id === category)?.name || "Select Category";

  return (
    <div className="flex-1 p-10 bg-yellow-50">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-[#202224] font-bold text-3xl font-[Nunito Sans]">
          Edit Product
        </h1>
        <button
          className="h-11 px-5 text-base font-semibold text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-full"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form className="max-w-4xl" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg mb-1">Book Title</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-lg mb-1">Author Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg mb-1">Price</label>
            <input
              type="number"
              className="w-full p-3 border rounded-lg"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-lg mb-1">Available Quantity</label>
            <input
              type="number"
              className="w-full p-3 border rounded-lg"
              value={availableQuantity}
              onChange={(e) => setAvailableQuantity(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-lg mb-1">Category</label>

<select
  className="w-full p-3 border rounded-lg"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  required
>
  {/* Show the current category name but use _id as value */}
  <option value={category}>{currentCategoryName}</option>

  {/* Render the rest of the options */}
  {categories
    .filter(cat => cat._id !== category) // Avoid duplicate
    .map((cat) => (
      <option key={cat._id} value={cat._id}>
        {cat.name}
      </option>
    ))}
</select>
        </div>
        <div className="mb-6">
          <label className="block text-lg mb-1">Upload Image</label>
          <input
            type="file"
            className="w-full p-3 border rounded-lg"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        {images.length > 0 ? (
          <div className="mb-6">
            <label className="block text-lg mb-1">New Image Previews</label>
            <div className="grid grid-cols-3 gap-4">
            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        className="absolute inset-0 bg-opacity-50 text-black flex items-center justify-center text-xs"
                        onClick={() => openCropModal(index)}
                      >
                        Crop
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : imagePreviews && imagePreviews.length > 0 ? (
          <div className="mb-6">
            <label className="block text-lg mb-1">Current Images</label>
            <div className="grid grid-cols-3 gap-4">
              {imagePreviews.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  <div>
    <label className="block text-lg mb-1">Publisher</label>
    <input
      type="text"
      className="w-full p-3 border rounded-lg"
      value={publisher}
      onChange={(e) => setPublisher(e.target.value)}
    />
  </div>
  <div>
    <label className="block text-lg mb-1">Discount (%)</label>
    <input
      type="number"
      className="w-full p-3 border rounded-lg"
      value={discount}
      onChange={(e) => setDiscount(e.target.value)}
    />
  </div>
</div>

<div className="mb-6">
  <label className="block text-lg mb-1">Highlight</label>
  <textarea
    className="w-full p-3 border rounded-lg"
    value={highlight}
    onChange={(e) => setHighlight(e.target.value)}
  ></textarea>
</div>

<div className="mb-6">
  <label className="block text-lg mb-1">Specifications</label>
  <textarea
    className="w-full p-3 border rounded-lg"
    value={specifications}
    onChange={(e) => setSpecifications(e.target.value)}
  ></textarea>
</div>

        <div className="mb-6">
          <label className="block text-lg mb-1">Description</label>
          <textarea
            className="w-full p-3 border rounded-lg h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className="flex gap-6">
          <button type="submit" className="bg-green-500 text-white px-6 py-3 rounded-lg text-xl">
            Update
          </button>
          <button type="button" className="bg-gray-500 text-white px-6 py-3 rounded-lg text-xl" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
      {cropModalOpen && currentImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-[90%] max-w-[500px] bg-white p-4">
            <h2 className="text-lg font-semibold mb-4">Crop Image</h2>
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
              <button onClick={() => setCropModalOpen(false)} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button onClick={saveCroppedImage} className="px-4 py-2 bg-[#3c2712] text-white rounded">
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
