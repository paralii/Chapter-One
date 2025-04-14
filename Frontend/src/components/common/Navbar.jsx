import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSearch } from '../../context/SearchContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { search: searchTerm, setSearch: setSearchTerm } = useSearch();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };
  return (
    <header className="bg-[#fff8e5] pt-4 px-4 lg:px-20">
  <div className="hidden md:flex items-center justify-between mb-4">
    <div className="w-1/3">
      <div
        className="logo font-[Outfit] text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#696969] cursor-pointer"
        onClick={() => navigate("/")}
      >
        CHAPTER ONE
      </div>
    </div>

    
    <form
          onSubmit={handleSearchSubmit}
          className="search-bar relative w-full max-w-[320px] min-w-[200px] h-[42px]"
        >
          <input
            type="text"
            placeholder="Search"
            className="w-full h-full rounded-full border border-[#e1d9d9] pr-10 pl-4 bg-white font-[Outfit] text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button
            type="submit"
            className="ti ti-search absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3c2712] text-lg cursor-pointer"
            title="Search"
          ></button>
        </form>


    <div className="w-1/3 flex justify-end gap-3">
      {!user ? (
        <>
          <button
            className="h-[38px] px-5 rounded-full text-sm font-light text-white bg-[#1c1c1c] cursor-pointer"
            onClick={() => navigate("/login", { state: { backgroundLocation: location } })}
          >
            Signin
          </button>
          <button
            className="h-[38px] px-5 rounded-full text-sm font-light text-[#1c1c1c] border border-black bg-transparent cursor-pointer"
            onClick={() => navigate("/signup", { state: { backgroundLocation: location } })}
          >
            Signup
          </button>
        </>
      ) : (
        <div className="cart-wishlist flex gap-3 text-[#696969] text-xl">
          <i
            className="ti ti-shopping-cart cursor-pointer"
            onClick={() => navigate("/cart")}
            title="Cart"
          ></i>
          <i
            className="ti ti-heart cursor-pointer"
            onClick={() => navigate("/wishlist")}
            title="Wishlist"
          ></i>
          <i
            className="ti ti-user cursor-pointer"
            onClick={() => navigate("/profile")}
            title="Dashboard"
          ></i>
        </div>
      )}
    </div>
  </div>
</header>
 
  );
};

export default Navbar;
