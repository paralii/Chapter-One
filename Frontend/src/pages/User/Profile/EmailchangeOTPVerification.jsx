import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:2211";

const EmailChangeOTPVerification = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { newEmail, emailChangeToken } = state || {};

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to the next input box if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const otpCode = otp.join(""); // Combine OTP digits into a string
      const response = await axios.post(`${API_BASE}/verify-email-otp`, {
        email: newEmail,
        otp: otpCode,
        token: emailChangeToken,
      });

      if (response.data.success) {
        navigate("/profile", {
          state: { message: "Email changed successfully!" },
        });
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black/50 px-4">
      <div className="flex flex-col gap-6 items-center w-full max-w-[500px] p-10 bg-yellow-50 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold text-black">Confirm Email Change</h2>
        <p className="text-black">
          Enter the OTP sent to <strong>{newEmail ? newEmail : "Pinchu@gmail.com"}</strong> to confirm your email change.
        </p>
  
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center">
            <label className="text-black font-medium mb-2">Enter OTP:</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="submit"
            className="mt-4 bg-amber-800 text-white py-3 rounded-lg font-semibold hover:bg-amber-900 transition-colors disabled:opacity-50"
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying OTP..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailChangeOTPVerification;
