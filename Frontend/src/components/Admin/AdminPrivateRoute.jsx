import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const AdminPrivateRoute = ({ children }) => {
  const { admin } = useSelector((state) => state.admin);
  const location = useLocation();

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
};

export default AdminPrivateRoute;
