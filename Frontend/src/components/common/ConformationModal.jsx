import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useState } from "react";

const ConfirmationModal = ({
  onClose,
  message,
  inputs = [], 
  requireReason = false, 
  reasonRequired = false, 
  placeholder = "", 
  onConfirm, 
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  twoStep = false, 
  nextStepConfig = {},
}) => {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(
    inputs.reduce((acc, input) => ({ ...acc, [input.name]: input.defaultValue || "" }), {
      reason: "",
    })
  );
  const [error, setError] = useState(null);

  const handleInputChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleConfirm = () => {
    if (twoStep && step === 1) {
      setStep(2);
      return;
    }

    for (const input of step === 2 ? nextStepConfig.inputs || [] : inputs) {
      if (input.required && !values[input.name]?.toString().trim()) {
        setError(`${input.label} is required.`);
        return;
      }
      if (input.validate) {
        const validationError = input.validate(values[input.name]);
        if (validationError) {
          setError(validationError);
          return;
        }
      }
    }

    if ((requireReason || reasonRequired) && !values.reason.trim()) {
      setError("Reason is required.");
      return;
    }

    if (step === 2) {
      onConfirm(values);
    } else {
      onConfirm(inputs.length > 0 ? values : values.reason);
    }
    onClose();
  };

  const currentMessage = step === 2 ? nextStepConfig.message || message : message;
  const currentInputs = step === 2 ? nextStepConfig.inputs || [] : inputs;
  const currentConfirmButtonText = step === 2 ? nextStepConfig.confirmButtonText || confirmButtonText : confirmButtonText;
  const currentCancelButtonText = step === 2 ? nextStepConfig.cancelButtonText || cancelButtonText : cancelButtonText;

  return (
    <div className="custom-confirm-modal p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-semibold text-[#654321]">{currentMessage}</h2>

      {currentInputs.map ( (input) => (
        <div key={input.name} className="mt-4">
          {input.type === "textarea" ? (
            <textarea
              value={values[input.name]}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              placeholder={input.placeholder || ""}
              className="w-full p-2 border border-gray-300 rounded resize-none"
              rows="4"
            />
          ) : (
            <input
              type={input.type || "text"}
              value={values[input.name]}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              placeholder={input.placeholder || ""}
              className="w-full p-2 border border-gray-300 rounded"
              min={input.type === "number" ? 0 : undefined}
            />
          )}
          <label className="block text-sm text-[#654321] mt-1">{input.label}</label>
        </div>
      ))}

      {(requireReason || reasonRequired) && currentInputs.every((input) => input.name !== "reason") && (
        <div className="mt-4">
          <textarea
            value={values.reason}
            onChange={(e) => handleInputChange("reason", e.target.value)}
            placeholder={placeholder || "Enter reason"}
            className="w-full p-2 border border-gray-300 rounded resize-none"
            rows="4"
          />
          <label className="block text-sm text-[#654321] mt-1">Reason</label>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex justify-center gap-4 mt-4">
        <button
          className="bg-[#654321] text-white px-4 py-2 rounded"
          onClick={handleConfirm}
        >
          {currentConfirmButtonText}
        </button>
        <button
          className="bg-[#f5deb3] text-[#654321] px-4 py-2 rounded"
          onClick={onClose}
        >
          {currentCancelButtonText}
        </button>
      </div>
    </div>
  );
};

const showConfirmDialog = ({
  message,
  onConfirm,
  inputs = [],
  requireReason = false,
  reasonRequired = false,
  placeholder = "",
  twoStep = false,
  nextStepConfig = {},
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}) => {
  confirmAlert({
    title: "Confirm Action",
    message: message,
    customUI: ({ onClose }) => {
      return (
        <ConfirmationModal
          onClose={onClose}
          message={message}
          inputs={inputs}
          requireReason={requireReason}
          reasonRequired={reasonRequired}
          placeholder={placeholder}
          onConfirm={onConfirm}
          twoStep={twoStep}
          nextStepConfig={nextStepConfig}
          confirmButtonText={confirmButtonText}
          cancelButtonText={cancelButtonText}
        />
      );
    },
  });
};

export default showConfirmDialog;