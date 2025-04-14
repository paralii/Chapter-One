import { useEffect, useState } from "react";


// TotalUsersCard Component
export const TotalUsersCard = () => {
  const [totalUsers] = useState(22);

  return (
    <div className="w-full lg:w-1/3 lg:ml-[20px]">
      <div className="bg-white rounded-[14px] pt-[40px] px-[16px] pb-[3px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)]">
        <h3 className="text-[#202224] text-[16px] font-semibold">Total Users</h3>
        <div className="tracking-[1px] mt-[16px] text-[28px] font-bold">
          {totalUsers}
        </div>
      </div>
    </div>
  );
};

// TotalOrdersCard Component
export const TotalOrdersCard = () => {
  const [totalOrders] = useState(22);

  return (
    <div className="w-full lg:w-1/3 lg:ml-[20px]">
      <div className="bg-white rounded-[14px] pt-[40px] px-[16px] pb-[3px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)]">
        <h3 className="text-[#202224] text-[16px] font-semibold">Total Orders</h3>
        <div className="tracking-[1px] mt-[16px] text-[28px] font-bold">
          {totalOrders}
        </div>
      </div>
    </div>
  );
};

// TotalSalesCard Component
export const TotalSalesCard = () => {
  const [totalSales] = useState(22);

  return (
    <div className="w-full lg:w-1/3 lg:ml-[20px]">
      <div className="bg-white rounded-[14px] pt-[40px] px-[16px] pb-[3px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)]">
        <h3 className="text-[#202224] text-[16px] font-semibold">Total Sales</h3>
        <div className="tracking-[1px] mt-[16px] text-[28px] font-bold">
          {totalSales}
        </div>
      </div>
    </div>
  );
};
