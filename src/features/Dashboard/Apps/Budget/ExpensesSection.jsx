// src/features/Dashboard/Apps/Budget/ExpensesSection.jsx
import { Plus } from "lucide-react"; // Remove Trash2 import
import React, { useMemo, useRef, useState } from "react";
import Section from "../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import Table from "../../../../components/ui/Table/Table";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../components/ui/Table/Table.module.css";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useToast } from "../../../../hooks/useToast";
import {
  syncDebtPaymentsToExpenses,
  detectDebtPaymentChanges,
} from "../../../../utils/debtPaymentSync";
import BudgetFormInput from "../../../../components/ui/Form/BudgetFormInput";
import BudgetFormSelect from "../../../../components/ui/Form/BudgetFormSelect";

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
    removeEditRow, // FIXED: Now properly imported
  } = useEditableTable(expenses);

  const [newExpense, setNewExpense] = useState({ ...EMPTY_EXPENSE });
  const newExpenseNameRef = useRef(null);

  // Calculate total expenses dynamically based on current edit state
  const totalExpenses = useMemo(() => {
    const expensesToSum = editMode ? editRows : expenses;
    return expensesToSum.reduce(
      (sum, expense) => sum + (parseFloat(expense.cost) || 0),
      0
    );
  }, [editMode, editRows, expenses]);

  // Sort expenses by cost descending ONLY in view mode, preserve order in edit mode
  const displayExpenses = useMemo(() => {
    if (editMode) return editRows;
    return [...expenses].sort(
      (a, b) => (parseFloat(b.cost) || 0) - (parseFloat(a.cost) || 0)
    );
  }, [editMode, expenses, editRows]);

  // FIXED: Enhanced save handler with detailed goal notifications
  const handleSave = () => {
    const originalExpenses = expenses;
    const updatedExpenses = editRows;

    // Detect changes in debt payments and goal allocations
    const debtChanges = [];
    const goalChanges = [];
    const accountUpdates = [...(data.accounts || [])];
    const goalUpdates = [...(data.goals || [])];

    updatedExpenses.forEach((updatedExpense) => {
      const originalExpense = originalExpenses.find(
        (orig) => orig.id === updatedExpense.id
      );

      if (!originalExpense) return; // Skip new expenses

      // Handle debt payment changes
      if (updatedExpense.isDebtPayment && updatedExpense.linkedToAccountId) {
        const newAmount = parseFloat(updatedExpense.cost) || 0;
        const oldAmount = parseFloat(originalExpense.cost) || 0;

        if (newAmount !== oldAmount) {
          // Update the linked account's monthly payment
          const accountIndex = accountUpdates.findIndex(
            (acc) => acc.id === updatedExpense.linkedToAccountId
          );
          if (accountIndex !== -1) {
            accountUpdates[accountIndex] = {
              ...accountUpdates[accountIndex],
              monthlyPayment: newAmount,
            };

            debtChanges.push({
              accountName: updatedExpense.name.replace(" Payment", ""),
              oldAmount,
              newAmount,
            });
          }
        }
      }

      // FIXED: Enhanced goal allocation change handling
      if (updatedExpense.isGoalPayment && updatedExpense.linkedToGoalId) {
        const newAmount = parseFloat(updatedExpense.cost) || 0;
        const oldAmount = parseFloat(originalExpense.cost) || 0;

        if (newAmount !== oldAmount) {
          // Update the linked goal's budget allocation
          const goalIndex = goalUpdates.findIndex(
            (goal) => goal.id === updatedExpense.linkedToGoalId
          );
          if (goalIndex !== -1) {
            const oldGoal = goalUpdates[goalIndex];
            goalUpdates[goalIndex] = {
              ...oldGoal,
              budgetMonthlyAmount: newAmount,
              monthlyContribution: oldGoal.linkedToBudget
                ? newAmount
                : oldGoal.monthlyContribution,
            };

            goalChanges.push({
              goalName: updatedExpense.name.replace(" (Goal)", ""),
              oldAmount,
              newAmount,
              changeType: "budget_allocation",
            });
          }
        }
      }
    });

    // Check for removed synced expenses
    originalExpenses.forEach((originalExpense) => {
      const stillExists = updatedExpenses.find(
        (updated) => updated.id === originalExpense.id
      );

      if (!stillExists) {
        // Handle removed debt payment
        if (
          originalExpense.isDebtPayment &&
          originalExpense.linkedToAccountId
        ) {
          const accountIndex = accountUpdates.findIndex(
            (acc) => acc.id === originalExpense.linkedToAccountId
          );
          if (accountIndex !== -1) {
            accountUpdates[accountIndex] = {
              ...accountUpdates[accountIndex],
              monthlyPayment: 0,
            };

            debtChanges.push({
              accountName: originalExpense.name.replace(" Payment", ""),
              oldAmount: parseFloat(originalExpense.cost) || 0,
              newAmount: 0,
            });
          }
        }

        // FIXED: Handle removed goal allocation
        if (originalExpense.isGoalPayment && originalExpense.linkedToGoalId) {
          const goalIndex = goalUpdates.findIndex(
            (goal) => goal.id === originalExpense.linkedToGoalId
          );
          if (goalIndex !== -1) {
            goalUpdates[goalIndex] = {
              ...goalUpdates[goalIndex],
              budgetMonthlyAmount: 0,
              monthlyContribution: 0,
              linkedToBudget: false,
            };

            goalChanges.push({
              goalName: originalExpense.name.replace(" (Goal)", ""),
              oldAmount: parseFloat(originalExpense.cost) || 0,
              newAmount: 0,
              changeType: "budget_removed",
            });
          }
        }
      }
    });

    // Save all updates
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        monthlyExpenses: updatedExpenses,
      },
      accounts: accountUpdates,
      goals: goalUpdates,
    };

    saveData(updatedData);
    exitEditMode();
    showSuccess("Expenses saved successfully!");

    // FIXED: Enhanced notifications with better formatting
    if (debtChanges.length > 0) {
      const debtSummary = debtChanges
        .map(
          (change) =>
            `• ${change.accountName}: $${change.oldAmount} → $${change.newAmount}`
        )
        .join("\n");
      showInfo(
        `💳 Debt Payment Changes:\n${debtSummary}\n\nAccount monthly payments have been synchronized.`
      );
    }

    if (goalChanges.length > 0) {
      const goalSummary = goalChanges
        .map((change) => {
          if (change.changeType === "budget_removed") {
            return `• ${change.goalName}: Budget allocation removed`;
          }
          return `• ${change.goalName}: $${change.oldAmount} → $${change.newAmount}/month`;
        })
        .join("\n");

      showInfo(
        `🎯 Goal Allocation Changes:\n${goalSummary}\n\nGoal monthly contributions have been synchronized.`
      );
    }
  };

  // Handle reset to demo expenses
  const handleResetToDemo = () => {
    const currentExpenses = expenses || [];

    // Find synced expenses that will be affected
    const syncedDebtPayments = currentExpenses.filter(
      (exp) => exp.isDebtPayment
    );
    const syncedGoalAllocations = currentExpenses.filter(
      (exp) => exp.isGoalPayment
    );

    // Build warning message
    let warningMessage = "Reset to demo expenses? This will:\n\n";
    warningMessage += "• Replace all current expenses with demo data\n";

    if (syncedDebtPayments.length > 0) {
      warningMessage += `• Remove ${syncedDebtPayments.length} synced debt payment(s):\n`;
      syncedDebtPayments.forEach((exp) => {
        warningMessage += `  - ${exp.name} ($${exp.cost})\n`;
      });
      warningMessage += "• Set monthly payments to $0 for these accounts\n";
    }

    if (syncedGoalAllocations.length > 0) {
      warningMessage += `• Remove ${syncedGoalAllocations.length} synced goal allocation(s):\n`;
      syncedGoalAllocations.forEach((exp) => {
        warningMessage += `  - ${exp.name} ($${exp.cost})\n`;
      });
      warningMessage += "• Remove budget links for these goals\n";
    }

    if (syncedDebtPayments.length > 0 || syncedGoalAllocations.length > 0) {
      warningMessage +=
        "\n⚠️ You will need to re-sync accounts and goals manually.\n\n";
    }

    warningMessage += "Continue with reset?";

    if (window.confirm(warningMessage)) {
      // FIXED: Define demo expenses directly instead of importing
      const demoExpenses = [
        {
          id: "exp-1",
          name: "Rent/Mortgage",
          cost: 1200,
          category: "required",
        },
        { id: "exp-2", name: "Groceries", cost: 400, category: "flexible" },
        { id: "exp-3", name: "Utilities", cost: 150, category: "required" },
        { id: "exp-4", name: "Internet", cost: 70, category: "required" },
        {
          id: "exp-5",
          name: "Transportation",
          cost: 100,
          category: "flexible",
        },
        {
          id: "exp-6",
          name: "Dining Out",
          cost: 200,
          category: "non-essential",
        },
        {
          id: "exp-7",
          name: "Entertainment",
          cost: 100,
          category: "non-essential",
        },
        { id: "exp-8", name: "Phone", cost: 80, category: "required" },
        { id: "exp-9", name: "Insurance", cost: 250, category: "required" },
        {
          id: "exp-10",
          name: "Gym Membership",
          cost: 50,
          category: "non-essential",
        },
      ];

      // Track what we're about to change for notifications
      const accountUpdates = [...(data.accounts || [])];
      const goalUpdates = [...(data.goals || [])];
      const affectedAccounts = [];
      const affectedGoals = [];

      // Update linked accounts (set monthly payments to 0)
      syncedDebtPayments.forEach((expense) => {
        if (expense.linkedToAccountId) {
          const accountIndex = accountUpdates.findIndex(
            (acc) => acc.id === expense.linkedToAccountId
          );
          if (accountIndex !== -1) {
            affectedAccounts.push({
              name: accountUpdates[accountIndex].name,
              oldPayment: accountUpdates[accountIndex].monthlyPayment || 0,
              newPayment: 0,
            });
            accountUpdates[accountIndex] = {
              ...accountUpdates[accountIndex],
              monthlyPayment: 0,
            };
          }
        }
      });

      // Update linked goals (remove budget allocation)
      syncedGoalAllocations.forEach((expense) => {
        if (expense.linkedToGoalId) {
          const goalIndex = goalUpdates.findIndex(
            (goal) => goal.id === expense.linkedToGoalId
          );
          if (goalIndex !== -1) {
            affectedGoals.push({
              name: goalUpdates[goalIndex].name,
              oldAllocation: goalUpdates[goalIndex].budgetMonthlyAmount || 0,
              newAllocation: 0,
            });
            goalUpdates[goalIndex] = {
              ...goalUpdates[goalIndex],
              budgetMonthlyAmount: 0,
              monthlyContribution: 0,
              linkedToBudget: false,
            };
          }
        }
      });

      // Save all updates
      const updatedData = {
        ...data,
        budget: {
          ...data.budget,
          monthlyExpenses: demoExpenses,
        },
        accounts: accountUpdates,
        goals: goalUpdates,
      };

      saveData(updatedData);
      exitEditMode();
      showSuccess("Budget reset to demo data!");

      // Show detailed sync notifications
      if (affectedAccounts.length > 0) {
        const accountSummary = affectedAccounts
          .map(
            (acc) => `• ${acc.name}: $${acc.oldPayment} → $${acc.newPayment}`
          )
          .join("\n");
        showWarning(
          `💳 Account Monthly Payments Reset:\n${accountSummary}\n\nYou can update these in the Accounts app.`
        );
      }

      if (affectedGoals.length > 0) {
        const goalSummary = affectedGoals
          .map((goal) => `• ${goal.name}: Budget link removed`)
          .join("\n");
        showWarning(
          `🎯 Goal Budget Links Removed:\n${goalSummary}\n\nYou can re-link these in the Goals app.`
        );
      }

      // Show info about demo expenses
      showInfo(
        `📊 Demo Budget Loaded:\n• ${demoExpenses.length} demo expenses added\n• Includes sample required, flexible, and non-essential expenses\n• Customize these expenses to match your needs`
      );
    }
  };

  // FIXED: Enhanced clear all with same sync handling
  const handleClearAll = () => {
    const currentExpenses = expenses || [];

    // Find synced expenses that will be affected
    const syncedDebtPayments = currentExpenses.filter(
      (exp) => exp.isDebtPayment
    );
    const syncedGoalAllocations = currentExpenses.filter(
      (exp) => exp.isGoalPayment
    );

    // Build warning message
    let warningMessage = "Clear all expenses? This will:\n\n";
    warningMessage += "• Remove ALL current expenses\n";

    if (syncedDebtPayments.length > 0) {
      warningMessage += `• Remove ${syncedDebtPayments.length} synced debt payment(s)\n`;
      warningMessage += "• Set monthly payments to $0 for linked accounts\n";
    }

    if (syncedGoalAllocations.length > 0) {
      warningMessage += `• Remove ${syncedGoalAllocations.length} synced goal allocation(s)\n`;
      warningMessage += "• Remove budget links for linked goals\n";
    }

    if (syncedDebtPayments.length > 0 || syncedGoalAllocations.length > 0) {
      warningMessage +=
        "\n⚠️ You will need to re-sync accounts and goals manually.\n\n";
    }

    warningMessage += "Continue with clearing all expenses?";

    if (window.confirm(warningMessage)) {
      // Track what we're about to change for notifications
      const accountUpdates = [...(data.accounts || [])];
      const goalUpdates = [...(data.goals || [])];
      const affectedAccounts = [];
      const affectedGoals = [];

      // Update linked accounts (set monthly payments to 0)
      syncedDebtPayments.forEach((expense) => {
        if (expense.linkedToAccountId) {
          const accountIndex = accountUpdates.findIndex(
            (acc) => acc.id === expense.linkedToAccountId
          );
          if (accountIndex !== -1) {
            affectedAccounts.push({
              name: accountUpdates[accountIndex].name,
              oldPayment: accountUpdates[accountIndex].monthlyPayment || 0,
            });
            accountUpdates[accountIndex] = {
              ...accountUpdates[accountIndex],
              monthlyPayment: 0,
            };
          }
        }
      });

      // Update linked goals (remove budget allocation)
      syncedGoalAllocations.forEach((expense) => {
        if (expense.linkedToGoalId) {
          const goalIndex = goalUpdates.findIndex(
            (goal) => goal.id === expense.linkedToGoalId
          );
          if (goalIndex !== -1) {
            affectedGoals.push({
              name: goalUpdates[goalIndex].name,
              oldAllocation: goalUpdates[goalIndex].budgetMonthlyAmount || 0,
            });
            goalUpdates[goalIndex] = {
              ...goalUpdates[goalIndex],
              budgetMonthlyAmount: 0,
              monthlyContribution: 0,
              linkedToBudget: false,
            };
          }
        }
      });

      // Save all updates
      const updatedData = {
        ...data,
        budget: {
          ...data.budget,
          monthlyExpenses: [],
        },
        accounts: accountUpdates,
        goals: goalUpdates,
      };

      saveData(updatedData);
      exitEditMode();
      showSuccess("All expenses cleared!");

      // Show detailed sync notifications
      if (affectedAccounts.length > 0) {
        const accountSummary = affectedAccounts
          .map((acc) => `• ${acc.name}: Monthly payment reset to $0`)
          .join("\n");
        showWarning(
          `💳 Account Monthly Payments Cleared:\n${accountSummary}\n\nYou can update these in the Accounts app.`
        );
      }

      if (affectedGoals.length > 0) {
        const goalSummary = affectedGoals
          .map((goal) => `• ${goal.name}: Budget link removed`)
          .join("\n");
        showWarning(
          `🎯 Goal Budget Links Removed:\n${goalSummary}\n\nYou can re-link these in the Goals app.`
        );
      }
    }
  };

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.cost) {
      const expenseToAdd = {
        ...newExpense,
        id: `exp-${Date.now()}`,
        cost: parseFloat(newExpense.cost) || 0,
      };
      addEditRow(expenseToAdd);
      setNewExpense({ ...EMPTY_EXPENSE });

      setTimeout(() => {
        newExpenseNameRef.current?.focus();
      }, 0);
    }
  };

  // FIXED: Enhanced remove handler that uses removeEditRow correctly
  const handleRemoveExpense = (expenseId) => {
    const expenseToRemove = editRows.find((exp) => exp.id === expenseId);

    if (expenseToRemove?.isDebtPayment) {
      if (
        !window.confirm(
          `Removing this expense will set the monthly payment for ${expenseToRemove.name.replace(
            " Payment",
            ""
          )} to $0. Continue?`
        )
      ) {
        return;
      }
    }

    if (expenseToRemove?.isGoalPayment) {
      if (
        !window.confirm(
          `Removing this expense will remove the budget allocation for ${expenseToRemove.name.replace(
            " (Goal)",
            ""
          )}. Continue?`
        )
      ) {
        return;
      }
    }

    // FIXED: Use removeEditRow with the expense ID
    removeEditRow(expenseId);
  };

  // Category badge for view mode - updated to handle goal expenses
  const CategoryBadge = ({ category, isGoalPayment, isDebtPayment }) => {
    let displayCategory = category;
    let color = CATEGORY_COLORS[category] || "#888";

    if (isGoalPayment) {
      displayCategory = "Goal";
      color = "#007BFF";
    } else if (isDebtPayment) {
      displayCategory = "Debt";
      color = "#dc3545";
    }

    return (
      <span
        className={tableStyles.categoryBadge}
        style={{
          background: `${color}20`,
          color: color,
          border: `1.5px solid ${color}`,
          padding: "var(--space-xxs) var(--space-xs)",
          borderRadius: "var(--border-radius-sm)",
          fontSize: "var(--font-size-xxs)",
          fontWeight: "var(--font-weight-medium)",
          textTransform: "capitalize",
        }}
      >
        {displayCategory === "required"
          ? "Required"
          : displayCategory === "flexible"
          ? "Flexible"
          : displayCategory === "non-essential"
          ? "Non-essential"
          : displayCategory}
      </span>
    );
  };

  // FIXED: Enhanced CategorySelect component with color classes
  const CategorySelect = ({ value, onChange, disabled = false }) => {
    const categoryOptions = [
      { value: "required", label: "Required" },
      { value: "flexible", label: "Flexible" },
      { value: "non-essential", label: "Non-essential" },
    ];

    return (
      <BudgetFormSelect
        value={value}
        onChange={onChange}
        options={categoryOptions}
        disabled={disabled}
        className={`${tableStyles.tableSelect} ${tableStyles[value] || ""}`}
      />
    );
  };

  // FIXED: Enhanced row renderer with correct remove button
  const renderExpenseRow = (expense, index) => {
    const isDebtPayment = expense.isDebtPayment;
    const isGoalPayment = expense.isGoalPayment;
    const isSynced = isDebtPayment || isGoalPayment;

    return (
      <tr key={expense.id || index}>
        <td>
          {editMode ? (
            isSynced ? (
              // Synced items: show name with sync indicator, not editable
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                }}
              >
                {expense.name}
                <span
                  style={{
                    fontSize: "var(--font-size-xxxs)",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    background: "var(--surface-dark)",
                    padding: "var(--space-xxs)",
                    borderRadius: "var(--border-radius-sm)",
                  }}
                >
                  {isDebtPayment ? "synced from account" : "synced from goal"}
                </span>
              </span>
            ) : (
              // Regular items: fully editable
              <BudgetFormInput
                column={{ type: "text", placeholder: "Expense name" }}
                value={expense.name}
                onChange={(value) => updateEditRow(index, "name", value)}
              />
            )
          ) : (
            // View mode: show name with sync indicator
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
              }}
            >
              {expense.name}
              {isSynced && (
                <span
                  style={{
                    fontSize: "var(--font-size-xxxs)",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                  }}
                >
                  {isDebtPayment ? "(auto-synced)" : "(from goal)"}
                </span>
              )}
            </span>
          )}
        </td>
        <td>
          {editMode ? (
            isSynced ? (
              // Synced items: category not editable, show badge
              <CategoryBadge
                category={expense.category}
                isGoalPayment={isGoalPayment}
                isDebtPayment={isDebtPayment}
              />
            ) : (
              // Regular items: category editable
              <CategorySelect
                value={expense.category}
                onChange={(value) => updateEditRow(index, "category", value)}
              />
            )
          ) : (
            // View mode: show category badge
            <CategoryBadge
              category={expense.category}
              isGoalPayment={isGoalPayment}
              isDebtPayment={isDebtPayment}
            />
          )}
        </td>
        <td className={tableStyles.alignRight}>
          {editMode ? (
            // All items have editable cost, including synced ones
            <BudgetFormInput
              column={{
                type: "number",
                placeholder: "0.00",
                step: "0.01",
                min: "0",
              }}
              value={expense.cost}
              onChange={(value) => updateEditRow(index, "cost", value)}
            />
          ) : (
            `$${(expense.cost || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}`
          )}
        </td>
        {editMode && (
          <td className={tableStyles.alignCenter}>
            <button
              onClick={() => handleRemoveExpense(expense.id)} // FIXED: Pass expense.id
              className={`${tableStyles.actionButton} ${tableStyles.removeButton}`}
              title={
                isSynced
                  ? `Remove ${
                      isDebtPayment ? "debt payment" : "goal allocation"
                    }`
                  : "Remove expense"
              }
            >
              <span className={tableStyles.removeIcon}>×</span>
            </button>
          </td>
        )}
      </tr>
    );
  };

  // FIXED: New expense row with standardized add button
  const newExpenseRow = editMode ? (
    <tr
      style={{
        background: "var(--surface-dark)",
        borderTop: "2px solid var(--border-light)",
      }}
    >
      <td>
        <BudgetFormInput
          ref={newExpenseNameRef}
          column={{ type: "text", placeholder: "Enter expense name" }}
          value={newExpense.name}
          onChange={(value) =>
            setNewExpense((prev) => ({ ...prev, name: value }))
          }
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
      <td className={tableStyles.alignCenter}>
        <button
          onClick={handleAddExpense}
          disabled={!newExpense.name || !newExpense.cost}
          className={`${tableStyles.actionButton} ${tableStyles.addButton}`}
          title="Add expense"
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
          fontSize: "var(--font-size-xs)",
          borderTop: "2px solid var(--color-secondary)",
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
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-secondary)",
            }}
          >
            Total: ${totalExpenses.toLocaleString()}
          </div>
        </div>
      }
      className="expensesSection"
      smallApp={smallApp}
    >
      {/* MOVED: Control panel now appears AFTER the table */}
      <Table
        columns={columns}
        data={displayExpenses}
        renderRow={renderExpenseRow}
        extraRow={
          <>
            {newExpenseRow}
            {totalRow}
          </>
        }
        smallApp={smallApp}
        editMode={editMode}
        disableSortingInEditMode={true}
      />

      {/* FIXED: Control panel moved to bottom and only shows in edit mode */}
      {editMode && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-xs)",
            marginTop: "var(--space-sm)",
            justifyContent: "flex-end",
            padding: "var(--space-xs)",
            background: "var(--surface-dark)",
            borderRadius: "var(--border-radius-sm)",
            border: "1px solid var(--border-light)",
          }}
        >
          <button onClick={handleSave} className="btn-primary">
            Save Changes
          </button>
          <button onClick={handleResetToDemo} className="btn-secondary">
            Reset to Demo
          </button>
          <button onClick={handleClearAll} className="btn-danger">
            Clear All
          </button>
        </div>
      )}

      {displayExpenses.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-md)",
            color: "var(--text-secondary)",
          }}
        >
          No expenses added yet. Click the pencil icon to add expenses.
        </div>
      )}
    </Section>
  );
};

export default ExpensesSection;
