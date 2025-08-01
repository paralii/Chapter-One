import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../../../redux/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (email) setEmailError("");
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValidEmail = /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    const resultAction = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(resultAction)) {
    toast.success("OTP sent to your email for password reset");
    navigate("/verify-otp", {
      state: {
        email,
        from: "forgot-password",
        backgroundLocation: location.state?.backgroundLocation || "/",
      },
      replace: true,
    });
  } else {
    toast.error(
      resultAction.payload?.message ||
      resultAction.error?.message ||
      "Failed to send reset instructions."
    );
  }
};

  return (
    <div className="w-full h-screen fixed top-0 left-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[460px] bg-white rounded-[30px] p-6 sm:p-8 shadow-[0_4px_100px_-50px_rgba(38,30,0,0.25)]"
      >
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-4 right-4 text-xl text-gray-500 hover:text-black"
          onClick={() =>
            navigate("/", { replace: true })
          }
        >
          &times;
        </button>

        <div className="flex flex-col items-center mb-6">
          <i className="ti ti-lock text-[48px] text-[#3c2712] mb-2"></i>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-center font-Outfit mb-1">
            Forgot Password?
          </h1>
          <p className="text-[14px] text-center text-[#555] font-light">
            Enter your email to receive reset instructions.
          </p>
        </div>

        {error && (
  <p className="text-red-500 text-sm text-center mb-3">
    {typeof error === "object" ? error.message || "Something went wrong." : error}
  </p>
)}


        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 text-[16px] outline-none font-Inter"
          />
          {emailError && (
            <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full h-[50px] rounded-[20px] bg-[#3c2712] text-white font-bold text-[18px] font-Outfit mb-4 transition-all duration-200 hover:bg-[#4d321b] disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="text-center text-[15px] font-Inter">
          Remember your password?
          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                state: { backgroundLocation: location.state?.backgroundLocation || "/" },
                replace: true,
              })
            }
            className="text-[#8e4700] ml-2 underline hover:text-[#b35900]"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
