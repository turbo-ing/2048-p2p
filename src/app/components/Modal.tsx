import React, { ReactNode } from "react";

interface ModalProps {
  show: boolean;
  onClose?: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children }) => {
  if (!show) return null; // If `show` is false, don't render the modal

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 px-4">
      <div className="bg-[#0C111D] p-6 rounded-lg shadow-lg max-w-lg w-full relative">
        {onClose && (
          <button
            className="absolute top-2 right-2 text-[#85888E] hover:text-gray-700"
            onClick={onClose}
          >
            ✖
          </button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
