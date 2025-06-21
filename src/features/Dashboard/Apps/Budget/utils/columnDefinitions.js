// src/features/Dashboard/Apps/Budget/utils/columnDefinitions.js
export const createIncomeColumns = (type, editMode) => {
  const baseColumns = [
    { key: "type", label: "Type", className: "descriptionColumn" }
  ];

  if (editMode) {
    if (type === "salary") {
      return [
        ...baseColumns,
        { 
          key: "annualPreTax", 
          label: "Annual (PT)",
          title: "Annual Pre-tax: Enter your yearly salary before taxes",
          className: "amountColumn",
          type: "number",
          placeholder: "75000",
          step: "1000",
          min: "0"
        },
        { 
          key: "monthlyAfterTax", 
          label: "Monthly (AT)",
          title: "Monthly After-tax: Enter your take-home pay per month",
          className: "amountColumn",
          type: "number", 
          placeholder: "4100",
          step: "100",
          min: "0"
        },
        { 
          key: "additionalAnnualAT", 
          label: "Add. Annual (AT)",
          title: "Additional Annual After-tax: Enter bonuses, side income, or other annual income (after taxes)",
          className: "amountColumn",
          type: "number", 
          placeholder: "5000",
          step: "500",
          min: "0"
        },
      ];
    } else {
      return [
        ...baseColumns,
        { 
          key: "hourlyRate", 
          label: "Hourly Rate", 
          className: "amountColumn",
          type: "number",
          placeholder: "25.00", 
          step: "0.25",
          min: "0"
        },
        { 
          key: "expectedHours", 
          label: "Expected Hours/Year", 
          className: "amountColumn",
          type: "number",
          placeholder: "2080",
          step: "40", 
          min: "0"
        },
        { 
          key: "monthlyAfterTax", 
          label: "Monthly (AT)",
          title: "Monthly After-tax: Enter your take-home pay per month",
          className: "amountColumn",
          type: "number",
          placeholder: "4100",
          step: "100", 
          min: "0"
        },
        { 
          key: "additionalAnnualAT", 
          label: "add. Annual (AT)",
          title: "Additional Annual After-tax: Enter bonuses, side income, or other annual income (after taxes)",
          className: "amountColumn",
          type: "number", 
          placeholder: "5000",
          step: "500", 
          min: "0"
        },
      ];
    }
  }

  // View mode columns - with calculated display formatting
  return getViewModeColumns(type);
};

const getViewModeColumns = (type) => {
  const baseViewColumns = [
    { key: "type", label: "Type" }
  ];

  if (type === "salary") {
    return [
      ...baseViewColumns,
      {
        key: "annualPreTax",
        label: "Annual (PT)",
        title: "Annual Pre-tax: Income before taxes and deductions",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "monthlyPreTax", 
        label: "Monthly (PT)",
        title: "Monthly Pre-tax: Calculated monthly income before taxes",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "monthlyAfterTax",
        label: "Monthly (AT)", 
        title: "Monthly After-tax: Take-home pay after taxes and deductions",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "additionalAnnualAT",
        label: "Add. Annual (AT)", 
        title: "Additional Annual After-tax: Bonuses, side income, or other annual income",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "annualAfterTax",
        label: "Total Annual (AT)",
        title: "Total Annual After-tax: Monthly income × 12 + additional annual income", 
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
    ];
  } else {
    return [
      ...baseViewColumns,
      { 
        key: "hourlyRate", 
        label: "Hourly Rate",
        formatter: (value) => `$${(value || 0).toFixed(2)}/hr`
      },
      {
        key: "annualPreTax",
        label: "Annual (PT)",
        title: "Annual Pre-tax: Calculated yearly income before taxes",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "monthlyPreTax",
        label: "Monthly (PT)", 
        title: "Monthly Pre-tax: Calculated monthly income before taxes",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "monthlyAfterTax",
        label: "Monthly (AT)",
        title: "Monthly After-tax: Take-home pay after taxes and deductions", 
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "additionalAnnualAT",
        label: "Add. Annual (AT)", 
        title: "Additional Annual After-tax: Bonuses, side income, or other annual income",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
      {
        key: "annualAfterTax",
        label: "Total Annual (AT)",
        title: "Total Annual After-tax: (Hourly rate × hours × 12) + additional annual income",
        formatter: (value) => `$${(value || 0).toLocaleString()}`
      },
    ];
  }
};

export const createExpenseColumns = (editMode) => {
  const baseColumns = [
    { key: "name", label: "Expense", className: "descriptionColumn" },
    { key: "category", label: "Category", className: "categoryColumn" },
    { key: "cost", label: "Cost", className: "amountColumn" },
  ];

  if (editMode) {
    return [
      ...baseColumns,
      { key: "actions", label: "Actions", className: "actionsColumn" }
    ];
  }

  return baseColumns;
};