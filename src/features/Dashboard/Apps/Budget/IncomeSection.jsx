// src/features/Dashboard/Apps/Budget/IncomeSection.jsx
import React from "react";
import Section from "../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import BudgetFormInput from "../../../../components/ui/Form/BudgetFormInput";
import BudgetFormSelect from "../../../../components/ui/Form/BudgetFormSelect";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import { useIncomeSection } from "../../../../hooks/useIncomeCalculations";
import budgetStyles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";

const INCOME_TYPE_OPTIONS = [
  { value: "salary", label: "Salary" },
  { value: "hourly", label: "Hourly" },
];

const IncomeSection = ({ budget, smallApp }) => {
  const { tableData, saveIncome, clearIncome } = useIncomeSection(budget);

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    exitEditMode,
    updateEditRow,
  } = useEditableTable(tableData);

  const displayData = editMode ? editRows : tableData;
  const row = displayData[0] || {};
  const currentType = row.type || "salary";

  const handleSave = () => {
    saveIncome(editRows);
    exitEditMode();
  };

  const handleClear = () => {
    clearIncome();
    exitEditMode();
  };

  if (!editMode) {
    // View mode - display as cards (without income type card)
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
        resetLabel="Clear Income"
      />
    </Section>
  );
};

export default IncomeSection;
