// src/features/Dashboard/Apps/Budget/ExpensesSection.jsx
import React, { useMemo, useRef, useState } from "react";
import Section from "../../../../components/ui/Section/Section";
import Table from "../../../../components/ui/Table/Table";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import BudgetFormInput from "../../../../components/ui/Form/BudgetFormInput";
import BudgetFormSelect from "../../../../components/ui/Form/BudgetFormSelect";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useToast } from "../../../../hooks/useToast";
import { DebtSyncService } from "../../../../services/debtSyncService"; // Re-add this import
import tableStyles from "../../../../components/ui/Table/Table.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";

const EMPTY_EXPENSE = {
  name: "",
  cost: "",
  category: "required",
};

const CATEGORY_COLORS = {
  required: "#dc3545", // red
  flexible: "#ff9800", // orange
  "non-essential": "#28a745", // green
};

const ExpensesSection = ({ budget, smallApp }) => {
  const { saveData, data, clearExpenses, resetBudgetToDemo } =
    useFinancialData();
  const { showSuccess, showInfo } = useToast(); // Re-add showInfo

  const expenses = budget?.monthlyExpenses || [];

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    exitEditMode,
    updateEditRow,
    addEditRow,
    removeEditRow,
  } = useEditableTable(expenses);

  const [newExpense, setNewExpense] = useState({ ...EMPTY_EXPENSE });
  const newExpenseNameRef = useRef(null);

  // Calculate total expenses dynamically based on current edit state
  const totalExpenses = useMemo(() => {
    const activeExpenses = editMode ? editRows : expenses;
    return activeExpenses.reduce(
      (sum, exp) => sum + (parseFloat(exp.cost) || 0),
      0
    );
  }, [editMode, editRows, expenses]);

  // Sort expenses by cost descending ONLY in view mode, preserve order in edit mode
  const displayExpenses = useMemo(() => {
    if (editMode) {
      // In edit mode, return editRows without any sorting
      return editRows;
    }
    // In view mode, sort by cost descending
    return [...expenses].sort(
      (a, b) => (parseFloat(b.cost) || 0) - (parseFloat(a.cost) || 0)
    );
  }, [editMode, expenses, editRows]);

  // Handle saving from control panel
  const handleSave = () => {
    // Detect debt payment changes for notification
    const debtChanges = DebtSyncService.detectDebtPaymentChanges(
      expenses,
      editRows
    );

    // Update the budget with new expenses
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        monthlyExpenses: editRows,
      },
    };

    // If there are debt payment changes, also update the accounts
    if (debtChanges.length > 0) {
      const updatedAccounts = DebtSyncService.applyChangesToAccounts(
        data.accounts,
        debtChanges
      );
      updatedData.accounts = updatedAccounts;
    }

    saveData(updatedData);
    exitEditMode();
    showSuccess("Expenses saved successfully!");

    // Show debt sync notification if there are changes
    if (debtChanges.length > 0) {
      showDebtSyncNotification(debtChanges);
    }
  };

  // Helper function to show debt sync notification using toast
  const showDebtSyncNotification = (changes) => {
    const changesSummary = changes
      .map(
        (change) =>
          `${change.accountName}: $${change.oldAmount} → $${change.newAmount}`
      )
      .join("\n");

    showInfo(`Debt payments updated:\n${changesSummary}`);
  };

  // Handle reset to demo expenses
  const handleResetToDemo = () => {
    if (
      window.confirm(
        "Reset expenses to demo data? This will overwrite your current expenses."
      )
    ) {
      resetBudgetToDemo();
      exitEditMode();
    }
  };

  // Handle clear all expenses
  const handleClearAll = () => {
    if (
      window.confirm(
        "Clear all expenses? This will remove all your expense data."
      )
    ) {
      clearExpenses();
      exitEditMode();
    }
  };

  const handleAddExpense = () => {
    if (!newExpense.name.trim()) return;

    const expense = {
      id: `exp-${Date.now()}`,
      name: newExpense.name,
      cost: parseFloat(newExpense.cost) || 0,
      category: newExpense.category,
    };

    addEditRow(expense);
    setNewExpense({ ...EMPTY_EXPENSE });

    // Focus the name input for the next expense
    setTimeout(() => {
      if (newExpenseNameRef.current) {
        newExpenseNameRef.current.focus();
      }
    }, 0);
  };

  const handleRemoveExpense = (expenseId) => {
    const expenseIndex = editRows.findIndex((exp) => exp.id === expenseId);
    if (expenseIndex >= 0) {
      removeEditRow(expenseIndex);
    }
  };

  // Category badge for view mode
  const CategoryBadge = ({ category }) => (
    <span
      className={tableStyles.categoryBadge}
      style={{
        background: `${CATEGORY_COLORS[category] || "#888"}20`,
        color: CATEGORY_COLORS[category] || "#888",
        border: `1.5px solid ${CATEGORY_COLORS[category] || "#888"}`,
        padding: "var(--space-xxs) var(--space-xs)",
        borderRadius: "var(--border-radius-sm)",
        fontSize: "var(--font-size-xxs)",
        fontWeight: "var(--font-weight-medium)",
        textTransform: "capitalize",
      }}
    >
      {category === "required"
        ? "Required"
        : category === "flexible"
        ? "Flexible"
        : category === "non-essential"
        ? "Non-essential"
        : category}
    </span>
  );

  // Category select for edit mode with colored border
  const CategorySelect = ({ value, onChange, disabled }) => (
    <BudgetFormSelect
      options={[
        { value: "required", label: "Required" },
        { value: "flexible", label: "Flexible" },
        { value: "non-essential", label: "Non-essential" },
      ]}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={tableStyles.tableSelect}
      style={{
        borderColor: CATEGORY_COLORS[value] || "#888",
        borderWidth: "2px",
      }}
    />
  );

  const renderExpenseRow = (expense, index) => {
    const isDebtPayment = expense.isDebtPayment;
    const category = expense.category || "required";

    if (editMode) {
      return (
        <tr key={expense.id || index}>
          <td>
            <BudgetFormInput
              column={{ type: "text", placeholder: "Expense name" }}
              value={expense.name || ""}
              onChange={(value) => updateEditRow(index, "name", value)}
              disabled={false} // Always editable in edit mode
            />
          </td>
          <td>
            <CategorySelect
              value={category}
              onChange={(value) => updateEditRow(index, "category", value)}
              disabled={false} // Always editable in edit mode
            />
          </td>
          <td>
            <BudgetFormInput
              column={{
                type: "number",
                placeholder: "0.00",
                step: "0.01",
                min: "0",
              }}
              value={expense.cost || ""}
              onChange={(value) => updateEditRow(index, "cost", value)}
              disabled={false} // Always editable in edit mode
            />
          </td>
          <td>
            {/* Always show X button for removal, regardless of debt payment status */}
            <button
              className={tableStyles.removeButton}
              onClick={() => handleRemoveExpense(expense.id)}
              title={
                isDebtPayment
                  ? "Remove synced expense (will reset account payment to $0)"
                  : "Remove expense"
              }
            >
              ✕
            </button>
            {/* Show sync indicator only in addition to remove button */}
            {isDebtPayment && (
              <span
                className={tableStyles.syncedIndicator}
                title="Synced with debt account"
                style={{ marginLeft: "var(--space-xs)" }}
              >
                🔗
              </span>
            )}
          </td>
        </tr>
      );
    }

    // View mode
    return (
      <tr key={expense.id || index}>
        <td>
          {expense.name}
          {isDebtPayment && (
            <span
              style={{
                fontStyle: "italic",
                color: "var(--text-secondary)",
                marginLeft: "var(--space-xs)",
              }}
            >
              (synced)
            </span>
          )}
        </td>
        <td>
          <CategoryBadge category={category} />
        </td>
        <td className={tableStyles.alignRight}>
          $
          {(expense.cost || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </td>
      </tr>
    );
  };

  // Define columns with correct order: Expense Name, Category, Cost
  const viewColumns = [
    { key: "name", label: "Expense Name" },
    { key: "category", label: "Category" },
    { key: "cost", label: "Monthly Cost" },
  ];

  const editColumns = [
    { key: "name", label: "Expense Name" },
    { key: "category", label: "Category" },
    { key: "cost", label: "Monthly Cost" },
    { key: "actions", label: "Actions" },
  ];

  const columns = editMode ? editColumns : viewColumns;

  // Total row at the bottom
  const totalRow = (
    <tr style={{ borderTop: "2px solid var(--border-light)" }}>
      <td style={{ fontWeight: "bold" }}></td>
      <td style={{ fontWeight: "bold", textAlign: "right" }}>
        Total Monthly Expenses
      </td>
      <td
        className={tableStyles.alignRight}
        style={{
          fontWeight: "bold",
          color: "var(--color-primary)",
          fontSize: "var(--font-size-base)",
        }}
      >
        ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
      {editMode && <td></td>}
    </tr>
  );

  return (
    <Section
      header={
        <div className={sectionStyles.sectionHeaderRow}>
          <EditableTableHeader
            title="Monthly Expenses"
            editMode={editMode}
            onEnterEdit={enterEditMode}
            onCancelEdit={cancelEdit}
            editable={true}
          />
          <div className={sectionStyles.sectionHeaderRight}>
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-secondary)",
              }}
            >
              Total: ${totalExpenses.toLocaleString()}
            </span>
          </div>
        </div>
      }
    >
      <Table
        columns={columns}
        data={displayExpenses}
        renderRow={renderExpenseRow}
        smallApp={smallApp}
        editMode={editMode}
        defaultSortColumn="cost"
        disableSortingInEditMode={true} // Disable sorting in edit mode
        extraRow={
          <>
            {editMode && (
              <tr>
                <td>
                  <BudgetFormInput
                    column={{ type: "text", placeholder: "New expense name" }}
                    value={newExpense.name}
                    onChange={(value) =>
                      setNewExpense((prev) => ({ ...prev, name: value }))
                    }
                    ref={newExpenseNameRef}
                  />
                </td>
                <td>
                  <CategorySelect
                    value={newExpense.category}
                    onChange={(value) =>
                      setNewExpense((prev) => ({ ...prev, category: value }))
                    }
                  />
                </td>
                <td>
                  <BudgetFormInput
                    column={{
                      type: "number",
                      placeholder: "0.00",
                      step: "0.01",
                      min: "0",
                    }}
                    value={newExpense.cost}
                    onChange={(value) =>
                      setNewExpense((prev) => ({ ...prev, cost: value }))
                    }
                  />
                </td>
                <td>
                  <button
                    className={tableStyles.addButton}
                    onClick={handleAddExpense}
                    disabled={!newExpense.name.trim()}
                    title="Add expense"
                  >
                    ✓
                  </button>
                </td>
              </tr>
            )}
            {totalRow}
          </>
        }
      />
      {editMode && (
        <ControlPanel
          onSave={handleSave}
          onReset={handleResetToDemo}
          onClear={handleClearAll}
        />
      )}
    </Section>
  );
};

export default ExpensesSection;
