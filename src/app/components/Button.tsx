import { ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  onClick: () => Promise<void> | void;
  children?: ReactNode;
  variant?: "default" | "inverted";
  className?: string;
}

const Button = ({
  onClick,
  children,
  className,
  variant = "default",
}: ButtonProps) => {
  const baseClasses =
    "py-2.5 px-4 rounded-lg w-full flex items-center justify-center gap-1 border-1 transition-all";

  const defaultClasses =
    "bg-bg-dark border-background hover:border-bg-dark hover:bg-background hover:text-bg-dark text-background";

  const invertedClasses =
    "bg-background text-bg-dark border-bg-dark hover:border-background hover:bg-bg-dark hover:text-background";

  const buttonClasses = classNames(
    baseClasses,
    variant === "inverted" ? invertedClasses : defaultClasses,
    className,
  );

  return (
    <button className={buttonClasses} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
