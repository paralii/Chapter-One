// src/pages/Admin/AdminSignin.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin } from "../../redux/adminSlice";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.admin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(adminLogin({ email, password }));
    console.log("Login result:", result);
    if (result.payload) {
      console.log("Navigating to dashboard");
      navigate("/admin/dashboard");
    }
  };

  return (
    <>
      {/* Google Fonts for Inter and Outfit */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;700&family=Outfit:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <main className="flex justify-center items-center min-h-screen p-5 bg-white">
        <section
          className="
            bg-white shadow-[0_4px_151px_-50px_#261e0040] 
            rounded-[30px] w-full px-[20px] py-[30px]
            sm:w-[90%] sm:max-w-[624px] sm:px-[30px] sm:py-[40px]
            lg:w-[624px] lg:px-[57px] lg:py-[65px] lg:rounded-[60px]
          "
        >
          <h1
            className="
              text-black text-center 
              mb-[30px] text-[32px] font-bold 
              sm:mb-[40px] sm:text-[36px]
              lg:mb-[58px] lg:text-[42px]
            "
          >
            Admin Sign In
          </h1>
          {error && (
            <p className="text-[18px] text-red-500 text-center mb-[20px]">
              {error.message}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="mb-[20px] sm:mb-[30px]">
              <input
                type="email"
                placeholder="Enter your email"
                className="
                  w-full 
                  h-[60px] text-[20px] 
                  sm:h-[70px] sm:text-[22px]
                  lg:h-[86px] lg:text-[25px]
                  px-[30px] rounded-[20px] bg-[#edece9] text-black
                  focus:outline-none
                "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-[20px] sm:mb-[30px]">
              <input
                type="password"
                placeholder="Enter your password"
                className="
                  w-full 
                  h-[60px] text-[20px] 
                  sm:h-[70px] sm:text-[22px]
                  lg:h-[86px] lg:text-[25px]
                  px-[30px] rounded-[20px] bg-[#edece9] text-black
                  focus:outline-none
                "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="
                w-full 
                h-[60px] text-[24px] rounded-[20px] 
                sm:h-[70px] sm:text-[26px]
                lg:h-[86px] lg:text-[29px] lg:rounded-[25px]
                bg-[#3c2712] text-white cursor-pointer
                focus:outline-none
              "
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p
              className="text-black text-center text-[14px] lg:text-[16px] font-bold cursor-pointer"
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
