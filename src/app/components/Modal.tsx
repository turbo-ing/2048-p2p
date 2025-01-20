import React, { ReactNode } from "react";
import ExitButton from "./ExitButton";

interface ModalProps {
  show: boolean;
  onClose?: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children }) => {
  if (!show) return null; // If `show` is false, don't render the modal

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 px-4 text-center text-text">
      <div className="bg-background p-6 rounded-3xl shadow-lg max-w-lg w-full relative">
        {onClose && (
          <ExitButton onClose={onClose} className={"absolute top-6 right-8"} />
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
