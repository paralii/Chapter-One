import React, { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "../../redux/authSlice";
import { useLocation, useNavigate } from "react-router-dom";

const GoogleAuthHandler = ({ type = "signin" }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

useEffect(() => {
  console.log("GoogleAuthHandler useEffect fired", location.search);
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get("code")) {
    console.log("authSuccess detected, fetching user");
    dispatch(fetchCurrentUser())
      .unwrap()
      .then((userData) => {
        console.log("Fetched user:", userData);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/",{replace:true});
      })
      .catch((error) => {
        console.error("Failed to fetch user after Google auth:", error);
      });
  }
}, [dispatch, navigate, location.search]);
  
  const handleGoogleAuth = async () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/user/auth/google`;
  };

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={handleGoogleAuth}
        className="flex items-center gap-3 bg-white text-gray-700 font-medium px-5 py-2 border border-gray-300 rounded-lg shadow-md hover:bg-gray-100 transition-all duration-300"
      >
        <FcGoogle size={24} />
        <span>{type === "signup" ? "Sign up with Google" : "Sign in with Google"}</span>
      </button>
    </div>
  );
};

GoogleAuthHandler.propTypes = {
  type: PropTypes.oneOf(["signin", "signup"]),
};

export default GoogleAuthHandler;
