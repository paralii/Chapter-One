import React, {useState, useEffect} from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { adminLogout } from "../../redux/adminSlice";

const PageHeader = ({
  title,
  search,
  onSearchChange,
  handleClear,
  searchPlaceholder = `Search ${title}`,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(search);
  
  useEffect(() => {
    setLocalSearch(search);
  },[search]);

  const handleLogout = () => {
  const result = dispatch(adminLogout());
  if (adminLogout.fulfilled.match(result)) {
    navigate("/admin/login");
  } else {
    console.error("Logout failed:", result.payload || result.error);
  }
};

  return (
    <header className="flex flex-row items-center justify-between flex-nowrap gap-1 xs:gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 ml-10 xs:ml-12 sm:ml-0">
      <h1 className="text-[#6e4949] text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold flex-shrink-0">
        Manage {title}
      </h1>
      <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 flex-grow justify-end">
        <div className="relative w-24 xs:w-28 sm:w-36 md:w-56 lg:w-80">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full h-6 xs:h-7 sm:h-8 md:h-10 px-1 xs:px-2 sm:px-3 text-[#202224] bg-[#f5efdf] border border-[#b5b5b5] rounded-lg text-[10px] xs:text-xs sm:text-sm md:text-base"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearchChange(e.target.value);
            }}
          />
        </div>
        <button
          type="button"
          className="h-6 xs:h-7 sm:h-8 md:h-10 px-1 xs:px-2 sm:px-3 border border-[#b5b5b5] rounded-lg text-[10px] xs:text-xs sm:text-sm md:text-base text-[#1d0500] hover:bg-gray-200 flex-shrink-0"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="h-6 xs:h-7 sm:h-8 md:h-10 w-12 xs:w-14 sm:w-18 md:w-24 text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-lg text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold flex-shrink-0"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  handleClear: PropTypes.func,
  searchPlaceholder: PropTypes.string,
};

export default PageHeader;
