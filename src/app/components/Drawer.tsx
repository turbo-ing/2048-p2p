import React, { ReactNode } from "react";

// Define prop types for the Drawer component
interface DrawerProps {
  isOpen: boolean;
  toggleDrawer: () => void;
  position?: "left" | "right"; // Default is 'left'
  children: ReactNode; // Drawer can contain any valid React children
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  toggleDrawer,
  position = "left",
  children,
}) => {
  return (
    <div
      className={`fixed top-0 ${
        position === "left" ? "left-0" : "right-0"
      } h-full z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        isOpen
          ? "translate-x-0"
          : position === "left"
            ? "-translate-x-full"
            : "translate-x-full"
      } bg-black shadow-lg`}
    >
      <div className="p-4 flex justify-between items-center text-[#344054]">
        <h3 className="text-lg font-semibold" />
        <button onClick={toggleDrawer}>x</button>
      </div>
      <div className="p-4 overflow-y-auto">{children}</div>
    </div>
  );
};

export default Drawer;
