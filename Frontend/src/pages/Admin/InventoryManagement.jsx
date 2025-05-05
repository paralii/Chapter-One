import { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import PageHeader from "../../components/Admin/AdminPageHeader";

export default function InventoryDashboard({ onEdit, onLogout }) {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const dummyInventory = [
    { _id: "1", productName: "The Great Gatsby", quantity: 15, location: "Shelf A1" },
    { _id: "2", productName: "1984", quantity: 30, location: "Shelf B2" },
    { _id: "3", productName: "To Kill a Mockingbird", quantity: 20, location: "Shelf C3" },
    { _id: "4", productName: "Sapiens: A Brief History of Humankind", quantity: 50, location: "Shelf D4" },
    { _id: "5", productName: "The Catcher in the Rye", quantity: 40, location: "Shelf E5" },
  ];
  
  useEffect(() => {
    setInventory(dummyInventory);
    setTotal(dummyInventory.length);
  }, [search, page]);

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <div className="flex bg-[#fffbf0] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-5 sm:p-10">
        <PageHeader 
          title="Inventory"
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          handleClear={handleClear}
          handleLogout={onLogout}
        />

        <div className="bg-[#eee9dc] rounded-[15px] overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eee9dc] border-b border-b-white text-[#484848] text-[14px] font-medium text-left">
                <th className="p-[10px]">Item ID</th>
                <th className="p-[10px]">Product Name</th>
                <th className="p-[10px]">Quantity</th>
                <th className="p-[10px]">Location</th>
                <th className="p-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item._id} className="bg-[#eee9dc] border-b border-b-white">
                  <td className="p-[10px]">{item._id}</td>
                  <td className="p-[10px]">{item.productName}</td>
                  <td className="p-[10px]">{item.quantity}</td>
                  <td className="p-[10px]">{item.location || "N/A"}</td>
                  <td className="p-[10px]">
                    <button
                      className="bg-[#f5deb3] hover:bg-[#e5c49b] text-black rounded-[10px] py-2 px-4 text-[14px]"
                      onClick={() => onEdit(item._id)}
                    >
                      ✎ Edit
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-[10px] text-center text-[#484848]">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
