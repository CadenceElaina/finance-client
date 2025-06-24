// src/features/Dashboard/Apps/Budget/IncomeSection.jsx
import React, { useState, useMemo, useRef } from "react";
import Section from "../../../../components/ui/Section/Section";
import Table from "../../../../components/ui/Table/Table";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import { useBudgetForm } from "../../../../hooks/useBudgetForm";
import { useIncomeCalculations } from "../../../../hooks/useIncomeCalculations";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import budgetStyles from "./budget.module.css";

const INCOME_TYPE_OPTIONS = [
  { value: "salary", label: "Salary" },
  { value: "hourly", label: "Hourly" },
];

const IncomeSection = ({ budget, smallApp }) => {
  // Add safety check for budget
  if (!budget) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "var(--space-lg)",
          color: "var(--text-secondary)",
        }}
      >
        Initializing income data...
      </div>
    );
  }

  const incomeData = budget?.income || {};
  const calculations = useIncomeCalculations(incomeData);

  // Create standardized income data array for form handling
  const tableData = [
    {
      id: "income-1",
      type: incomeData.type || "salary",
      hourlyRate: incomeData.hourlyRate || "",
      expectedHours: incomeData.expectedAnnualHours || 2080,
      annualPreTax: incomeData.annualPreTax || "",
      monthlyAfterTax: incomeData.monthlyAfterTax || "",
      additionalAnnualAT: incomeData.additionalAnnualAT || "",
      ...calculations,
    },
  ];

  const formHook = useBudgetForm("income", tableData[0]);

  // Check if the form hook is still loading
  if (!formHook || formHook.sectionData.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "var(--space-lg)",
          color: "var(--text-secondary)",
        }}
      >
        Loading income form...
      </div>
    );
  }

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    handleSave: formSave,
    handleClear: formClear,
    handleResetToDemo,
    updateEditRow,
  } = formHook;

  const displayData = editMode ? editRows : tableData;
  const row = displayData[0] || {};
  const currentType = row.type || "salary";

  const handleSave = () => {
    const updatedRow = editRows[0];
    const incomeUpdate = {
      type: updatedRow.type,
      monthlyAfterTax: parseFloat(updatedRow.monthlyAfterTax) || 0,
      additionalAnnualAT: parseFloat(updatedRow.additionalAnnualAT) || 0,
    };

    if (updatedRow.type === "hourly") {
      incomeUpdate.hourlyRate = parseFloat(updatedRow.hourlyRate) || 0;
      incomeUpdate.expectedAnnualHours =
        parseFloat(updatedRow.expectedHours) || 2080;
      incomeUpdate.annualPreTax =
        (updatedRow.hourlyRate || 0) * (updatedRow.expectedHours || 2080);
    } else {
      incomeUpdate.annualPreTax = parseFloat(updatedRow.annualPreTax) || 0;
    }

    formSave([incomeUpdate]);
  };

  const handleClear = () => {
    const clearedIncome = {
      type: "salary",
      annualPreTax: 0,
      monthlyAfterTax: 0,
      additionalAnnualAT: 0,
      hourlyRate: null,
      expectedAnnualHours: null,
    };
    formClear(clearedIncome);
  };

  const handleReset = () => {
    const demoIncome = {
      type: "salary",
      monthlyAfterTax: 4100,
      annualPreTax: 75000,
      additionalAnnualAT: 5000,
    };
    handleResetToDemo(demoIncome);
  };

  if (!editMode) {
    // View mode - show income cards with the 4 requested values
    return (
      <Section
        header={
          <EditableTableHeader
            title="Income"
            editMode={editMode}
            onEnterEdit={enterEditMode}
            onCancelEdit={cancelEdit}
          />
        }
        className={`${budgetStyles.incomeSection} ${budgetStyles.compactSection}`}
      >
        <div className={budgetStyles.incomeCardsContainer}>
          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Monthly After-Tax</div>
            <div className={budgetStyles.cardValue}>
              ${row.monthlyAfterTax?.toLocaleString() || "0"}
            </div>
          </div>
          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Monthly Pre-Tax</div>
            <div className={budgetStyles.cardValue}>
              ${row.monthlyPreTax?.toLocaleString() || "0"}
            </div>
          </div>
          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Annual Pre-Tax</div>
            <div className={budgetStyles.cardValue}>
              ${row.annualPreTax?.toLocaleString() || "0"}
            </div>
          </div>
          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Annual After-Tax</div>
            <div className={budgetStyles.cardValue}>
              ${row.annualAfterTax?.toLocaleString() || "0"}
            </div>
          </div>
        </div>
      </Section>
    );
  }

  // Edit mode - display as form
  return (
    <Section
      header={
        <EditableTableHeader
          title="Income"
          editMode={editMode}
          onEnterEdit={enterEditMode}
          onCancelEdit={cancelEdit}
        />
      }
      className={`${budgetStyles.incomeSection} ${budgetStyles.compactSection}`}
    >
      <div className={budgetStyles.incomeEditForm}>
        {/* Income Type Selector */}
        <div className={budgetStyles.incomeTypeSelector}>
          <div className={budgetStyles.formGroup}>
            <label className={budgetStyles.formLabel}>Income Type</label>
            <select
              value={row.type || "salary"}
              onChange={(e) => updateEditRow(0, "type", e.target.value)}
              className={budgetStyles.formInput}
            >
              <option value="salary">Salary</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>

        {/* Dynamic Fields Based on Income Type */}
        <div className={budgetStyles.incomeFieldsGrid}>
          {currentType === "salary" ? (
            <>
              <div className={budgetStyles.formGroup}>
                <label className={budgetStyles.formLabel}>
                  Annual Pre-Tax Salary
                </label>
                <input
                  type="text"
                  value={row.annualPreTax || ""}
                  onChange={(e) =>
                    updateEditRow(0, "annualPreTax", e.target.value)
                  }
                  className={budgetStyles.formInput}
                  placeholder="75000"
                />
              </div>
            </>
          ) : (
            <>
              <div className={budgetStyles.formGroup}>
                <label className={budgetStyles.formLabel}>Hourly Rate</label>
                <input
                  type="number"
                  value={row.hourlyRate || ""}
                  onChange={(e) =>
                    updateEditRow(0, "hourlyRate", e.target.value)
                  }
                  className={budgetStyles.formInput}
                  placeholder="25.00"
                  step="0.25"
                  min="0"
                />
              </div>
              <div className={budgetStyles.formGroup}>
                <label className={budgetStyles.formLabel}>
                  Expected Annual Hours
                </label>
                <input
                  type="number"
                  value={row.expectedHours || ""}
                  onChange={(e) =>
                    updateEditRow(0, "expectedHours", e.target.value)
                  }
                  className={budgetStyles.formInput}
                  placeholder="2080"
                  step="40"
                  min="0"
                />
              </div>
            </>
          )}

          <div className={budgetStyles.formGroup}>
            <label className={budgetStyles.formLabel}>
              Monthly After-Tax Income
            </label>
            <input
              type="number"
              value={row.monthlyAfterTax || ""}
              onChange={(e) =>
                updateEditRow(0, "monthlyAfterTax", e.target.value)
              }
              className={budgetStyles.formInput}
              placeholder="4100"
              step="100"
              min="0"
            />
          </div>

          <div className={budgetStyles.formGroup}>
            <label className={budgetStyles.formLabel}>
              Additional Annual After-Tax
            </label>
            <input
              type="number"
              value={row.additionalAnnualAT || ""}
              onChange={(e) =>
                updateEditRow(0, "additionalAnnualAT", e.target.value)
              }
              className={budgetStyles.formInput}
              placeholder="5000"
              step="500"
              min="0"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={sectionStyles.editActions}>
          <button onClick={handleSave} className="btn-primary">
            Save Income
          </button>
          <button onClick={handleClear} className="btn-secondary">
            Clear
          </button>
          <button onClick={handleReset} className="btn-secondary">
            Reset to Demo
          </button>
        </div>
      </div>
    </Section>
  );
};

export default IncomeSection;
