import React from "react";

const Pagination = ({ page, setPage, totalPages, visiblePages }) => {
  const handlePageClick = (pageNum) => {
    setPage(pageNum);
  };

  return (
    <div className="flex justify-center mt-4 mb-8">
      <div className="flex items-center gap-1 text-sm font-medium font-Inter">
        {/* Prev */}
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className={`px-2.5 py-1.5 rounded-md transition ${
            page === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#3c2712] text-white hover:bg-[#4d321b]"
          }`}
        >
          Prev
        </button>

        {/* Backward Jump */}
        {page > visiblePages && (
          <button
            onClick={() => setPage(Math.max(1, page - visiblePages))}
            className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            &laquo;
          </button>
        )}

        {/* Page 1 */}
        <button
          onClick={() => handlePageClick(1)}
          className={`px-2.5 py-1.5 rounded-md ${
            page === 1
              ? "bg-[#3c2712] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          1
        </button>

        {/* Mid pages */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (num) =>
              num !== 1 &&
              num !== totalPages &&
              num >= page - Math.floor(visiblePages / 2) &&
              num <= page + Math.floor(visiblePages / 2)
          )
          .map((num) => (
            <button
              key={num}
              onClick={() => handlePageClick(num)}
              className={`px-2.5 py-1.5 rounded-md ${
                page === num
                  ? "bg-[#3c2712] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {num}
            </button>
          ))}

        {/* Last Page */}
        {totalPages > 1 && (
          <button
            onClick={() => handlePageClick(totalPages)}
            className={`px-2.5 py-1.5 rounded-md ${
              page === totalPages
                ? "bg-[#3c2712] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {totalPages}
          </button>
        )}

        {/* Forward Jump */}
        {page < totalPages - visiblePages + 1 && (
          <button
            onClick={() => setPage(Math.min(totalPages, page + visiblePages))}
            className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            &raquo;
          </button>
        )}

        {/* Next */}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className={`px-2.5 py-1.5 rounded-md transition ${
            page === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#3c2712] text-white hover:bg-[#4d321b]"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
