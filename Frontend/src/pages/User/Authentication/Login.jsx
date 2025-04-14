import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../../redux/authSlice";
import GoogleAuthHandler from "../../../components/User/GoogleAuthHandler";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

function Login({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return toast.warn("Please wait before trying again.");

    try {
      const resultAction = await dispatch(loginUser({ email, password, rememberMe }));

      if (loginUser.fulfilled.match(resultAction)) {
        toast.success("Login successful!");
        setAttempts(0);
        onClose();
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
        backgroundLocation: location.state?.backgroundLocation || "/",
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

        <h1 className="text-2xl font-bold text-black mb-6 font-Inter">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="w-full h-12 rounded-xl mb-4 flex items-center px-4 bg-[#edece9]">
            <input
              type="email"
              placeholder="Email"
              className="w-full h-full bg-transparent border-none outline-none text-base text-black font-Inter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="w-full h-12 rounded-xl mb-4 flex items-center px-4 bg-[#edece9] relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full h-full bg-transparent border-none outline-none text-base text-black font-Inter pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center mb-4">
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
          </div>

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
