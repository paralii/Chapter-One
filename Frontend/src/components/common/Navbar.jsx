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
      <div className="max-w-[1400px] mx-auto">

        {/* Mobile Layout (<=425px): Logo left, icons right, search below */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-2">
            <div
              className="logo text-base font-bold text-[#696969] cursor-pointer hover:text-[#3c2712]"
              onClick={() => navigate('/')}
            >
              CHAPTER ONE
            </div>

            <div className="flex gap-3 text-[#696969] items-center">
              {!user ? (
                <button
                  className="h-[30px] px-3 rounded-full text-xs font-light text-white bg-[#1c1c1c] cursor-pointer"
                  onClick={() => navigate('/login', { state: { backgroundLocation: '/' } })}
                >
                  Signin
                </button>
              ) : (
                <>
                  <i
                    className="ti ti-shopping-cart cursor-pointer hover:text-[#3c2712]"
                    onClick={() => navigate('/cart')}
                    title="Cart"
                  />
                  <i
                    className="ti ti-heart cursor-pointer hover:text-[#3c2712]"
                    onClick={() => navigate('/wishlist')}
                    title="Wishlist"
                  />
                  <i
                    className="ti ti-user cursor-pointer hover:text-[#3c2712]"
                    onClick={() => navigate('/profile')}
                    title="Dashboard"
                  />
                </>
              )}
            </div>
          </div>

          <div className="px-2 mt-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full h-[34px] rounded-full border border-[#e1d9d9] pr-10 pl-4 bg-white text-sm"
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
        </div>

        {/* Desktop Layout (>=768px): Logo left, search center, icons right */}
        <div className="hidden sm:flex items-center justify-between">
          <div
            className="logo text-lg font-bold text-[#696969] cursor-pointer hover:text-[#3c2712]"
            onClick={() => navigate('/')}
          >
            CHAPTER ONE
          </div>

          <div className="flex-1 mx-4 max-w-[400px]">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full h-[34px] rounded-full border border-[#e1d9d9] pr-10 pl-4 bg-white text-sm"
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

          <div className="flex gap-4 text-[#696969] text-lg">
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
              <>
                <i
                  className="ti ti-shopping-cart cursor-pointer hover:text-[#3c2712]"
                  onClick={() => navigate('/cart')}
                  title="Cart"
                />
                <i
                  className="ti ti-heart cursor-pointer hover:text-[#3c2712]"
                  onClick={() => navigate('/wishlist')}
                  title="Wishlist"
                />
                <i
                  className="ti ti-user cursor-pointer hover:text-[#3c2712]"
                  onClick={() => navigate('/profile')}
                  title="Dashboard"
                />
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
