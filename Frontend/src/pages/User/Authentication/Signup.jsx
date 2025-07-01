import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

import GoogleAuthHandler from "../../../components/User/GoogleAuthHandler";

import { signupUser } from "../../../redux/authSlice";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

function Signup({ onClose = () => {} }) {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialReferralCode = query.get("ref") || "";

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClose = () => {
    navigate("/", { replace: true });
    onClose();
  };

  const openModalRoute = (path) => {
    navigate(path, {
      replace: true,
      state: { backgroundLocation: "/" },
    });
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isStrongPassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!firstname.trim()) {
      newErrors.firstname = "First name is required";
    } else if (!/^[a-zA-Z]+$/.test(firstname)) {
      newErrors.firstname = "First name can only contain letters";
    }

    if (!lastname.trim()) {
      newErrors.lastname = "Last name is required";
    } else if (!/^[a-zA-Z]+$/.test(lastname)) {
      newErrors.lastname = "Last name can only contain letters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!isStrongPassword(password)) {
      newErrors.password =
        "Password must be 8+ characters with uppercase, lowercase, number, and symbol.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const resultAction = await dispatch(
        signupUser({
          firstname,
          lastname,
          email,
          password,
          referral_code: referralCode.trim(),
        })
      );

      if (signupUser.fulfilled.match(resultAction)) {
        const { otpToken } = resultAction.payload || {};
        toast.success("Signup successful! Check your email for the OTP.");
        navigate("/verify-otp", {
          state: { email, otpToken, backgroundLocation: "/" },
        });
      } else {
        const errors = resultAction.payload?.errors;
        if (errors?.length) {
          errors.forEach((err) => toast.error(err.msg));
        } else {
          toast.error(resultAction.payload?.message || "Signup failed!");
        }
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong during signup");
    }
  };

  return (
    <div className="w-full h-screen fixed top-0 left-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-[460px] bg-white rounded-[30px] p-6 sm:p-8 shadow-xl">
        <button
          className="absolute top-4 right-4 text-xl text-gray-500 hover:text-black"
          onClick={handleClose}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit}>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-center mb-5 font-Outfit">
            Sign Up
          </h1>

          <div className="flex gap-3 mb-4">
            <div className="w-full">
              <input
                type="text"
                placeholder="First name"
                className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 text-[16px] outline-none font-Inter"
                value={firstname}
                onChange={(e) => {
                  setFirstname(e.target.value);
                  setErrors((prev) => ({ ...prev, firstname: "" }));
                }}
              />
              {errors.firstname && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.firstname}
                </p>
              )}
            </div>
            <div className="w-full">
              <input
                type="text"
                placeholder="Last name"
                className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 text-[16px] outline-none font-Inter"
                value={lastname}
                onChange={(e) => {
                  setLastname(e.target.value);
                  setErrors((prev) => ({ ...prev, lastname: "" }));
                }}
              />
              {errors.lastname && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.lastname}
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 text-[16px] outline-none font-Inter"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Referral code (optional)"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 text-[16px] outline-none font-Inter"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>

          <div className="mb-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 pr-12 text-[16px] outline-none font-Inter"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              autoComplete="new-password"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.password}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-snug mb-5 font-Inter px-1">
            Must be at least 8 characters and include uppercase, lowercase,
            number, and symbol.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] rounded-[20px] bg-[#3c2712] text-white font-bold text-[18px] font-Outfit mb-4 transition-all duration-200 hover:bg-[#4d321b] disabled:opacity-60"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <div className="text-center text-[15px] font-Inter">
            Already have an account?
            <button
              type="button"
              onClick={() => openModalRoute("/login")}
              className="text-[#8e4700] ml-2 mb-2 underline hover:text-[#b35900]"
            >
              Sign in
            </button>
          </div>

          <GoogleAuthHandler type="signup" />
        </form>
      </div>
    </div>
  );
}

export default Signup;
