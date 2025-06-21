// src/components/ui/Form/BudgetFormInput.jsx
import React from "react";
import tableStyles from "../Table/Table.module.css";

const BudgetFormInput = ({
  column,
  value,
  onChange,
  disabled = false,
  className = "",
  ...props
}) => {
  const { type = "text", placeholder, step, min, max, title = "" } = column;

  const handleChange = (e) => {
    const newValue =
      type === "number"
        ? e.target.value === ""
          ? ""
          : parseFloat(e.target.value) || 0
        : e.target.value;
    onChange(newValue);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      className={`${tableStyles.tableInput} ${className}`}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      title={title}
      {...props}
    />
  );
};

export default BudgetFormInput;
