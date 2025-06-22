// src/features/Dashboard/Apps/Budget/utils/columnDefinitions.js
const INCOME_TYPES = [
  { value: 'salary', label: 'Salary' },
  { value: 'hourly', label: 'Hourly' }
];

const formatCurrency = (value) => `$${(value || 0).toLocaleString()}`;
const formatHourlyRate = (value) => `$${(value || 0).toFixed(2)}/hr`;

// Simplified column factory - REMOVED effectiveTaxRate
export const createColumnConfig = (type, mode) => {
  const baseColumns = {
    type: { key: "type", label: "Type", type: "select", options: INCOME_TYPES },
    annualPreTax: { 
      key: "annualPreTax", 
      label: "Annual (PT)",
      type: "number",
      placeholder: "75000",
      step: "1000",
      min: "0",
      formatter: formatCurrency,
      title: "Annual Pre-tax: Enter your yearly salary before taxes"
    },
    monthlyPreTax: {
      key: "monthlyPreTax",
      label: "Monthly (PT)",
      formatter: formatCurrency,
      title: "Monthly Pre-tax: Calculated monthly income before taxes",
      readOnly: true
    },
    monthlyAfterTax: { 
      key: "monthlyAfterTax", 
      label: "Monthly (AT)",
      type: "number",
      placeholder: "4100",
      step: "100",
      min: "0",
      formatter: formatCurrency,
      title: "Monthly After-tax: Enter your take-home pay per month"
    },
    hourlyRate: { 
      key: "hourlyRate", 
      label: "Hourly Rate",
      type: "number",
      placeholder: "25.00",
      step: "0.25",
      min: "0",
      formatter: formatHourlyRate,
      title: "Hourly Rate: Enter your hourly wage before taxes"
    },
    expectedHours: { 
      key: "expectedHours", 
      label: "Expected Hours/Year",
      type: "number",
      placeholder: "2080",
      step: "40",
      min: "0",
      title: "Expected Annual Hours: Enter expected hours per year"
    },
    additionalAnnualAT: { 
      key: "additionalAnnualAT", 
      label: "Add. Annual (AT)",
      type: "number",
      placeholder: "5000",
      step: "500",
      min: "0",
      formatter: formatCurrency,
      title: "Additional Annual After-tax: Enter bonuses, side income, or other annual income (after taxes)"
    },
    annualAfterTax: {
      key: "annualAfterTax",
      label: "Annual (AT)",
      formatter: formatCurrency,
      title: "Annual After-tax: Monthly income × 12 + additional annual income",
      readOnly: true
    }
    // REMOVED: effectiveTaxRate
  };

  // Define column sets for different income types and modes
  const columnSets = {
    salary: {
      edit: ['type', 'annualPreTax', 'monthlyAfterTax', 'additionalAnnualAT'],
      view: ['type', 'monthlyAfterTax', 'monthlyPreTax', 'annualPreTax', 'annualAfterTax']
    },
    hourly: {
      edit: ['type', 'hourlyRate', 'expectedHours', 'monthlyAfterTax', 'additionalAnnualAT'],
      view: ['type', 'hourlyRate', 'monthlyAfterTax', 'monthlyPreTax', 'annualPreTax', 'annualAfterTax']
    }
  };

  const columns = columnSets[type]?.[mode] || columnSets.salary[mode];
  return columns.map(key => baseColumns[key]).filter(Boolean);
};

// Simplified main function
export const createIncomeColumns = (type, editMode) => {
  return createColumnConfig(type, editMode ? 'edit' : 'view');
};

// Expense column configuration
export const createExpenseColumns = (editMode) => {
  const baseExpenseColumns = {
    name: {
      key: "name",
      label: "Expense Name",
      type: "text",
      placeholder: "Enter expense name",
      required: true
    },
    cost: {
      key: "cost",
      label: "Monthly Cost",
      type: "number",
      placeholder: "0.00",
      step: "0.01",
      min: "0",
      formatter: formatCurrency
    },
    category: {
      key: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "required", label: "Required" },
        { value: "flexible", label: "Flexible" },
        { value: "non-essential", label: "Non-essential" }
      ]
    },
    actions: {
      key: "actions",
      label: "Actions",
      type: "actions"
    }
  };

  const columnSets = {
    edit: ['name', 'cost', 'category', 'actions'],
    view: ['name', 'cost', 'category']
  };

  const columns = columnSets[editMode ? 'edit' : 'view'];
  return columns.map(key => baseExpenseColumns[key]).filter(Boolean);
};