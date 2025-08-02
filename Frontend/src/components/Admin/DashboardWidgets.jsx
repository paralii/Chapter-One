import React, { useEffect, useState } from "react";
import adminAxios from "../../api/adminAxios";

// TotalUsersCard Component
export const TotalUsersCard = ({ filter, year, month }) => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const { data } = await adminAxios.get("/dashboard/stats", {
          params: { filter, year, month },
        });
        setTotalUsers(data.data.totalUsers || 0);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch total users");
      }
    };
    fetchTotalUsers();
  }, [filter, year, month]);

  return (
    <div className="w-full lg:w-1/3 lg:ml-[20px]">
      <div className="bg-white rounded-[14px] pt-[40px] px-[16px] pb-[3px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)]">
        <h3 className="text-[#202224] text-[16px] font-semibold">Total Users</h3>
        <div className="tracking-[1px] mt-[16px] text-[28px] font-bold">
          {error ? "Error" : totalUsers}
        </div>
        {error && (
          <div className="text-red-700 text-[12px] mt-2">{error}</div>
        )}
      </div>
    </div>
  );
};

// TotalOrdersCard Component
export const TotalOrdersCard = ({ filter, year, month }) => {
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalOrders = async () => {
      try {
        const { data } = await adminAxios.get("/dashboard/stats", {
          params: { filter, year, month },
        });
        setTotalOrders(data.data.totalOrders || 0);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch total orders");
      }
    };
    fetchTotalOrders();
  }, [filter, year, month]);

  return (
    <div className="w-full lg:w-1/3 lg:ml-[20px]">
      <div className="bg-white rounded-[14px] pt-[40px] px-[16px] pb-[3px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)]">
        <h3 className="text-[#202224] text-[16px] font-semibold">Total Orders</h3>
        <div className="tracking-[1px] mt-[16px] text-[28px] font-bold">
          {error ? "Error" : totalOrders}
        </div>
        {error && (
          <div className="text-red-700 text-[12px] mt-2">{error}</div>
        )}
      </div>
    </div>
  );
};

// TotalSalesCard Component
export const TotalSalesCard = ({ filter, year, month }) => {
  const [totalSales, setTotalSales] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalSales = async () => {
      try {
        const { data } = await adminAxios.get("/dashboard/stats", {
          params: { filter, year, month },
        });
        setTotalSales(data.data.totalSales || 0);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch total sales");
      }
    };
    fetchTotalSales();
  }, [filter, year, month]);

  return (
    <div className="w-full lg:w-1/3 lg:ml-[20px]">
      <div className="bg-white rounded-[14px] pt-[40px] px-[16px] pb-[3px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)]">
        <h3 className="text-[#202224] text-[16px] font-semibold">Total Sales</h3>
        <div className="tracking-[1px] mt-[16px] text-[28px] font-bold">
          {error ? "Error" : `Rs.${totalSales.toFixed(2)}`}
        </div>
        {error && (
          <div className="text-red-700 text-[12px] mt-2">{error}</div>
        )}
      </div>
    </div>
  );
};