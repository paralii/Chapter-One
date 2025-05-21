import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useState } from "react";

// Wrap the modal UI inside a function component to use hooks properly
const ConfirmationModal = ({ onClose, message, requireReason, reasonRequired, placeholder, onConfirm }) => {
  const [reason, setReason] = useState(""); // State to hold the reason input value
  const [error, setError] = useState(null); // State to hold error message

  const handleConfirm = () => {
    if (reasonRequired && !reason.trim()) {
      setError("Reason is required.");
      return;
    }
    onConfirm(reason); // Pass reason to the onConfirm function
    onClose();
  };

  return (
    <div className="custom-confirm-modal p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-semibold text-[#654321]">{message}</h2>

      {/* Input for reason if required */}
      {(requireReason || reasonRequired) && (
        <div className="mt-4">
<textarea
  value={reason}
  onChange={(e) => setReason(e.target.value)}
  placeholder={placeholder}
  className="w-full p-2 border border-gray-300 rounded resize-none"
  rows="4"
/>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-4">
        <button
          className="bg-[#654321] text-white px-4 py-2 rounded"
          onClick={handleConfirm}
        >
          Yes
        </button>
        <button
          className="bg-[#f5deb3] text-[#654321] px-4 py-2 rounded"
          onClick={onClose}
        >
          No
        </button>
      </div>
    </div>
  );
};

const showConfirmDialog = ({
  message,
  onConfirm,
  requireReason = false, // Whether reason is required
  reasonRequired = false, // Whether reason is optional or mandatory
  placeholder = "", // Placeholder text for the reason input
}) => {
  confirmAlert({
    title: "Confirm Action",
    message: message,
    customUI: ({ onClose }) => {
      return (
        <ConfirmationModal
          onClose={onClose}
          message={message}
          requireReason={requireReason}
          reasonRequired={reasonRequired}
          placeholder={placeholder}
          onConfirm={onConfirm}
        />
      );
    },
  });
};

export default showConfirmDialog;
