import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
    <header className="bg-[#fff8e5] py-2 px-3 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-[1400px] mx-auto">
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch gap-2 sm:gap-6 flex-1">
          {/* Logo and Mobile Icons Row */}
          <div className="flex items-center justify-center sm:w-auto">
            <div
              className="logo font-[Outfit] text-base sm:text-lg font-bold text-[#696969] cursor-pointer hover:text-[#3c2712] transition-colors whitespace-nowrap"
              onClick={() => navigate('/')}
            >
              CHAPTER ONE
            </div>
            
            {/* Mobile-only auth/nav */}
            <div className="flex sm:hidden gap-3 text-[#696969] items-center ">
              {!user ? (
                <button
                  className="h-[30px] px-3 rounded-full text-xs font-light text-white bg-[#1c1c1c] cursor-pointer"
                  onClick={() => navigate('/login', { state: { backgroundLocation: '/' } })}
                >
                  Signin
                </button>
              ) : (
                <div className="flex gap-3 text-base">
                  <i
                    className="ti ti-shopping-cart cursor-pointer hover:text-[#3c2712] transition-colors"
                    onClick={() => navigate('/cart')}
                    title="Cart"
                  />
                  <i
                    className="ti ti-heart cursor-pointer hover:text-[#3c2712] transition-colors"
                    onClick={() => navigate('/wishlist')}
                    title="Wishlist"
                  />
                  <i
                    className="ti ti-user cursor-pointer hover:text-[#3c2712] transition-colors"
                    onClick={() => navigate('/profile')}
                    title="Dashboard"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full sm:max-w-[280px] relative"
          >
            <input
              type="text"
              placeholder="Search"
              className="w-full h-[34px] rounded-full border border-[#e1d9d9] pr-10 pl-4 bg-white font-[Outfit] text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button
              type="submit"
              className="ti ti-search absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3c2712] text-base cursor-pointer"
              title="Search"
            />
          </form>
        </div>

        {/* Desktop Nav Section */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-4">
          {!user ? (
            <>
              <button
                className="h-[34px] px-4 rounded-full text-xs font-light text-white bg-[#1c1c1c] cursor-pointer whitespace-nowrap"
                onClick={() => navigate('/login', { state: { backgroundLocation: '/' } })}
              >
                Signin
              </button>
              <button
                className="h-[34px] px-4 rounded-full text-xs font-light text-[#1c1c1c] border border-black bg-transparent cursor-pointer whitespace-nowrap"
                onClick={() => navigate('/signup', { state: { backgroundLocation: '/' } })}
              >
                Signup
              </button>
            </>
          ) : (
            <div className="flex gap-4 text-[#696969] text-lg">
              <i
                className="ti ti-shopping-cart cursor-pointer hover:text-[#3c2712] transition-colors"
                onClick={() => navigate('/cart')}
                title="Cart"
              />
              <i
                className="ti ti-heart cursor-pointer hover:text-[#3c2712] transition-colors"
                onClick={() => navigate('/wishlist')}
                title="Wishlist"
              />
              <i
                className="ti ti-user cursor-pointer hover:text-[#3c2712] transition-colors"
                onClick={() => navigate('/profile')}
                title="Dashboard"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
};

export default Navbar;
