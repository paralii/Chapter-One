import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword, resetResetPasswordMessage } from "../../../redux/authSlice";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = ({ onClose = () => {}}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { otp } = location.state || {};

  const { loading, error, resetPasswordMessage } = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    dispatch(resetResetPasswordMessage());
  }, [dispatch]);
  
  useEffect(() => {
    if (resetPasswordMessage) {
      toast.success(resetPasswordMessage || "Password reset successful!");
      setTimeout(() => {
        navigate("/login", {
          state: { backgroundLocation: location.state?.backgroundLocation || "/" },
          replace: true,
        });
      }, 2000);
    }
  }, [resetPasswordMessage, navigate, location]);

  useEffect(() => {
    if (error && typeof error === "string") {
      toast.error(error);
      if (error.toLowerCase().includes("token") || error.toLowerCase().includes("expired")) {
        setTimeout(() => {
          navigate("/forgot-password", { replace: true });
        }, 2000);
      }
    }
  }, [error, navigate]);

  useEffect(() => {
    if (!token || !otp) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, otp, navigate]);


  const isStrongPassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      toast.error(
        "Password must be 8+ characters with uppercase, lowercase, number, and symbol."
      );
      return;
    }
    console.log("Resetting with values:", { otp, otpToken: token, newPassword });

    dispatch(resetPassword({ otpToken: token, otp, newPassword }));
  };

  return (
    <main className="w-full h-screen fixed top-0 left-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[480px] bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_100px_-50px_rgba(0,0,0,0.25)]"
      >
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-4 right-4 text-xl text-gray-500 hover:text-black"
          onClick={() =>
            navigate(location.state?.backgroundLocation || "/", { replace: true })
          }
        >
          &times;
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 font-Outfit">
          Reset Password
        </h1>
        <p className="text-center text-gray-600 text-sm sm:text-base mb-6 font-Inter">
          Choose a new password different from your old one.
        </p>

        {/* New Password */}
        <div className="relative mb-1">
          <input
            autoFocus
            type={showNew ? "text" : "password"}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="h-[50px] w-full rounded-[20px] bg-[#f5f4f1] px-5 pr-12 text-[16px] font-Inter outline-none"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={() => setShowNew((prev) => !prev)}
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 leading-snug px-1 mb-4">
          Must be at least 8 characters and include uppercase, lowercase, number, and symbol.
        </p>

        {/* Confirm Password */}
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="h-[50px] w-full rounded-[20px] bg-[#f5f4f1] px-5 pr-12 text-[16px] font-Inter outline-none"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={() => setShowConfirm((prev) => !prev)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="text-xs text-red-500 leading-snug px-1 mt-1">
            Passwords do not match
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-[50px] w-full rounded-[20px] bg-[#3c2712] text-white font-semibold text-[18px] font-Outfit hover:bg-[#4d321b] disabled:opacity-50 transition"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </main>
  );
};

export default ResetPassword;
