// src/components/common/ConfirmationModal.jsx
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";


const showConfirmDialog = (message, onConfirm) => {
  confirmAlert({
    title: "Confirm Action",
    message: message,
    customUI: ({ onClose }) => (
      <div className="custom-confirm-modal p-4 bg-white rounded shadow-md">
        <h2 className="text-lg font-semibold text-[#654321]">{message}</h2>
        <div className="flex justify-center gap-4 mt-4">
          <button
            className="bg-[#654321] text-white px-4 py-2 rounded"
            onClick={() => {
              onConfirm();
              onClose();
            }}
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
    ),
  });
};

export default showConfirmDialog;
