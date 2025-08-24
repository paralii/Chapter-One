import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/Admin/AdminSideBar';
import PageHeader from '../../components/Admin/AdminPageHeader';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../redux/alertSlice';
import BookLoader from '../../components/common/BookLoader';
import { getAllInventory, getInventoryReport, updateProductStock } from '../../api/admin/inventoryAPI';
import showConfirmDialog from '../../components/common/ConformationModal';
import useDebounce from '../../hooks/useDebounce';

export default function InventoryDashboard({ onEdit, onLogout }) {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const limit = 10;
  const dispatch = useDispatch();

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchInventory();
    fetchReport();
  }, [search, page]);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllInventory({ params: { search, page, limit } });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch inventory');
      }
      setInventory(response.data.products || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error('Fetch Inventory Error:', err);
      setError(err.message || 'Failed to fetch inventory');
      dispatch(showAlert({ message: err.message || 'Failed to fetch inventory', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await getInventoryReport();
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch report');
      }
      setReport(response.data.report);
    } catch (err) {
      console.error('Fetch Report Error:', err);
    }
  };

  const handleUpdateStock = async (productId, quantity, reason) => {
    setLoading(true);
    setError('');
    try {
      const response = await updateProductStock({ productId, quantity, reason });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update stock');
      }
      dispatch(showAlert({ message: 'Stock updated successfully!', type: 'success' }));
      fetchInventory();
    } catch (err) {
      console.error('Update Stock Error:', err);
      setError(err.message || 'Failed to update stock');
      dispatch(showAlert({ message: err.message || 'Failed to update stock', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

const handleShowUpdateStockModal = (item) => {
  showConfirmDialog({
    message: `Do you want to update the stock for ${item.title}?`,
    inputs: [],
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    twoStep: true,
    nextStepConfig: {
      message: `Enter new stock quantity for ${item.title}`,
      inputs: [
        {
          name: "quantity",
          type: "number",
          label: "New Quantity",
          defaultValue: item.available_quantity.toString(),
          required: true,
          validate: (value) => {
            const parsed = parseInt(value);
            if (isNaN(parsed) || parsed < 0) {
              return "Quantity must be a non-negative number.";
            }
            return null;
          },
        },
      ],
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
    },
    onConfirm: (values) => {
      handleUpdateStock(item._id, parseInt(values.quantity), "Manual update");
    },
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
      setSearch('');
      setPage(1);
    };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-5 sm:p-10">
        <PageHeader
          title="Inventory"
          search={search}
          onSearchChange={handleSearchChange}
          handleClear={handleClear}
        />
        {report && (
          <div className="mb-6 bg-[#eee9dc] p-4 rounded-[15px]">
            <h2 className="text-lg font-semibold mb-2">Inventory Report</h2>
            <p>Total Products: {report.totalProducts}</p>
            <p>Total Items in Stock: {report.totalItemsInStock}</p>
            <p>Estimated Stock Value: ₹{report.estimatedStockValue}</p>
            <p>Low Stock Products: {report.lowStockCount}</p>
          </div>
        )}
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div className="text-center"><BookLoader /></div>
        ) : (
          <>
            <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
                    <th className="p-[10px]">Product Name</th>
                    <th className="p-[10px]">Category</th>
                    <th className="p-[10px]">Author</th>
                    <th className="p-[10px]">Quantity</th>
                    <th className="p-[10px]">Low Stock</th>
                    <th className="p-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item._id} className="bg-[#eee9dc] border-b border-b-white">
                      <td className="p-[10px]">{item.title}</td>
                      <td className="p-[10px]">{item.category_id?.name || 'N/A'}</td>
                      <td className="p-[10px]">{item.author_name || 'N/A'}</td>
                      <td className="p-[10px]">{item.available_quantity}</td>
                      <td className="p-[10px]">
                        {item.available_quantity < 5 ? (
                          <span className="text-red-600">Low (5)</span>
                        ) : (
                          'OK'
                        )}
                      </td>
                      <td className="p-[10px] flex gap-2">
                  
                        <button
                          className="bg-[#2196f3] hover:bg-[#1976d2] text-white rounded-[10px] py-2 px-4 text-[14px]"
                          onClick={() => handleShowUpdateStockModal(item)}
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-[10px] text-center text-[#484848]">
                        No inventory items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 mt-5">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}