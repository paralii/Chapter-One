import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  verifyOTP,
  resendOtpForVerify,
  verifyForgotPasswordOTP,
  resendForgotPasswordOTP,
} from "../../../redux/authSlice";
import { confirmEmailChange, resendOTP } from "../../../api/user/UserAPI";
import { toast } from "react-toastify";

const OTPVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(10);
  const [isResendActive, setIsResendActive] = useState(false);
  const [otpToken, setOtpToken] = useState(null);

  const state = location.state || {};
  const email = state?.email;
  const initialOtpToken = state?.otpToken;
  const from = state?.from;

  const finalOtp = otpDigits.join("");
  const maskedEmail = email?.replace(/(.{2}).+(@.+)/, "$1****$2");

  // Set OTP token or redirect if missing
  useEffect(() => {
    const storedToken = localStorage.getItem("otpToken");
    if (!email || (!initialOtpToken && !storedToken)) {
      toast.error("Session expired! Please try again.");
      navigate(from === "forgot-password" ? "/forgot-password" : "/signup");
      return;
    }
    setOtpToken(initialOtpToken || storedToken);
  }, [email, initialOtpToken, navigate, from]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setIsResendActive(true);
    }
  }, [timeLeft]);

  // Focus on first input
  useEffect(() => {
    document.getElementById("otp-0")?.focus();
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleResend = async () => {
    if (!isResendActive) return;

    setIsResendActive(false);
    setTimeLeft(10);

    try {
      let result, newToken;

      if (from === "change-email") {
        const res = await resendOTP(email);
        result = { payload: res.data };
        newToken = res.data.emailChangeToken;
      } else if (from === "forgot-password") {
        result = await dispatch(resendForgotPasswordOTP({ email }));
      } else {
        result = await dispatch(resendOtpForVerify({ otpToken }));
      }

      const isSuccess =
        (from === "forgot-password" && resendForgotPasswordOTP.fulfilled.match(result)) ||
        (from === "change-email" && result?.payload?.success) ||
        (from !== "forgot-password" && from !== "change-email" && resendOtpForVerify.fulfilled.match(result));

      if (isSuccess) {
        if (newToken) {
          setOtpToken(newToken);
          localStorage.setItem("otpToken", newToken);
        }
        toast.success("New OTP sent to your email!");
        setOtpDigits(Array(6).fill(""));
      } else {
        throw new Error(result.payload?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (finalOtp.length !== 6) {
      return toast.error("Please enter a valid 6-digit OTP");
    }

    try {
      const activeToken = otpToken || localStorage.getItem("otpToken");
      if (!activeToken) throw new Error("OTP token missing or expired");

      let result;

      if (from === "forgot-password") {
        result = await dispatch(verifyForgotPasswordOTP({ email, otp: finalOtp, otpToken: activeToken }));
      } else if (from === "change-email") {
        result = await confirmEmailChange(finalOtp, activeToken);
      } else {
        result = await dispatch(verifyOTP({ email, otp: finalOtp, otpToken: activeToken }));
      }

      const isVerified =
        (from === "forgot-password" && verifyForgotPasswordOTP.fulfilled.match(result)) ||
        (from === "change-email" && result?.success) ||
        (from !== "forgot-password" && verifyOTP.fulfilled.match(result));

      if (isVerified) {
        localStorage.removeItem("otpToken");
        toast.success("OTP verified successfully!");

        if (from === "forgot-password") {
          const resetToken = result.payload?.resetToken;
          if (!resetToken) throw new Error("Reset token missing after OTP verification");

          navigate(`/reset-password/${resetToken}`, {
            state: { otp: finalOtp, backgroundLocation: "/" },
          });
        } else if (from === "change-email") {
          navigate("/profile/edit", {
            state: { emailChanged: true, newEmail: email },
          });
        } else {
          const user = result.payload?.user;
          if (user) {
            navigate("/");
          } else {
            toast.success("OTP verified! Please log in.");
            navigate("/login");
          }
        }
      } else {
        throw new Error(result.payload?.message || "Invalid OTP! Please try again.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
      setOtpDigits(Array(6).fill(""));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg flex flex-col items-center relative">
        <h1 className="text-2xl font-bold text-black mb-2 font-Inter">Enter the OTP</h1>

        <p className="text-sm sm:text-base text-gray-700 text-center mb-1 font-Inter">
          Sent to <span className="font-medium">{maskedEmail}</span>
        </p>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 font-Inter">
          Please enter the 6-digit OTP sent to your registered email.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <div className="flex justify-between gap-3 mb-6">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-12 h-14 sm:h-16 text-xl sm:text-2xl text-center bg-[#edece9] rounded-xl outline-none focus:ring-2 focus:ring-[#8e4700] font-Inter"
              />
            ))}
          </div>

          <div className="text-black text-sm mb-3 font-Inter">
            Time left: <span className="font-semibold">{formatTime(timeLeft)}</span>
          </div>

          <div
            onClick={handleResend}
            className={`text-sm text-[#8e4700] font-semibold cursor-pointer mb-6 transition ${
              isResendActive ? "opacity-100" : "opacity-50 pointer-events-none"
            }`}
          >
            Resend OTP
          </div>

          <button
            type="submit"
            disabled={loading || finalOtp.length !== 6}
            className="w-full h-12 rounded-xl bg-[#3c2712] text-white font-semibold text-base font-Outfit disabled:opacity-60 transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
