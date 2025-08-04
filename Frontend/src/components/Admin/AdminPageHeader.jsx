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

  const handleLogout = async () => {
  const result = await dispatch(adminLogout());
  if (adminLogout.fulfilled.match(result)) {
    navigate("/admin/login");
  } else {
    console.error("Logout failed:", result.payload || result.error);
  }
};

  return (
    <header className="flex flex-col items-start gap-[20px] sm:flex-row sm:justify-between sm:items-center mb-[30px]">
      <h1 className="text-[#6e4949] text-[26px] font-semibold">Manage {title}</h1>
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-[253px]">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full h-[50px] px-[20px] text-[#202224] bg-[#f5efdf] border border-[#b5b5b5] rounded-[12px] text-[14px]"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearchChange(e.target.value);
            }}
          />
        </div>
        <button
          type="button"
          className="ml-2 h-[50px] px-4 border border-[#b5b5b5] rounded-[12px] text-[14px] text-[#1d0500] hover:bg-gray-200"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      <button
        type="button"
        className="w-full sm:w-[132px] h-[46px] text-[#1d0500] bg-[#ff8266] border border-[#b5b5b5] rounded-[19px] text-[16px] font-semibold cursor-pointer"
        onClick={handleLogout}
      >
        Log out
      </button>
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
