import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const withAdminAuth = (WrappedComponent) => {
  return function AdminAuthComponent(props) {
    const admin = useSelector((state) => state.admin.admin);
    const location = useLocation();

    if (!admin) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <WrappedComponent {...props} />;
  };
};
export default withAdminAuth;
