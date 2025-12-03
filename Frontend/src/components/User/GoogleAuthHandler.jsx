import React, { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "../../redux/authSlice";
import { registerSocket } from "../../utils/socketClient";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const GoogleAuthHandler = ({ type = "signin" }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const authSource = urlParams.get("auth");

    if (authSource === "google") {
      dispatch(fetchCurrentUser())
        .unwrap()
        .then((res) => {
          const user = res?.user;

          if (user?._id) {
            registerSocket(user._id);
            localStorage.setItem("user", JSON.stringify(user));
            toast.success("Signed in with Google");
          }

          navigate("/", { replace: true });
        })
        .catch((error) => {
          console.error("Google auth failed:", error);
          toast.error("Failed to complete Google sign-in");
          navigate("/login", { replace: true });
        });
    }
  }, [dispatch, location.search, navigate]);

  const handleGoogleAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/user/auth/google`;
  };

  const isCallback = new URLSearchParams(location.search).get("auth") === "google";
  if (isCallback) {
    return <p className="text-center mt-10">Signing you in…</p>;
  }

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
