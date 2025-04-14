import React, { createContext, useState, useEffect, useContext } from 'react';

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [search, setSearch] = useState(() => {
    return localStorage.getItem('search') || '';
  });

  useEffect(() => {
    localStorage.setItem('search', search);
  }, [search]);

  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
