import React from "react";
import { NavLink } from "react-router-dom";

function AdminSidebar() {
  const navItemClasses = (isActive) =>
    `flex items-center py-2 cursor-pointer rounded transition-colors focus:outline-none focus:ring-2 ${
      isActive
        ? "bg-[#c29d78] text-white"
        : "hover:bg-[#c29d788a] hover:text-white"
    }`;

  return (
    <aside className="w-[250px] bg-[#f5efdf]  border-r border-r-[#e0e0e0] p-5">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-8">CHAPTER ONE</h1>
        <nav className="flex flex-col space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/f82b0047e6557aa901c15537d58a7ab6971e1d1d635e2a205c02ec234f11ad61?placeholderIfAbsent=true"
                alt="Dashboard icon"
              />
            </div>
            <span className="text-base">Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/user-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/f933064a6bab49b74f8d5722595a056cbddbca1247d9b1a20a7e0fc8d56413a0?placeholderIfAbsent=true"
                alt="Customers icon"
              />
            </div>
            <span className="text-base">Customers</span>
          </NavLink>
          <NavLink
            to="/admin/product-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/126b232c82239fc3740982b7c8240f84671d1b6e2a4d00141995b3c82d24c4a5?placeholderIfAbsent=true"
                alt="Products icon"
              />
            </div>
            <span className="text-base">Products</span>
          </NavLink>
          <NavLink
            to="/admin/category-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/e28a25c9074d5ac2f30abed078d346fcd7e0ee85dc434b9545165db99399b2cb?placeholderIfAbsent=true"
                alt="Category icon"
              />
            </div>
            <span className="text-base">Category</span>
          </NavLink>
          <NavLink
            to="/admin/order-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/395e632ba7027a03ce2c35c1aa8bcc4534da249d8c136cdcc01b5043a72ddc87?placeholderIfAbsent=true"
                alt="Orders icon"
              />
            </div>
            <span className="text-base">Orders</span>
          </NavLink>
          <NavLink
            to="/admin/offer-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/5b4c30ca0a115c712594c2dce59791803bec209977f960ad8b2c1a3d2ecaac23?placeholderIfAbsent=true"
                alt="Offers icon"
              />
            </div>
            <span className="text-base">Offers</span>
          </NavLink>
          <NavLink
            to="/admin/coupon-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/62c0850b8b04ac44a74da13d5dc8cd1f6c22413704c3edf1f77b1c1a6a374e65?placeholderIfAbsent=true"
                alt="Coupon icon"
                className="w-4 h-6 object-contain"
              />
            </div>
            <span className="text-base">Coupon</span>
          </NavLink>
          <NavLink
            to="/admin/inventory-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/62c0850b8b04ac44a74da13d5dc8cd1f6c22413704c3edf1f77b1c1a6a374e65?placeholderIfAbsent=true"
                alt="Coupon icon"
                className="w-4 h-6 object-contain"
              />
            </div>
            <span className="text-base">Inventory</span>
          </NavLink>
          {/* <NavLink
            to="/admin/referral-management"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/62c0850b8b04ac44a74da13d5dc8cd1f6c22413704c3edf1f77b1c1a6a374e65?placeholderIfAbsent=true"
                alt="Coupon icon"
                className="w-4 h-6 object-contain"
              />
            </div>
            <span className="text-base">Referral</span>
          </NavLink>
          <NavLink
            to="/admin/sales-report"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2 ml-2 ">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/62c0850b8b04ac44a74da13d5dc8cd1f6c22413704c3edf1f77b1c1a6a374e65?placeholderIfAbsent=true"
                alt="Coupon icon"
                className="w-4 h-6 object-contain"
              />
            </div>
            <span className="text-base">Sales Report</span>
          </NavLink>
          <NavLink
            to="/admin/banner"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/a5f3707cf9a70e0fefedd291ecc4ba87d28f432cd3c6c140f91080530db1f64b?placeholderIfAbsent=true"
                alt="Banner icon"
              />
            </div>
            <span className="text-base">Banner management</span>
          </NavLink>

          <NavLink
            to="/admin/manage-reviews"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/2897cc0ce7ace4dd1f7e6d2c1b779540e7fa6d14150e07ac6bd13caecdf99b1a?placeholderIfAbsent=true"
                alt="Reviews icon"
              />
            </div>
            <span className="text-base">Reviews</span>
          </NavLink>

          <NavLink
            to="/admin/contactus"
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <div className="mr-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/725e3931e5524a72a2f89a378008974f/ec87dc681e37debe99a62493cd54aec112d27a3f2efb2b092fea56d5226dbe94?placeholderIfAbsent=true"
                alt="Contact icon"
                className="w-5 h-6 object-contain"
              />
            </div>
            <span className="text-base">Contact us</span>
          </NavLink> */}
        </nav>
      </div>
    </aside>
  );
}

export default AdminSidebar;
