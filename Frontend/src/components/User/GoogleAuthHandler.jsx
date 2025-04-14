import React from "react";
import { API_BASE } from "../../../config";
import { FcGoogle } from "react-icons/fc";
import PropTypes from "prop-types";

const GoogleAuthHandler = ({ type = "signin" }) => {
  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE}/user/auth/google`;
  };

  return (
    <div className="flex justify-center">
      <button
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
