import React, {useState, useEffect} from "react";

const PageHeader = ({
  title,
  search,
  onSearchChange,
  handleClear,
  handleLogout,
  searchPlaceholder = `Sreach ${title}`,
}) => {
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange({ target: { value: localSearch } });
      }
    }, 3000); 

    return () => clearTimeout(delayDebounce);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  return (
    <header className="flex flex-col items-start gap-[20px] sm:flex-row sm:justify-between sm:items-center mb-[30px]">
      <h1 className="text-[#6e4949] text-[26px] font-semibold">Manage {title}</h1>
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-[253px]">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full h-[50px] px-[20px] text-[#202224] bg-[#f5efdf] border border-[#b5b5b5] rounded-[12px] text-[14px]"
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <button
          className="ml-2 h-[50px] px-4 border border-[#b5b5b5] rounded-[12px] text-[14px] text-[#1d0500] hover:bg-gray-200"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      <button
        className="w-full sm:w-[132px] h-[46px] text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-[19px] text-[16px] font-semibold cursor-pointer"
        onClick={handleLogout}
      >
        Log out
      </button>
    </header>
  );
};

export default PageHeader;
