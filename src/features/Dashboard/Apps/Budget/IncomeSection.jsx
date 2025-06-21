// src/features/Dashboard/Apps/Budget/IncomeSection.jsx
import React, { useState, useRef } from "react";
import Section from "../../../../components/ui/Section/Section";
import Table from "../../../../components/ui/Table/Table";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import { useToast } from "../../../../hooks/useToast";
import budgetStyles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../components/ui/Table/Table.module.css";

const DEFAULT_HOURS = 2080;

const IncomeSection = ({ budget, smallApp }) => {
  const { updateIncome, saveData, data } = useFinancialData();
  const { showSuccess } = useToast();
  const income = budget?.income || {};

  // Create income data as array for table
  const incomeData = [
    {
      id: "income-1",
      type: income.type || "salary",
      hourlyRate: income.hourlyRate || "",
      expectedHours: income.expectedAnnualHours || DEFAULT_HOURS,
      annualPreTax: income.annualPreTax || "",
      monthlyAfterTax: income.monthlyAfterTax || "",
    },
  ];

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    exitEditMode,
    updateEditRow,
  } = useEditableTable(incomeData);

  // Calculate derived values based on current row data
  const calculateValues = (row) => {
    const hourlyRate = parseFloat(row.hourlyRate) || 0;
    const expectedHours = parseFloat(row.expectedHours) || 0;
    const annualPreTax = parseFloat(row.annualPreTax) || 0;
    const monthlyAfterTax = parseFloat(row.monthlyAfterTax) || 0;

    if (row.type === "hourly") {
      const calculatedAnnualPreTax = hourlyRate * expectedHours;
      const calculatedMonthlyPreTax = calculatedAnnualPreTax / 12;
      const calculatedAnnualAfterTax = monthlyAfterTax * 12;

      return {
        annualPreTax: calculatedAnnualPreTax,
        monthlyPreTax: calculatedMonthlyPreTax,
        annualAfterTax: calculatedAnnualAfterTax,
      };
    } else {
      // salary
      const calculatedMonthlyPreTax = annualPreTax / 12;
      const calculatedAnnualAfterTax = monthlyAfterTax * 12;

      return {
        annualPreTax,
        monthlyPreTax: calculatedMonthlyPreTax,
        annualAfterTax: calculatedAnnualAfterTax,
      };
    }
  };

  const handleSave = () => {
    const row = editRows[0];
    const calculatedValues = calculateValues(row);

    const incomeData = {
      type: row.type,
      monthlyAfterTax: parseFloat(row.monthlyAfterTax) || 0,
    };

    if (row.type === "hourly") {
      incomeData.hourlyRate = parseFloat(row.hourlyRate) || 0;
      incomeData.expectedAnnualHours =
        parseFloat(row.expectedHours) || DEFAULT_HOURS;
      incomeData.annualPreTax = calculatedValues.annualPreTax;
    } else {
      incomeData.annualPreTax = parseFloat(row.annualPreTax) || 0;
    }

    updateIncome(incomeData);

    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        income: incomeData,
      },
    };
    saveData(updatedData);
    exitEditMode();
    showSuccess("Income saved successfully!");
  };

  const handleClear = () => {
    const clearedIncome = {
      type: "salary",
      annualPreTax: 0,
      monthlyAfterTax: 0,
      hourlyRate: null,
      expectedAnnualHours: null,
    };

    updateIncome(clearedIncome);

    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        income: clearedIncome,
      },
    };
    saveData(updatedData);
    exitEditMode();
    showSuccess("Income cleared!");
  };

  const displayData = editMode ? editRows : incomeData;
  const currentRow = displayData[0] || incomeData[0];
  const calculatedValues = calculateValues(currentRow);

  const renderIncomeRow = (row, index) => {
    const calculated = calculateValues(row);

    if (!editMode) {
      // View mode - show relevant fields based on type
      if (row.type === "salary") {
        return (
          <tr key={row.id || index}>
            <td>Salary</td>
            <td>${(calculated.annualPreTax || 0).toLocaleString()}</td>
            <td>${(calculated.monthlyPreTax || 0).toLocaleString()}</td>
            <td>${(parseFloat(row.monthlyAfterTax) || 0).toLocaleString()}</td>
            <td>${(calculated.annualAfterTax || 0).toLocaleString()}</td>
          </tr>
        );
      } else {
        // Hourly - show hourly rate but not expected hours in view mode
        return (
          <tr key={row.id || index}>
            <td>Hourly</td>
            <td>${(parseFloat(row.hourlyRate) || 0).toFixed(2)}/hr</td>
            <td>${(calculated.annualPreTax || 0).toLocaleString()}</td>
            <td>${(calculated.monthlyPreTax || 0).toLocaleString()}</td>
            <td>${(parseFloat(row.monthlyAfterTax) || 0).toLocaleString()}</td>
            <td>${(calculated.annualAfterTax || 0).toLocaleString()}</td>
          </tr>
        );
      }
    }

    // Edit mode - only show editable fields based on type
    if (row.type === "salary") {
      return (
        <tr key={row.id || index}>
          <td>
            <select
              value={row.type}
              onChange={(e) => updateEditRow(index, "type", e.target.value)}
              className={tableStyles.tableSelect}
            >
              <option value="salary">Salary</option>
              <option value="hourly">Hourly</option>
            </select>
          </td>
          <td>
            <input
              type="number"
              value={row.annualPreTax}
              onChange={(e) =>
                updateEditRow(index, "annualPreTax", e.target.value)
              }
              className={tableStyles.tableInput}
              placeholder="75000"
              step="1000"
              min="0"
            />
          </td>
          <td>
            <input
              type="number"
              value={row.monthlyAfterTax}
              onChange={(e) =>
                updateEditRow(index, "monthlyAfterTax", e.target.value)
              }
              className={tableStyles.tableInput}
              placeholder="4100"
              step="100"
              min="0"
            />
          </td>
        </tr>
      );
    } else {
      // Hourly edit mode - show hourly rate, expected hours, and monthly after tax as editable
      return (
        <tr key={row.id || index}>
          <td>
            <select
              value={row.type}
              onChange={(e) => updateEditRow(index, "type", e.target.value)}
              className={tableStyles.tableSelect}
            >
              <option value="salary">Salary</option>
              <option value="hourly">Hourly</option>
            </select>
          </td>
          <td>
            <input
              type="number"
              value={row.hourlyRate}
              onChange={(e) =>
                updateEditRow(index, "hourlyRate", e.target.value)
              }
              className={tableStyles.tableInput}
              placeholder="25.00"
              step="0.25"
              min="0"
            />
          </td>
          <td>
            <input
              type="number"
              value={row.expectedHours}
              onChange={(e) =>
                updateEditRow(index, "expectedHours", e.target.value)
              }
              className={tableStyles.tableInput}
              placeholder="2080"
              step="40"
              min="0"
            />
          </td>
          <td>
            <input
              type="number"
              value={row.monthlyAfterTax}
              onChange={(e) =>
                updateEditRow(index, "monthlyAfterTax", e.target.value)
              }
              className={tableStyles.tableInput}
              placeholder="4100"
              step="100"
              min="0"
            />
          </td>
        </tr>
      );
    }
  };

  // Dynamic columns based on income type and edit mode
  const currentType = displayData[0]?.type || "salary";

  // View mode columns with tooltips
  const salaryViewColumns = [
    { key: "type", label: "Type" },
    {
      key: "annualPreTax",
      label: "Annual (PT)",
      title: "Annual Pre-tax: Income before taxes and deductions",
    },
    {
      key: "monthlyPreTax",
      label: "Monthly (PT)",
      title: "Monthly Pre-tax: Calculated monthly income before taxes",
    },
    {
      key: "monthlyAfterTax",
      label: "Monthly (AT)",
      title: "Monthly After-tax: Take-home pay after taxes and deductions",
    },
    {
      key: "annualAfterTax",
      label: "Annual (AT)",
      title: "Annual After-tax: Total yearly take-home pay",
    },
  ];

  const hourlyViewColumns = [
    { key: "type", label: "Type" },
    { key: "hourlyRate", label: "Hourly Rate" },
    {
      key: "annualPreTax",
      label: "Annual (PT)",
      title: "Annual Pre-tax: Calculated yearly income before taxes",
    },
    {
      key: "monthlyPreTax",
      label: "Monthly (PT)",
      title: "Monthly Pre-tax: Calculated monthly income before taxes",
    },
    {
      key: "monthlyAfterTax",
      label: "Monthly (AT)",
      title: "Monthly After-tax: Take-home pay after taxes and deductions",
    },
    {
      key: "annualAfterTax",
      label: "Annual (AT)",
      title: "Annual After-tax: Total yearly take-home pay",
    },
  ];

  // Edit mode columns - ONLY show editable fields with tooltips
  const salaryEditColumns = [
    { key: "type", label: "Type" },
    {
      key: "annualPreTax",
      label: "Annual (PT)",
      title: "Annual Pre-tax: Enter your yearly salary before taxes",
    },
    {
      key: "monthlyAfterTax",
      label: "Monthly (AT)",
      title: "Monthly After-tax: Enter your take-home pay per month",
    },
  ];

  const hourlyEditColumns = [
    { key: "type", label: "Type" },
    { key: "hourlyRate", label: "Hourly Rate" },
    { key: "expectedHours", label: "Expected Hours/Year" },
    {
      key: "monthlyAfterTax",
      label: "Monthly (AT)",
      title: "Monthly After-tax: Enter your take-home pay per month",
    },
  ];

  // Select appropriate columns
  let columns;
  if (editMode) {
    columns = currentType === "salary" ? salaryEditColumns : hourlyEditColumns;
  } else {
    columns = currentType === "salary" ? salaryViewColumns : hourlyViewColumns;
  }

  return (
    <Section
      header={
        <div className={sectionStyles.sectionHeaderRow}>
          <EditableTableHeader
            title="Income"
            editMode={editMode}
            onEnterEdit={enterEditMode}
            onCancelEdit={cancelEdit}
            editable={true}
          />
        </div>
      }
      className={budgetStyles.incomeSection}
      smallApp={smallApp}
    >
      <Table
        columns={columns}
        data={displayData}
        renderRow={renderIncomeRow}
        smallApp={smallApp}
        editMode={editMode}
      />

      {editMode && (
        <ControlPanel
          onSave={handleSave}
          saveLabel="Save Income"
          onClear={handleClear}
          resetLabel="Clear Income"
        />
      )}
    </Section>
  );
};

export default IncomeSection;
