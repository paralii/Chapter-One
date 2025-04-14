import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { hideAlert } from "../../redux/alertSlice";
const AnimatedLogo = ({ type }) => {
  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    info: "#3b82f6",
  };

  return (
    <svg width="50" height="50" viewBox="0 0 64 64">
      {type === "success" ? (
        <path
          d="M20 34 L28 42 L44 26"
          stroke={colors[type]}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate attributeName="stroke-dasharray" from="0, 100" to="100, 0" dur="0.5s" fill="freeze" />
        </path>
      ) : type === "error" ? (
        <>
          <line x1="22" y1="22" x2="42" y2="42" stroke={colors[type]} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="x2" from="22" to="42" dur="0.5s" fill="freeze" />
            <animate attributeName="y2" from="22" to="42" dur="0.5s" fill="freeze" />
          </line>
          <line x1="42" y1="22" x2="22" y2="42" stroke={colors[type]} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="x2" from="42" to="22" dur="0.5s" fill="freeze" />
            <animate attributeName="y2" from="22" to="42" dur="0.5s" fill="freeze" />
          </line>
        </>
      ) : (
        <>
          <line x1="32" y1="20" x2="32" y2="32" stroke={colors[type]} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" from="0, 100" to="100, 0" dur="0.5s" fill="freeze" />
          </line>
          <circle cx="32" cy="44" r="2" fill={colors[type]}>
            <animate attributeName="r" from="0" to="2" dur="0.5s" fill="freeze" />
          </circle>
        </>
      )}
    </svg>
  );
};

const CustomAlert = () => {
  const dispatch = useDispatch();
const { message, isOpen, type } = useSelector((state) => state.alert);
  const [progress, setProgress] = useState(100);
  const duration = 4000;

  useEffect(() => {
    if (!isOpen) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      setProgress(Math.max(100 - (elapsedTime / duration) * 100, 0));
    }, 100);

    const timer = setTimeout(() => dispatch(hideAlert()), duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const lowerMsg = message.toLowerCase();
  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    info: "#3b82f6",
  };
  
  const borderColor = colors[type] || colors.info;
  

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="p-5 bg-white rounded shadow-md border-t-4" style={{ borderColor, minWidth: "280px", maxWidth: "90%" }}>
        <div className="flex items-center gap-4 w-full px-4">
          <h2 className="text-lg font-semibold" style={{ color: borderColor }}>
            {message}
          </h2>
          <AnimatedLogo message={message} type={type} />
        </div>
        <div className="flex justify-center mt-4">
          <button
            className="relative w-32 h-10 text-white rounded shadow-md overflow-hidden flex justify-center items-center"
            style={{ backgroundColor: "#654321" }}
            onClick={() => dispatch(hideAlert())}
          >
            <span className="relative z-10">OK</span>
            <div
              className="absolute inset-0 transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: "#d2b48c",
                opacity: 0.3,
              }}
            ></div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomAlert;
