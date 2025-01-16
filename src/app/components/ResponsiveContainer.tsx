import React from "react";
import classNames from "classnames";

type ResponsiveContainerProps = {
  top: React.ReactNode;
  middle: React.ReactNode;
  bottom: React.ReactNode;
  mainPosition?: "left" | "right";
  className?: string;
};

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  top,
  middle,
  bottom,
  mainPosition = "right",
  className = "",
}) => {
  const isMainLeft = mainPosition === "left";

  return (
    /**
     * grid-cols-1 (default) => 1 column on small screens
     * md:grid-cols-2 => 2 columns on medium+ screens
     *
     * For MD+:
     * - Main   => left or right column, spanning rows based on mainPosition
     * - Header => opposite column, row 1
     * - Footer => opposite column, row 2
     */
    <div
      className={classNames(
        "grid min-h-screen grid-cols-1 md:grid-cols-2 text-text overflow-hidden",
        className,
      )}
    >
      {/* Header (top) */}
      <header
        className={`${
          isMainLeft ? "md:col-start-2" : "md:col-start-1"
        } md:row-start-1`}
      >
        {top}
      </header>

      {/* Main (middle) */}
      <main
        className={`${
          isMainLeft ? "md:col-start-1" : "md:col-start-2"
        } md:row-span-2 flex items-center justify-center`}
      >
        {middle}
      </main>

      {/* Footer (bottom) */}
      <footer
        className={`${
          isMainLeft ? "md:col-start-2" : "md:col-start-1"
        } md:row-start-2 mb-2 max-w-lg mx-auto`}
      >
        {bottom}
      </footer>
    </div>
  );
};

export default ResponsiveContainer;
