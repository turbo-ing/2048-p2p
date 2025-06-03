import React, { ReactNode } from "react";
import ExitButton from "./ExitButton";

interface ModalProps {
  show: boolean;
  onClose?: () => void;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  show,
  onClose,
  children,
  showBackButton,
  onBack,
}) => {
  if (!show) return null; // If `show` is false, don't render the modal

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 px-4 text-center text-text">
      <div className="bg-background p-6 rounded-3xl shadow-lg max-w-lg w-full relative">
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 text-text hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        {onClose && (
          <ExitButton onClose={onClose} className={"absolute top-6 right-8"} />
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
