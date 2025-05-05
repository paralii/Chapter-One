import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminPrivateRoute = () => {
  const admin = useSelector((state) => state.admin.admin);

  return admin ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminPrivateRoute;
