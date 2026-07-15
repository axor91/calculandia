import React, { type ChangeEvent, type HTMLAttributes } from "react";

type NumericInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowNegative?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

export default function NumericInput({
  value,
  onChange,
  placeholder,
  className,
  allowNegative = false,
  inputMode = "decimal",
}: NumericInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;

    if (next === "") {
      onChange(next);
      return;
    }

    if (allowNegative && next === "-") {
      onChange(next);
      return;
    }

    const pattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
    if (pattern.test(next)) {
      onChange(next);
    }
  };

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
}
