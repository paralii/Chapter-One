import React from "react";

const FallbackMessage = ({ type = "info", message }) => {
  const color =
    type === "error"
      ? "text-red-600 bg-red-50 border border-red-200"
      : type === "warning"
      ? "text-yellow-700 bg-yellow-50 border border-yellow-200"
      : "text-gray-700 bg-gray-100 border border-gray-200";

  return (
    <div className={`text-center py-6 px-4 rounded ${color}`}>
      {message}
    </div>
  );
};

export default FallbackMessage;
