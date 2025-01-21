import { ReactNode, useCallback } from "react";

type InputProps<T extends string | number> = {
  labelText: string;
  value: T | ""; // Allow empty string for clearing
  onChange: (value: T | "") => void; // Pass empty string to parent when cleared
  placeholder: string;
  type?: "text" | "number";
  id: string;
  children?: ReactNode;
  min?: number; // for numeric inputs
  max?: number; // for numeric inputs
  step?: number; // for numeric inputs
};

const Input = <T extends string | number>({
  labelText,
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  children,
  min,
  max,
  step,
}: InputProps<T>): JSX.Element => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let newValue: T | "";

      if (type === "number") {
        const rawValue = event.target.value;
        if (rawValue === "") {
          // Handle empty input
          onChange("");
          return;
        }

        const numericValue = Number(rawValue);
        if (isNaN(numericValue)) return; // Prevent invalid values

        // Enforce min and max constraints
        if (min !== undefined && numericValue < min) return;
        if (max !== undefined && numericValue > max) return;

        newValue = numericValue as T;
      } else {
        newValue = event.target.value as T;
      }

      onChange(newValue);
    },
    [onChange, type, min, max],
  );

  return (
    <div className="mt-5 text-left">
      <label className="text-sm font-medium" htmlFor={id}>
        {labelText}
      </label>
      <input
        className="border border-text bg-transparent rounded-xl shadow text-md py-2.5 px-3.5 w-full mt-1.5 placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        type={type}
        id={id}
        value={value === "" ? "" : String(value)}
        onChange={handleChange}
        {...(type === "number" && { min, max, step })}
      />
      {children}
    </div>
  );
};

export default Input;
