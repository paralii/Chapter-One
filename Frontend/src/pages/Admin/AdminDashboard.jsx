import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import { TotalUsersCard, TotalOrdersCard, TotalSalesCard } from "../../components/Admin/DashboardWidgets";
import { adminLogout } from "../../redux/adminSlice";
import adminAxios from "../../api/adminAxios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from "chart.js";

ChartJS.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("yearly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {}, { withCredentials: true });
      dispatch(adminLogout());
      navigate("/admin/login");
    } catch (err) {
      setError(err.response?.data?.message || "Logout failed");
    }
  };

  const fetchChartData = async () => {
    try {
      const { data } = await adminAxios.get("/sales-report", {
        params: { type: filter, year, month },
      });
      const orders = data.data.orders || [];

      let labels, salesData;
      if (filter === "yearly") {
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        salesData = Array(12).fill(0);
        orders.forEach((order) => {
          const monthIndex = new Date(order.createdAt).getMonth();
          salesData[monthIndex] += order.netAmount || 0;
        });
      } else {
        const daysInMonth = new Date(year, month, 0).getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
        salesData = Array(daysInMonth).fill(0);
        orders.forEach((order) => {
          const dayIndex = new Date(order.createdAt).getDate() - 1;
          salesData[dayIndex] += order.netAmount || 0;
        });
      }

      setChartData({
        labels,
        datasets: [
          {
            label: "Sales (Rs)",
            data: salesData,
            borderColor: "#ff8266",
            backgroundColor: "rgba(255, 130, 102, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch chart data");
    }
  };

  const fetchTopProducts = async () => {
    try {
      const { data } = await adminAxios.get("/dashboard/top-products", {
        params: { filter, year, month },
      });
      setTopProducts(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch top products");
    }
  };

  const fetchTopCategories = async () => {
    try {
      const { data } = await adminAxios.get("/dashboard/top-categories", {
        params: { filter, year, month },
      });
      setTopCategories(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch top categories");
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data } = await adminAxios.get("/dashboard/recent-orders");
      setRecentOrders(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch recent orders");
    }
  };

  const handleDownloadLedger = async () => {
    try {
      const response = await adminAxios.get("/dashboard/ledger-book", {
        params: { year },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ledger-book-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Ledger book download failed");
    }
  };

  useEffect(() => {
    fetchChartData();
    fetchTopProducts();
    fetchTopCategories();
    fetchRecentOrders();
  }, [filter, year, month]);

  const getStatusColor = status => {
    switch(status) {
      case "Processing": return "bg-yellow-200 text-yellow-800";
      case "Shipped": return "bg-blue-200 text-blue-800";
      case "OutForDelivery": return "bg-orange-200 text-orange-800";
      case "Delivered": return "bg-green-200 text-green-800";
      case "Cancelled": return "bg-red-200 text-red-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const mappedRecentOrders = recentOrders.map(order => ({
  id: order.orderID,
  name: `${order.user_id.firstname} ${order.user_id.lastname}`,
  address: `${order.address_id.name}, ${order.address_id.place}, ${order.address_id.city}, ${order.address_id.state} - ${order.address_id.pin}`,
  date: new Date(order.order_date).toLocaleDateString("en-GB"),
  status: order.status,
  statusColor: getStatusColor(order.status), 
}));


  return (
    <div className="flex min-h-screen bg-[#fffbf0]">
      <AdminSidebar />
      <main className="flex-1 p-5 sm:p-10">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-[#6e4949] text-[26px] font-semibold">Dashboard</h1>
          <button
            className="w-full sm:w-[132px] h-[46px] text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-[19px] text-[16px] font-semibold cursor-pointer"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-[14px]">
            {error}
          </div>
        )}

        {/* Filter Section */}
        <section className="mb-[20px]">
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-[8px] p-2 bg-white text-[#202224]"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded-[8px] p-2 bg-white text-[#202224]"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {filter === "monthly" && (
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded-[8px] p-2 bg-white text-[#202224]"
              >
                <option value="">Select Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>
          {/* Ledger Book Section */}
        <section className="mt-[44px]">
          <button
            className="w-full sm:w-[200px] h-[46px] text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-[19px] text-[16px] font-semibold cursor-pointer"
            onClick={handleDownloadLedger}
          >
            Download Ledger Book
          </button>
        </section>

        {/* Stats Section*/}
        <section className="mt-[40px] lg:mt-[56px]">
          <div className="flex flex-col lg:flex-row gap-[20px]">
            <TotalUsersCard filter={filter} year={year} month={month} />
            <TotalOrdersCard filter={filter} year={year} month={month} />
            <TotalSalesCard filter={filter} year={year} month={month} />
          </div>
        </section> 

        {/* Performance Chart */}
        <section className="mt-[24px] bg-white p-4 rounded-[14px] border border-[#b9b9b9]">
          <h2 className="text-[#202224] text-[18px] font-semibold mb-4">Sales Performance</h2>
          {chartData.labels.length ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: "Sales (Rs)" } },
                  x: { title: { display: true, text: filter === "yearly" ? "Month" : "Day" } },
                },
              }}
            />
          ) : (
            <div className="text-center text-[#202224] text-[14px]">No sales data available</div>
          )}
        </section>

        {/* Top Products Section */}
        <section className="mt-[44px]">
          <div className="bg-white border border-[#b9b9b9] rounded-[14px] pb-[22px]">
            <div className="bg-[#fcfdfd] border border-[#d5d5d5] rounded-t-[14px] pt-[17px] pb-[17px] pl-[25px] pr-[25px] mt-[-24px] text-[14px] font-extrabold text-[#202224]">
              Top 10 Best-Selling Products
            </div>
            <div className="bg-[#fcfdfd] border border-[#d5d5d5] flex justify-between pt-[17px] pb-[17px] pl-[25px] pr-[25px] text-[14px] font-extrabold text-[#202224]">
              <div>Name</div>
              <div>Total Sold</div>
            </div>
            {topProducts.length ? (
              topProducts.map((product, index) => (
                <div key={product._id}>
                  <div className="flex justify-between mt-[21px] mx-[26px] text-[#202224] text-[14px] font-semibold">
                    <div>{product.name}</div>
                    <div>{product.totalSold}</div>
                  </div>
                  {index < topProducts.length - 1 && (
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/f461559c263a4c75a6bb3b817ec0e06f15691c3c01bf8d4f392d08d24adb60c1?placeholderIfAbsent=true"
                      alt="Divider"
                      className="w-full mt-[19px] object-contain object-center"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-[#202224] text-[14px] mt-[21px]">No products found</div>
            )}
          </div>
        </section>

        {/* Top Categories Section */}
        {/* <section className="mt-[44px]">
          <div className="bg-white border border-[#b9b9b9] rounded-[14px] pb-[22px]">
            <div className="bg-[#fcfdfd] border border-[#d5d5d5] rounded-t-[14px] pt-[17px] pb-[17px] pl-[25px] pr-[25px] mt-[-24px] text-[14px] font-extrabold text-[#202224]">
              Top 10 Best-Selling Categories
            </div>
            <div className="bg-[#fcfdfd] border border-[#d5d5d5] flex justify-between pt-[17px] pb-[17px] pl-[25px] pr-[25px] text-[14px] font-extrabold text-[#202224]">
              <div>Name</div>
              <div>Total Sold</div>
            </div>
            {topCategories.length ? (
              topCategories.map((category, index) => (
                <div key={category._id}>
                  <div className="flex justify-between mt-[21px] mx-[26px] text-[#202224] text-[14px] font-semibold">
                    <div>{category.name}</div>
                    <div>{category.totalSold}</div>
                  </div>
                  {index < topCategories.length - 1 && (
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/f461559c263a4c75a6bb3b817ec0e06f15691c3c01bf8d4f392d08d24adb60c1?placeholderIfAbsent=true"
                      alt="Divider"
                      className="w-full mt-[19px] object-contain object-center"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-[#202224] text-[14px] mt-[21px]">No categories found</div>
            )}
          </div>
        </section> */}

        {/* Orders Section */}
        <section className="mt-[44px]">
          <div className="bg-white border border-[#b9b9b9] rounded-[14px] pb-[22px] font-sans">
            <div className="bg-[#fcfdfd] border border-[#d5d5d5] rounded-t-[14px] flex justify-between pt-[17px] pb-[17px] pl-[25px] pr-[25px] mt-[-24px] text-[14px] font-extrabold text-[#202224]">
              <div>ID</div>
              <div>NAME</div>
              <div>ADDRESS</div>
              <div>DATE</div>
              <div>STATUS</div>
            </div>
            {recentOrders.length ? (
              mappedRecentOrders.map((order, index) => (
                <div key={order.id}>
                  <div className="flex justify-between mt-[21px] mx-[26px]">
                    <div className="flex gap-x-[54px] text-[#202224] text-[14px] font-semibold">
                      <div>{order.id}</div>
                      <div>{order.name}</div>
                      <div>{order.address}</div>
                    </div>
                    <div className="flex gap-x-[100px]">
                      <div className="text-[14px] font-semibold">{order.date}</div>
                      <div className={`text-[12px] font-bold py-[6px] px-[14px] rounded-[5px] text-center ${order.statusColor}`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                  {index < recentOrders.length - 1 && (
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/f461559c263a4c75a6bb3b817ec0e06f15691c3c01bf8d4f392d08d24adb60c1?placeholderIfAbsent=true"
                      alt="Divider"
                      className="w-full mt-[19px] object-contain object-center"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-[#202224] text-[14px] mt-[21px]">No recent orders found</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;