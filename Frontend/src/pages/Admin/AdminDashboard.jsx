import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AdminSidebar from "../../components/Admin/AdminSideBar";
import { TotalUsersCard, TotalOrdersCard, TotalSalesCard } from "../../components/Admin/DashboardWidgets";
import { adminLogout } from "../../redux/adminSlice";
import adminAxios from "../../api/adminAxios";

function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = useState(""); // Extend for additional filtering if needed

  const handleLogout = async () => {
    try {
      await adminAxios.post("/logout", {}, { withCredentials: true });
      dispatch(adminLogout());
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fffbf0]">
      {/* Sidebar */}
      <AdminSidebar />
      <main className="flex-1 p-5 sm:p-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-[#6e4949] text-[26px] font-semibold">Dashboard</h1>
          <button
            className="w-full sm:w-[132px] h-[46px] text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-[19px] text-[16px] font-semibold cursor-pointer"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

        {/* Stats Section */}
        <section className="mt-[40px] lg:mt-[56px]">
          <div className="flex flex-col lg:flex-row gap-[20px]">
            <TotalUsersCard />
            <TotalOrdersCard />
            <TotalSalesCard />
          </div>
        </section>

        {/* Performance Chart */}
        <section className="mt-[24px]">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/9e5d7a3babdb0077cd6ed05d63adfc765509ace76aafe645a21c7abf10bc09dc?placeholderIfAbsent=true"
            alt="Performance chart"
            className="w-full aspect-[2.42] object-contain object-center"
          />
        </section>

        {/* Orders Section (sample static orders) */}
        <section className="mt-[44px]">
          <div className="bg-white border border-[#b9b9b9] rounded-[14px] pb-[22px] font-sans">
            {/* Table Header */}
            <div className="bg-[#fcfdfd] border border-[#d5d5d5] rounded-t-[14px] flex justify-between pt-[17px] pb-[17px] pl-[25px] pr-[25px] mt-[-24px] text-[14px] font-extrabold text-[#202224]">
              <div>ID</div>
              <div>NAME</div>
              <div>ADDRESS</div>
              <div>DATE</div>
              <div>STATUS</div>
            </div>
            {[
              {
                id: "00001",
                name: "Christine Brooks",
                address: "089 Kutch Green Apt. 448",
                date: "04 Sep 2019",
                status: "Completed",
                statusColor: "text-[#00c123]",
              },
              {
                id: "00002",
                name: "Rosie Pearson",
                address: "979 Immanuel Ferry Suite 526",
                date: "28 May 2019",
                status: "Processing",
                statusColor: "text-[#fec53d]",
              },
              {
                id: "00003",
                name: "Darrell Caldwell",
                address: "8587 Frida Ports",
                date: "23 Nov 2019",
                status: "Rejected",
                statusColor: "text-[#ef3826]",
              },
            ].map((order, index) => (
              <div key={order.id}>
                {/* Table Row */}
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
                {/* Divider */}
                {index < 2 && (
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/f461559c263a4c75a6bb3b817ec0e06f15691c3c01bf8d4f392d08d24adb60c1?placeholderIfAbsent=true"
                    alt="Divider"
                    className="w-full mt-[19px] object-contain object-center"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
