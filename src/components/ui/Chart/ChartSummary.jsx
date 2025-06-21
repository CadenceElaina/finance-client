// src/components/ui/Chart/ChartSummary.jsx
import React from "react";
import budgetStyles from "../../../features/Dashboard/Apps/Budget/budget.module.css";

const ChartSummary = ({
  items,
  className = "",
  layout = "horizontal", // "horizontal" | "grid"
}) => {
  const baseClass =
    layout === "grid"
      ? budgetStyles.chartSummaryGrid
      : budgetStyles.chartSummaryTop;

  return (
    <div className={`${baseClass} ${className}`}>
      {items.map((item, index) => (
        <div key={index} className={budgetStyles.summaryItem}>
          <span className={budgetStyles.summaryLabel}>{item.label}</span>
          <span
            className={`${budgetStyles.summaryValue} ${
              item.valueClass ? budgetStyles[item.valueClass] : ""
            }`}
          >
            {item.value}
            {item.suffix && (
              <span className={budgetStyles.summaryValueSuffix}>
                {item.suffix}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartSummary;
