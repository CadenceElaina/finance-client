// src/features/Dashboard/Apps/Budget/IncomeSection.jsx
import React from "react";
import Section from "../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import BudgetFormInput from "../../../../components/ui/Form/BudgetFormInput";
import BudgetFormSelect from "../../../../components/ui/Form/BudgetFormSelect";
import { useBudgetForm } from "../../../../hooks/useBudgetForm";
import { useIncomeCalculations } from "../../../../hooks/useIncomeCalculations";
import { DEFAULT_DEMO_BUDGET } from "../../../../utils/constants";
import budgetStyles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";

const INCOME_TYPE_OPTIONS = [
  { value: "salary", label: "Salary" },
  { value: "hourly", label: "Hourly" },
];

const IncomeSection = ({ budget, smallApp }) => {
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

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    handleSave: formSave,
    handleClear: formClear,
    handleResetToDemo,
    updateEditRow,
  } = useBudgetForm("income", tableData[0]);

  const displayData = editMode ? editRows : tableData;
  const row = displayData[0] || {};
  const currentType = row.type || "salary";

  const handleSave = () => {
    const editRow = editRows[0];
    if (!editRow) return;

    // Create the income object structure that matches the budget's income format
    const incomeUpdate = {
      type: editRow.type,
      monthlyAfterTax: parseFloat(editRow.monthlyAfterTax) || 0,
      additionalAnnualAT: parseFloat(editRow.additionalAnnualAT) || 0,
    };

    if (editRow.type === "hourly") {
      incomeUpdate.hourlyRate = parseFloat(editRow.hourlyRate) || 0;
      incomeUpdate.expectedAnnualHours =
        parseFloat(editRow.expectedHours) || 2080;
      // For hourly, calculate annualPreTax from hourly rate and hours
      incomeUpdate.annualPreTax =
        incomeUpdate.hourlyRate * incomeUpdate.expectedAnnualHours;
    } else {
      incomeUpdate.annualPreTax = parseFloat(editRow.annualPreTax) || 0;
      // Clear hourly fields for salary type
      incomeUpdate.hourlyRate = null;
      incomeUpdate.expectedAnnualHours = null;
    }

    return formSave(incomeUpdate, "Income saved successfully!");
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
    formClear(clearedIncome, "Income cleared!");
  };

  const handleReset = () => {
    handleResetToDemo(DEFAULT_DEMO_BUDGET.income, "Income reset to demo data!");
  };

  if (!editMode) {
    // View mode - display as cards
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
        <div className={budgetStyles.incomeCardsContainer}>
          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Monthly (Pre-tax)</div>
            <div className={budgetStyles.cardValue}>
              ${(row.monthlyPreTax || 0).toLocaleString()}
            </div>
          </div>

          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Annual (Pre-tax)</div>
            <div className={budgetStyles.cardValue}>
              ${(row.annualPreTax || 0).toLocaleString()}
            </div>
          </div>

          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Monthly (After-tax)</div>
            <div className={budgetStyles.cardValue}>
              ${(row.monthlyAfterTax || 0).toLocaleString()}
            </div>
          </div>

          <div className={budgetStyles.incomeCard}>
            <div className={budgetStyles.cardLabel}>Annual (After-tax)</div>
            <div className={budgetStyles.cardValue}>
              ${(row.annualAfterTax || 0).toLocaleString()}
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
      <div className={budgetStyles.incomeEditForm}>
        <div className={budgetStyles.incomeTypeSelector}>
          <label className={budgetStyles.formLabel}>Income Type</label>
          <BudgetFormSelect
            options={INCOME_TYPE_OPTIONS}
            value={row.type}
            onChange={(value) => updateEditRow(0, "type", value)}
          />
        </div>

        {currentType === "salary" ? (
          <div className={budgetStyles.incomeFieldsGrid}>
            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>Annual (Pre-tax)</label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "75000",
                  step: "1000",
                  min: "0",
                  title:
                    "Annual Pre-tax: Enter your yearly salary before taxes",
                }}
                value={row.annualPreTax}
                onChange={(value) => updateEditRow(0, "annualPreTax", value)}
              />
            </div>

            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>
                Monthly (After-tax)
              </label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "4100",
                  step: "100",
                  min: "0",
                  title:
                    "Monthly After-tax: Enter your take-home pay per month",
                }}
                value={row.monthlyAfterTax}
                onChange={(value) => updateEditRow(0, "monthlyAfterTax", value)}
              />
            </div>

            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>
                Additional Annual (After-tax)
              </label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "5000",
                  step: "500",
                  min: "0",
                  title:
                    "Additional Annual After-tax: Enter bonuses, side income, or other annual income (after taxes)",
                }}
                value={row.additionalAnnualAT}
                onChange={(value) =>
                  updateEditRow(0, "additionalAnnualAT", value)
                }
              />
            </div>
          </div>
        ) : (
          <div className={budgetStyles.incomeFieldsGrid}>
            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>Hourly Rate</label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "25.00",
                  step: "0.25",
                  min: "0",
                  title: "Hourly Rate: Enter your hourly wage before taxes",
                }}
                value={row.hourlyRate}
                onChange={(value) => updateEditRow(0, "hourlyRate", value)}
              />
            </div>

            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>
                Expected Annual Hours
              </label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "2080",
                  step: "40",
                  min: "0",
                  title: "Expected Annual Hours: Enter expected hours per year",
                }}
                value={row.expectedHours}
                onChange={(value) => updateEditRow(0, "expectedHours", value)}
              />
            </div>

            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>
                Monthly (After-tax)
              </label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "4100",
                  step: "100",
                  min: "0",
                  title:
                    "Monthly After-tax: Enter your take-home pay per month",
                }}
                value={row.monthlyAfterTax}
                onChange={(value) => updateEditRow(0, "monthlyAfterTax", value)}
              />
            </div>

            <div className={budgetStyles.formGroup}>
              <label className={budgetStyles.formLabel}>
                Additional Annual (After-tax)
              </label>
              <BudgetFormInput
                column={{
                  type: "number",
                  placeholder: "5000",
                  step: "500",
                  min: "0",
                  title:
                    "Additional Annual After-tax: Enter bonuses, side income, or other annual income (after taxes)",
                }}
                value={row.additionalAnnualAT}
                onChange={(value) =>
                  updateEditRow(0, "additionalAnnualAT", value)
                }
              />
            </div>
          </div>
        )}
      </div>

      <ControlPanel
        onSave={handleSave}
        saveLabel="Save Income"
        onClear={handleClear}
        onReset={handleReset}
      />
    </Section>
  );
};

export default IncomeSection;
