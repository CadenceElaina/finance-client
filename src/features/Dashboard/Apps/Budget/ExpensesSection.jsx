// src/features/Dashboard/Apps/Budget/ExpensesSection.jsx
import { Plus, X } from "lucide-react"; // Add X import for remove button
import React, { useMemo, useRef, useState } from "react";
import Button from "../../../../components/ui/Button/Button";
import Section from "../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import Table from "../../../../components/ui/Table/Table";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../components/ui/Table/Table.module.css";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useToast } from "../../../../hooks/useToast";
import {
  detectDebtPaymentChanges,
  detectGoalExpenseChanges,
} from "../../../../utils/debtPaymentSync";
import { DEFAULT_DEMO_BUDGET } from "../../../../utils/constants";
import budgetStyles from "./budget.module.css";

const EMPTY_EXPENSE = {
  name: "",
  cost: "",
  category: "required", // Default to required category
  isDebtPayment: false, // Cannot be set manually
  isGoalExpense: false, // Cannot be set manually
};

const CATEGORY_COLORS = {
  required: "#dc3545", // red
  flexible: "#ff9800", // orange
  "non-essential": "#28a745", // green
};

const ExpensesSection = ({ budget, smallApp }) => {
  const { saveData, data } = useFinancialData();
  const { showSuccess, showInfo, showWarning } = useToast();

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
    const currentExpenses = editMode ? editRows : expenses;
    return currentExpenses.reduce(
      (sum, exp) => sum + (parseFloat(exp.cost) || 0),
      0
    );
  }, [editMode, editRows, expenses]);

  // Sort expenses by cost descending ONLY in view mode, preserve order in edit mode
  const displayExpenses = useMemo(() => {
    if (editMode) {
      return editRows;
    }
    return [...expenses].sort(
      (a, b) => (parseFloat(b.cost) || 0) - (parseFloat(a.cost) || 0)
    );
  }, [editMode, expenses, editRows]);

  // FIXED: Enhanced save handler to sync goal budget amounts back to goals
  const handleSave = () => {
    if (!editRows || editRows.length === 0) {
      showInfo("No changes to save");
      return;
    }

    // Detect goal expense changes for syncing back to goals
    const goalExpenseChanges = detectGoalExpenseChanges(expenses, editRows);
    const debtPaymentChanges = detectDebtPaymentChanges(expenses, editRows);

    // Update budget with new expenses
    let updatedData = { ...data };

    // FIXED: Sync goal budget amounts back to goals
    if (goalExpenseChanges.length > 0) {
      updatedData.goals = updatedData.goals.map((goal) => {
        const change = goalExpenseChanges.find((c) => c.goalId === goal.id);
        return change
          ? { ...goal, budgetMonthlyAmount: change.newAmount }
          : goal;
      });
    }

    if (debtPaymentChanges.length > 0) {
      updatedData.accounts = updatedData.accounts.map((account) => {
        const change = debtPaymentChanges.find(
          (c) => c.accountId === account.id
        );
        return change
          ? { ...account, monthlyPayment: change.newAmount }
          : account;
      });
    }

    updatedData.budget.monthlyExpenses = editRows.map((exp) => ({
      ...exp,
      cost: parseFloat(exp.cost) || 0,
    }));

    // FIXED: Check for debt payment changes - now properly imported
    const debtChanges = detectDebtPaymentChanges(expenses, editRows);

    saveData(updatedData);
    exitEditMode();

    let successMessage = "Expenses saved successfully!";

    if (goalExpenseChanges.length > 0) {
      const goalChangesSummary = goalExpenseChanges
        .map(
          (change) => `Goal budget: $${change.oldAmount} → $${change.newAmount}`
        )
        .join("\n");
      successMessage += `\n\nGoal budget updates:\n${goalChangesSummary}`;
    }

    if (debtChanges.length > 0) {
      const changesSummary = debtChanges
        .map(
          (change) =>
            `${change.accountName}: $${change.oldAmount} → $${change.newAmount}`
        )
        .join("\n");
      successMessage += `\n\nDebt payment updates:\n${changesSummary}`;
    }

    showSuccess(successMessage);
  };

  // Handle reset to demo expenses
  const handleResetToDemo = () => {
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        monthlyExpenses: DEFAULT_DEMO_BUDGET.monthlyExpenses,
      },
    };

    saveData(updatedData);
    exitEditMode();
    showWarning("Expenses reset to demo data!");
  };

  // Enhanced clear all with same sync handling
  const handleClearAll = () => {
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        monthlyExpenses: [],
      },
    };

    saveData(updatedData);
    exitEditMode();
    showWarning("All expenses cleared!");
  };

  const handleAddExpense = () => {
    if (
      !newExpense.name.trim() ||
      !newExpense.cost ||
      parseFloat(newExpense.cost) <= 0
    ) {
      showInfo("Please enter a valid expense name and cost");
      return;
    }

    const expenseToAdd = {
      id: `exp-${Date.now()}`,
      name: newExpense.name.trim(),
      cost: parseFloat(newExpense.cost),
      category: newExpense.category,
      isDebtPayment: false, // Only debt sync can set this to true
      isGoalExpense: false, // Only goals can set this to true
    };

    addEditRow(expenseToAdd);
    setNewExpense({ ...EMPTY_EXPENSE });

    if (newExpenseNameRef.current) {
      newExpenseNameRef.current.focus();
    }
  };

  // FIXED: Enhanced remove handler with proper goal sync warning
  const handleRemoveExpense = (index) => {
    const expense = editRows[index];

    // Warn if trying to remove synced expenses
    if (expense?.isDebtPayment) {
      showWarning(
        `${expense.name} is synced from debt accounts. Remove from Accounts app to delete permanently.`
      );
    } else if (expense?.isGoalExpense) {
      showWarning(
        `${expense.name} is synced from goals. This will also remove the budget allocation from the goal.`
      );
    }

    removeEditRow(index);
  };

  // Category badge for view mode - FIXED: Properly detect goal expenses
  const CategoryBadge = ({ category, isGoalExpense, isDebtPayment }) => {
    let badgeClass = tableStyles.categoryBadge;
    let displayCategory = category;

    // FIXED: Check for goal expenses first, regardless of category field
    if (isGoalExpense === true || category === "goal") {
      badgeClass += ` ${tableStyles.goal}`;
      displayCategory = "goal";
    } else if (isDebtPayment === true || category === "debt") {
      badgeClass += ` ${tableStyles.debt}`;
      displayCategory = "debt";
    } else {
      switch (category) {
        case "required":
          badgeClass += ` ${tableStyles.required}`;
          break;
        case "flexible":
          badgeClass += ` ${tableStyles.flexible}`;
          break;
        case "non-essential":
          badgeClass += ` ${tableStyles.nonessential}`;
          break;
        default:
          break;
      }
    }

    return (
      <span className={badgeClass}>{displayCategory.replace("-", " ")}</span>
    );
  };

  // FIXED: CategorySelect - goal expenses show as read-only but with clear indication
  const CategorySelect = ({
    value,
    onChange,
    disabled = false,
    isGoalExpense = false,
    isDebtPayment = false,
  }) => {
    // FIXED: Don't allow category changes for synced expenses, but show clear labels
    if (isGoalExpense === true) {
      return (
        <span className={`${tableStyles.categoryBadge} ${tableStyles.goal}`}>
          Goal
        </span>
      );
    }

    if (isDebtPayment === true) {
      return (
        <span className={`${tableStyles.categoryBadge} ${tableStyles.debt}`}>
          Debt
        </span>
      );
    }

    // FIXED: Apply category-specific CSS class based on current value
    let selectClass = tableStyles.tableSelect;
    switch (value) {
      case "required":
        selectClass += ` ${tableStyles.required}`;
        break;
      case "flexible":
        selectClass += ` ${tableStyles.flexible}`;
        break;
      case "non-essential":
        selectClass += ` ${tableStyles.nonessential}`;
        break;
      default:
        break;
    }

    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
        disabled={disabled}
      >
        <option value="required" className={tableStyles.required}>
          Required
        </option>
        <option value="flexible" className={tableStyles.flexible}>
          Flexible
        </option>
        <option value="non-essential" className={tableStyles.nonessential}>
          Non-essential
        </option>
        {/* REMOVED: Goal option - goals can only be created from Goals app */}
      </select>
    );
  };

  // FIXED: Enhanced row renderer - allow goal expense amount editing but not category
  const renderExpenseRow = (expense, index) => {
    if (editMode) {
      // FIXED: Properly detect goal and debt expenses
      const isGoalExpense =
        expense.isGoalExpense === true ||
        (expense.id && expense.id.startsWith("exp-goal-"));
      const isDebtPayment =
        expense.isDebtPayment === true ||
        (expense.id && expense.id.startsWith("exp-debt-"));

      return (
        <tr key={expense.id || index}>
          {/* Expense Name */}
          <td>
            {isGoalExpense || isDebtPayment ? (
              <span className={tableStyles.syncedIndicator}>
                {expense.name}
              </span>
            ) : (
              <input
                type="text"
                value={editRows[index]?.name || ""}
                onChange={(e) => updateEditRow(index, "name", e.target.value)}
                className={tableStyles.tableInput}
                placeholder="Expense name"
              />
            )}
          </td>
          {/* Category */}
          <td>
            <CategorySelect
              value={editRows[index]?.category || "required"}
              onChange={(value) => updateEditRow(index, "category", value)}
              isGoalExpense={isGoalExpense}
              isDebtPayment={isDebtPayment}
            />
          </td>
          {/* Cost - FIXED: Allow editing for goal expenses but with special styling */}
          <td className={tableStyles.alignRight}>
            <input
              type="number"
              value={editRows[index]?.cost || ""}
              onChange={(e) => updateEditRow(index, "cost", e.target.value)}
              className={`${tableStyles.tableInput} ${
                isGoalExpense ? tableStyles.goal : ""
              } ${isDebtPayment ? tableStyles.debt : ""}`}
              placeholder="0.00"
              step="0.01"
              min="0"
              title={
                isGoalExpense
                  ? "Editing this will update the goal's budget allocation"
                  : isDebtPayment
                  ? "Editing this will update the debt's monthly payment"
                  : "Monthly cost"
              }
            />
          </td>
          {/* Actions */}
          <td className={tableStyles.alignCenter}>
            <button
              onClick={() => handleRemoveExpense(index)}
              className={`${tableStyles.actionButton} ${tableStyles.removeButton}`}
              title={
                isGoalExpense
                  ? "Remove goal expense (will also remove budget allocation from goal)"
                  : isDebtPayment
                  ? "Remove debt expense"
                  : "Remove expense"
              }
              aria-label={`Remove ${expense.name}`}
            >
              <X className={tableStyles.buttonIcon} />
            </button>
          </td>
        </tr>
      );
    }

    // View mode - FIXED: Properly detect and display goal expenses
    const isGoalExpense =
      expense.isGoalExpense === true ||
      (expense.id && expense.id.startsWith("exp-goal-"));
    const isDebtPayment =
      expense.isDebtPayment === true ||
      (expense.id && expense.id.startsWith("exp-debt-"));

    return (
      <tr key={expense.id || index}>
        <td>{expense.name}</td>
        <td>
          <CategoryBadge
            category={expense.category}
            isGoalExpense={isGoalExpense}
            isDebtPayment={isDebtPayment}
          />
        </td>
        <td className={tableStyles.alignRight}>
          $
          {(parseFloat(expense.cost) || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </td>
      </tr>
    );
  };

  // New expense row with category-specific styling
  const newExpenseRow = editMode ? (
    <tr
      key="new-expense-row" // Added key
      style={{
        background: "var(--surface-dark)",
        borderTop: "2px solid var(--border-light)",
      }}
    >
      <td>
        <input
          ref={newExpenseNameRef}
          type="text"
          value={newExpense.name}
          onChange={(e) =>
            setNewExpense((prev) => ({ ...prev, name: e.target.value }))
          }
          className={tableStyles.tableInput}
          placeholder="Enter expense name"
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
      <td className={tableStyles.alignRight}>
        <input
          type="number"
          value={newExpense.cost}
          onChange={(e) =>
            setNewExpense((prev) => ({ ...prev, cost: e.target.value }))
          }
          className={tableStyles.tableInput}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </td>
      <td className={tableStyles.alignCenter}>
        <button
          onClick={handleAddExpense}
          disabled={!newExpense.name || !newExpense.cost}
          className={`${tableStyles.actionButton} ${tableStyles.addButton}`}
          title="Add expense"
          aria-label="Add new expense"
        >
          <Plus className={tableStyles.buttonIcon} />
        </button>
      </td>
    </tr>
  ) : null;

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
    <tr key="total-expenses-row" className={budgetStyles.totalRow}>
      <td className={budgetStyles.totalLabel}>Total Monthly Expenses</td>
      <td>{/* This td is intentionally left empty */}</td>
      <td
        className={`${budgetStyles.totalAmount} ${budgetStyles.expenseAmount} ${tableStyles.alignRight}`}
      >
        ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
      {editMode && <td>{/* This td is intentionally left empty */}</td>}
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
        </div>
      }
      border="warning"
      className={budgetStyles.expensesSection}
    >
      <Table
        columns={columns}
        data={displayExpenses}
        renderRow={renderExpenseRow}
        extraRow={[newExpenseRow, totalRow].filter(Boolean)} // Pass both rows as array
        smallApp={smallApp}
        editMode={editMode}
        disableSortingInEditMode={true}
      />

      {editMode && (
        <div className={sectionStyles.editActions}>
          <Button onClick={handleSave} variant="primary" size="small">
            Save
          </Button>
          <Button onClick={handleResetToDemo} variant="warning" size="small">
            Reset to Demo
          </Button>
          <Button onClick={handleClearAll} variant="danger" size="small">
            Clear
          </Button>
        </div>
      )}
    </Section>
  );
};

export default ExpensesSection;
