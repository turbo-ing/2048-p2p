import { ReactNode } from "react";

type InputProps<T extends string | number> = {
  labelText: string;
  value: T;
  onChange: (value: T) => void;
  placeholder: string;
  type?: string;
  id: string;
  children?: ReactNode;
};

const Input = <T extends string | number>({
  labelText,
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  children,
}: InputProps<T>): JSX.Element => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      type === "number"
        ? (Number(event.target.value) as T)
        : (event.target.value as T);

    onChange(newValue);
  };

  return (
    <div className="mt-5 text-left">
      <label className="text-sm font-medium" htmlFor={id}>
        {labelText}
      </label>
      <input
        key={labelText}
        className="border border-text bg-transparent rounded-xl shadow text-md py-2.5 px-3.5 w-full mt-1.5 placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 "
        placeholder={placeholder}
        type={type}
        id={id}
        value={value}
        onChange={handleChange}
      />
      {children}
    </div>
  );
};

export default Input;
