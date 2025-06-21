import React from "react";
import tableStyles from "../Table/Table.module.css";

const BudgetFormSelect = ({
  options = [],
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Select...",
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${tableStyles.tableSelect} ${className}`}
      disabled={disabled}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default BudgetFormSelect;
