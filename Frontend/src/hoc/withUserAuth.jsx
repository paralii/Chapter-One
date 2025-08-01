import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const withUserAuth = (WrappedComponent) => {
  return function AuthComponent(props) {
    const user = useSelector((state) => state.auth.user);
    const location = useLocation();

    if (!user) {
      return <Navigate to="/login" state={{ backgroundLocation: location }} replace />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withUserAuth;
