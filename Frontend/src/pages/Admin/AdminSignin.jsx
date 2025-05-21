import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin, clearAdminError } from "../../redux/adminSlice"; // Make sure to add clearAdminError action
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; 

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.admin);

  // Clear error when component mounts or when page reloads
  useEffect(() => {
    dispatch(clearAdminError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(adminLogin({ email, password }));

    if (result.error) {
      return;  
    }
    
    if (result.payload) {
      navigate("/admin/dashboard");
    }
  };

  return (
    <>
      <main className="flex justify-center items-center min-h-screen p-4 bg-white">
        <section className="bg-white shadow-lg rounded-lg w-full px-6 py-8 sm:w-[90%] sm:max-w-[500px]">
          <h1 className="text-black text-center mb-6 text-[28px] font-bold sm:mb-8 sm:text-[32px]">
            Admin Sign In
          </h1>
          {error && (
            <p className="text-[16px] text-red-500 text-center mb-4">
              {error.message}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-12 text-[16px] px-4 rounded-lg bg-[#edece9] text-black focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4 relative">
              <input
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                className="w-full h-12 text-[16px] px-4 pr-12 rounded-lg bg-[#edece9] text-black focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-[18px] rounded-lg bg-[#3c2712] text-white cursor-pointer focus:outline-none"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p
              className="text-black text-center text-[14px] font-bold cursor-pointer mt-4"
              onClick={() => navigate("/login")}
            >
              User Login
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

export default AdminLogin;
