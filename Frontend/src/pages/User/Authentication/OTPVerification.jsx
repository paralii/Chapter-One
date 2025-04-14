import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOTP, resendOTP } from "../../../redux/authSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const OTPVerification = () => {
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(120);
  const [isResendActive, setIsResendActive] = useState(false);
  const [otpToken, setOtpToken] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { loading } = useSelector((state) => state.auth);

  const email = state?.email;
  const initialOtpToken = state?.otpToken;

  // useEffect(() => {
  //   if (!email || !initialOtpToken) {
  //     toast.error("Session expired! Please sign up again.");
  //     navigate("/signup");
  //   } else {
  //     setOtpToken(initialOtpToken);
  //   }
  // }, [email, initialOtpToken, navigate]);

  useEffect(() => {
    const timer = timeLeft > 0 && setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    if (timeLeft <= 0) setIsResendActive(true);
    return () => clearInterval(timer);
  }, [timeLeft]);

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
    setTimeLeft(120);
    try {
      const result = await dispatch(resendOTP(email));
      if (resendOTP.fulfilled.match(result)) {
        setOtpToken(result.payload.otpToken);
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

  const finalOtp = otpDigits.join("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (finalOtp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");

    try {
      const result = await dispatch(verifyOTP({ email, otp: finalOtp, otpToken }));
      if (verifyOTP.fulfilled.match(result)) {
        if (result.payload && result.payload.user) {
          toast.success("OTP verified successfully!");
          navigate("/");
        } else {
          toast.success("OTP verified! Please log in.");
          navigate("/login");
        }
      } else {
        throw new Error(result.payload?.message || "Invalid OTP! Please try again.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
      setOtpDigits(Array(6).fill(""));
    }
  };

  const maskedEmail = email?.replace(/(.{2}).+(@.+)/, "$1****$2");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg flex flex-col items-center relative">
  
        <h1 className="text-2xl font-bold text-black mb-2 font-Inter">
          Enter the OTP
        </h1>
  
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
            className={`w-full h-12 rounded-xl bg-[#3c2712] text-white font-semibold text-base font-Outfit disabled:opacity-60 transition`}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
  
};

export default OTPVerification;
