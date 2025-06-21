// src/features/Dashboard/Apps/Budget/ExpensesSection.jsx
import React, { useState, useRef, useMemo } from "react";
import Section from "../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import { useToast } from "../../../../hooks/useToast";
import budgetStyles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../components/ui/Table/Table.module.css";

const EMPTY_EXPENSE = {
  name: "",
  cost: "",
  category: "required",
};

const ExpensesSection = ({ budget, smallApp }) => {
  const { saveData, data, clearExpenses, resetBudgetToDemo } =
    useFinancialData();
  const { showSuccess, showWarning, showInfo } = useToast();

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
      (sum, expense) => sum + (parseFloat(expense.cost) || 0),
      0
    );
  }, [editMode, editRows, expenses]);

  // Handle saving from control panel
  const handleSave = () => {
    // Find changed debt payment expenses
    const originalDebtPayments = expenses.filter((exp) => exp.isDebtPayment);
    const editedDebtPayments = editRows.filter((exp) => exp.isDebtPayment);

    const debtPaymentChanges = [];

    editedDebtPayments.forEach((editedExpense) => {
      const originalExpense = originalDebtPayments.find(
        (orig) => orig.id === editedExpense.id
      );
      if (
        originalExpense &&
        parseFloat(editedExpense.cost) !== parseFloat(originalExpense.cost)
      ) {
        debtPaymentChanges.push({
          expenseId: editedExpense.id,
          oldAmount: originalExpense.cost,
          newAmount: parseFloat(editedExpense.cost),
          expenseName: editedExpense.name,
        });
      }
    });

    // Update all expenses in context
    const updatedData = { ...data };
    updatedData.budget = { ...updatedData.budget };
    updatedData.budget.monthlyExpenses = editRows.map((expense) => ({
      ...expense,
      cost: parseFloat(expense.cost) || 0,
    }));

    // Handle debt payment account updates
    if (debtPaymentChanges.length > 0) {
      updatedData.accounts = updatedData.accounts.map((account) => {
        const change = debtPaymentChanges.find(
          (change) => change.expenseId === `exp-debt-${account.id}`
        );
        if (change) {
          return { ...account, monthlyPayment: change.newAmount };
        }
        return account;
      });
    }

    // Handle removed debt payments by setting monthlyPayment to 0
    const removedDebtIds = originalDebtPayments
      .filter((orig) => !editRows.find((edit) => edit.id === orig.id))
      .map((expense) => expense.linkedToAccountId);

    if (removedDebtIds.length > 0) {
      updatedData.accounts = updatedData.accounts.map((account) => {
        if (removedDebtIds.includes(account.id)) {
          return { ...account, monthlyPayment: 0 };
        }
        return account;
      });
    }

    // Save updated data
    saveData(updatedData);
    exitEditMode();

    // Show notifications for debt payment changes
    if (debtPaymentChanges.length > 0) {
      showDebtSyncNotification(debtPaymentChanges);
    }

    if (removedDebtIds.length > 0) {
      showInfo(
        `Removed ${removedDebtIds.length} debt payment(s). The corresponding account monthly payments have been set to $0.`
      );
    }

    showSuccess("Expenses saved successfully!");
  };

  // Helper function to show debt sync notification using toast
  const showDebtSyncNotification = (changes) => {
    const changeText = changes
      .map(
        (change) =>
          `• ${change.expenseName}: $${change.oldAmount} → $${change.newAmount}`
      )
      .join("\n");

    showInfo(
      `Debt Payment Changes:\n${changeText}\n\nCorresponding account monthly payments have been updated.`,
      {
        autoClose: 8000,
      }
    );
  };

  // Handle reset to demo expenses
  const handleResetToDemo = () => {
    resetBudgetToDemo();
    exitEditMode();
    showSuccess("Expenses reset to demo data!");
  };

  // Handle clear all expenses
  const handleClearAll = () => {
    clearExpenses();
    exitEditMode();
    showWarning("All expenses cleared!");
  };

  const handleNewExpenseChange = (e) => {
    const { name, value, type } = e.target;
    setNewExpense((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : value) : value,
    }));
  };

  const handleAddExpense = () => {
    if (!newExpense.name.trim()) {
      newExpenseNameRef.current?.focus();
      return;
    }

    const expenseToAdd = {
      id: `exp-${Date.now()}`,
      name: newExpense.name.trim(),
      cost: parseFloat(newExpense.cost) || 0,
      category: newExpense.category,
    };

    addEditRow(expenseToAdd);
    setNewExpense({ ...EMPTY_EXPENSE });
    newExpenseNameRef.current?.focus();
  };

  const handleRemoveExpense = (expenseId) => {
    const expenseIndex = editRows.findIndex((exp) => exp.id === expenseId);
    if (expenseIndex >= 0) {
      // Remove without confirmation modal
      removeEditRow(expenseIndex);
    }
  };

  const displayExpenses = editMode ? editRows : expenses;

  const renderExpenseRow = (expense, index) => {
    if (!editMode) {
      // View mode - accounting table styling with category in middle
      return (
        <tr key={expense.id || index} className={budgetStyles.expenseItemRow}>
          <td className={budgetStyles.expenseLabel}>
            {expense.name}
            {expense.isDebtPayment && (
              <span className={budgetStyles.syncedIndicator}>(Synced)</span>
            )}
          </td>
          <td className={budgetStyles.categoryBadge}>
            <span
              className={`${budgetStyles.categoryTag} ${
                budgetStyles[
                  expense.category === "non-essential"
                    ? "nonessential"
                    : expense.category
                ]
              }`}
            >
              {expense.category === "non-essential"
                ? "Non-essential"
                : expense.category.charAt(0).toUpperCase() +
                  expense.category.slice(1)}
            </span>
          </td>
          <td className={budgetStyles.expenseAmount}>
            ${expense.cost?.toLocaleString() || "0"}
          </td>
        </tr>
      );
    }

    // Edit mode - table inputs with category in middle (NO SPECIAL STYLING FOR DEBT PAYMENTS)
    return (
      <tr key={expense.id || index}>
        <td>
          <input
            type="text"
            value={expense.name}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
            disabled={expense.isDebtPayment}
            title={
              expense.isDebtPayment
                ? "This expense is synced with a debt account"
                : ""
            }
          />
        </td>
        <td>
          <select
            value={expense.category}
            onChange={(e) => updateEditRow(index, "category", e.target.value)}
            className={`${tableStyles.tableSelect} ${
              tableStyles[
                expense.category === "non-essential"
                  ? "nonessential"
                  : expense.category
              ]
            }`}
            disabled={expense.isDebtPayment}
            title={
              expense.isDebtPayment ? "Category is fixed for debt payments" : ""
            }
          >
            <option value="required">Required</option>
            <option value="flexible">Flexible</option>
            <option value="non-essential">Non-essential</option>
          </select>
        </td>
        <td>
          <input
            type="number"
            value={expense.cost}
            onChange={(e) => updateEditRow(index, "cost", e.target.value)}
            className={tableStyles.tableInput}
            step="0.01"
            min="0"
          />
        </td>
        <td>
          <button
            onClick={() => handleRemoveExpense(expense.id)}
            className={tableStyles.removeButton}
            title="Remove expense"
          >
            ×
          </button>
        </td>
      </tr>
    );
  };

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
      className={`${budgetStyles.expensesSection} ${budgetStyles.compactSection}`}
      smallApp={smallApp}
    >
      <div className={budgetStyles.accountingTable}>
        <table
          className={`${budgetStyles.accountingTableGrid} ${budgetStyles.compactTable}`}
        >
          <thead>
            <tr>
              <th className={budgetStyles.descriptionColumn}>Expense</th>
              <th className={budgetStyles.categoryColumn}>Category</th>
              <th className={budgetStyles.amountColumn}>Cost</th>
              {editMode && (
                <th className={budgetStyles.actionsColumn}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayExpenses.map((expense, idx) =>
              renderExpenseRow(expense, idx)
            )}

            {/* Add new expense row in edit mode */}
            {editMode && (
              <tr>
                <td>
                  <input
                    ref={newExpenseNameRef}
                    type="text"
                    name="name"
                    value={newExpense.name}
                    onChange={handleNewExpenseChange}
                    placeholder="Expense name"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <select
                    name="category"
                    value={newExpense.category}
                    onChange={handleNewExpenseChange}
                    className={`${tableStyles.tableSelect} ${
                      tableStyles[
                        newExpense.category === "non-essential"
                          ? "nonessential"
                          : newExpense.category
                      ]
                    }`}
                  >
                    <option value="required">Required</option>
                    <option value="flexible">Flexible</option>
                    <option value="non-essential">Non-essential</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    name="cost"
                    value={newExpense.cost}
                    onChange={handleNewExpenseChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>
                  <button
                    onClick={handleAddExpense}
                    className={tableStyles.addButton}
                    title="Add"
                  >
                    +
                  </button>
                </td>
              </tr>
            )}

            {/* Accounting-style separator and total */}
            <tr className={budgetStyles.separatorRow}>
              <td colSpan={editMode ? 4 : 3}></td>
            </tr>
            <tr className={budgetStyles.totalRow}>
              <td className={budgetStyles.totalLabel}>
                <strong>Total Monthly Expenses</strong>
              </td>
              <td></td>
              <td className={budgetStyles.totalAmount}>
                <strong>${totalExpenses.toLocaleString()}</strong>
              </td>
              {editMode && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {editMode && (
        <ControlPanel
          onSave={handleSave}
          saveLabel="Save Expenses"
          onReset={handleResetToDemo}
          onClear={handleClearAll}
          resetLabel="Reset to Demo"
        />
      )}
    </Section>
  );
};

export default ExpensesSection;
