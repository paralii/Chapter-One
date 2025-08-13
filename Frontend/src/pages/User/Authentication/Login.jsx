import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../../redux/authSlice";
import GoogleAuthHandler from "../../../components/User/GoogleAuthHandler";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { registerSocket } from "../../../utils/socketClient";

function Login({ onClose = () => {}}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const validateForm = () => {
    let isValid = true;
    let newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return toast.warn("Please wait before trying again.");

    if (!validateForm()) return;

    try {
      const resultAction = await dispatch(loginUser({ email, password}));

      if (loginUser.fulfilled.match(resultAction)) {
        toast.success("Login successful!");
        setAttempts(0);
        registerSocket(resultAction.payload.user._id);
        onClose();
        navigate("/");
      } else {
        setAttempts((prev) => prev + 1);
        toast.error(resultAction.payload?.message || "Login failed");

        if (attempts + 1 === 3) {
          toast.warn("Too many failed attempts. One more will lock you for 30s.");
        }

        if (attempts + 1 >= 4) {
          setIsLocked(true);
          toast.error("Too many attempts. Locked for 30 seconds.");
          setTimeout(() => {
            setAttempts(0);
            setIsLocked(false);
          }, 30000);
        }
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  const openModalRoute = (path) => {
    navigate(path, {
      replace: true,
      state: {
        backgroundLocation:"/",
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg flex flex-col items-center relative">

        <button
          className="absolute top-4 right-4 text-xl text-gray-500 hover:text-black"
          onClick={onClose}
        >
          &times;
        </button>


        <form onSubmit={handleSubmit} className="w-full">

        <h1 className="text-[22px] sm:text-[26px] font-bold text-center mb-5 font-Outfit">
            Sign In
          </h1>

          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 text-[16px] outline-none font-Inter"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: "" }));
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full h-[50px] rounded-[20px] bg-[#edece9] px-5 pr-12 text-[16px] outline-none font-Inter"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: "" }));
              }}
            />
            <button
              type="button"
              className="absolute right-4 top-6 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
            )}
          </div>

          {/* <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2 accent-[#3c2712]"
            />
            <label htmlFor="remember" className="text-sm text-gray-700">
              Remember me
            </label>
          </div> */}

          <button
            type="submit"
            className="w-full h-12 rounded-xl mb-4 bg-[#3c2712] text-white font-semibold text-base font-Outfit disabled:opacity-60"
            disabled={loading || isLocked}
          >
            {isLocked
              ? "Temporarily Locked"
              : loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <button
          className="text-sm text-[#8e4700] cursor-pointer mb-3"
          onClick={() => openModalRoute("/forgot-password")}
        >
          Forgot Password?
        </button>

        <div className="text-sm text-black font-Inter">
          Don’t have an account?
          <span
            className="text-[#8e4700] cursor-pointer ml-1"
            onClick={() => openModalRoute("/signup",)}
          >
            Sign up
          </span>
        </div>

        <div className="mt-4">
          <GoogleAuthHandler type="signin"/>
        </div>
      </div>
    </div>
  );
}

export default Login;
