// src/features/Dashboard/Apps/Budget/ExpensesTab.jsx
import React, { useState, useRef } from "react";
import Table from "../../../../components/ui/Table/Table";
import tableStyles from "../../../../components/ui/Table/Table.module.css";
import Section from "../../../../components/ui/Section/Section";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import { DEFAULT_DEMO_BUDGET } from "../../../../utils/constants";
import Notification from "../../../../components/ui/Notification/Notification";
import { useNotification } from "../../../../hooks/useNotification";

const ExpensesTab = ({ expenses, smallApp }) => {
  const {
    addExpense,
    updateExpense,
    removeExpense,
    saveData,
    data,
    clearExpenses,
    resetBudgetToDemo,
    showNotification,
  } = useFinancialData();

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

  const [newExpense, setNewExpense] = useState({
    name: "",
    cost: "",
    category: "required",
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const newExpenseNameRef = useRef(null);

  // Track removed debt payments for notification
  const [removedDebtPayments, setRemovedDebtPayments] = useState([]);

  // Handle saving from control panel
  const handleSave = () => {
    // Detect debt payment changes for notification
    const debtPaymentChanges = [];

    // Check for removed debt payment expenses
    const originalDebtPayments = expenses.filter((exp) => exp.isDebtPayment);
    const editedDebtPayments = editRows.filter((exp) => exp.isDebtPayment);

    originalDebtPayments.forEach((originalExp) => {
      const stillExists = editedDebtPayments.find(
        (editedExp) => editedExp.id === originalExp.id
      );
      if (!stillExists) {
        debtPaymentChanges.push({
          type: "removed",
          accountName: originalExp.name.replace(" Payment", ""),
          amount: originalExp.cost,
          expenseId: originalExp.id,
        });
      }
    });

    // Check for updated debt payment amounts
    editedDebtPayments.forEach((editedExp) => {
      const originalExp = originalDebtPayments.find(
        (orig) => orig.id === editedExp.id
      );
      if (originalExp && originalExp.cost !== editedExp.cost) {
        debtPaymentChanges.push({
          type: "updated",
          accountName: editedExp.name.replace(" Payment", ""),
          oldAmount: originalExp.cost,
          newAmount: editedExp.cost,
          expenseId: editedExp.id,
        });
      }
    });

    // Create updated budget with new expenses
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: editRows,
    };

    // Save the data
    const updatedData = {
      ...data,
      budget: updatedBudget,
    };

    saveData(updatedData);
    exitEditMode();

    // Show notification if there were debt payment changes
    if (debtPaymentChanges.length > 0) {
      let message = "Budget updated with debt payment changes:\n\n";

      debtPaymentChanges.forEach((change) => {
        switch (change.type) {
          case "updated":
            message += `• Updated: ${change.accountName} payment ($${change.oldAmount} → $${change.newAmount}/month)\n`;
            break;
          case "removed":
            message += `• Removed: ${change.accountName} payment ($${change.amount}/month)\n`;
            break;
        }
      });

      message += "\nCorresponding account monthly payments have been updated.";

      showNotification({
        type: "info",
        title: "Accounts Updated",
        message,
        duration: 6000,
      });
    } else {
      // Standard save notification
      showNotification({
        type: "success",
        title: "Expenses Saved",
        message: "Your expense changes have been saved successfully.",
        duration: 3000,
      });
    }
  };

  // Handle reset to demo expenses
  const handleResetToDemo = () => {
    if (
      window.confirm(
        "Reset all expenses to demo data? This will clear your current expenses."
      )
    ) {
      resetBudgetToDemo();
      exitEditMode();
    }
  };

  // Handle clear all expenses
  const handleClearAll = () => {
    if (window.confirm("Clear all expenses? This action cannot be undone.")) {
      clearExpenses();
      exitEditMode();
    }
  };

  const handleNewExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense((prev) => ({
      ...prev,
      [name]:
        name === "cost" ? (value === "" ? "" : parseFloat(value) || 0) : value,
    }));
  };

  const handleAddExpense = () => {
    if (!newExpense.name.trim()) {
      alert("Please enter an expense name");
      return;
    }

    const expenseWithId = {
      ...newExpense,
      id: `exp-${Date.now()}`,
      cost: parseFloat(newExpense.cost) || 0,
    };

    addEditRow(expenseWithId);
    setNewExpense({ name: "", cost: "", category: "required" });

    if (newExpenseNameRef.current) {
      newExpenseNameRef.current.focus();
    }
  };

  // FIX: Update expense removal to use expense ID instead of index
  const handleRemoveExpense = (expenseId) => {
    // Find the expense in editRows by ID
    const expenseIndex = editRows.findIndex((exp) => exp.id === expenseId);
    if (expenseIndex === -1) return;

    const expense = editRows[expenseIndex];

    // If it's a debt payment, just remove it - notification will be handled on save
    if (expense.isDebtPayment) {
      // Track for notification later
      setRemovedDebtPayments((prev) => [
        ...prev,
        {
          name: expense.name,
          cost: expense.cost,
          linkedAccountId: expense.linkedToAccountId,
        },
      ]);
    }

    // Remove from edit rows
    removeEditRow(expenseIndex);
  };

  const filteredExpenses = editMode ? editRows : expenses;
  const displayExpenses =
    categoryFilter === "all"
      ? filteredExpenses
      : filteredExpenses.filter((exp) => exp.category === categoryFilter);

  // FIX: Update renderExpenseRow to pass expense ID instead of index
  const renderExpenseRow = (expense, index) => {
    if (!editMode) {
      // View mode
      return (
        <tr key={expense.id || index}>
          <td>
            {expense.name}
            {expense.isDebtPayment && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "var(--font-size-xxs)",
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                }}
              >
                (Auto-synced)
              </span>
            )}
          </td>
          <td className={tableStyles.alignRight}>
            ${(expense.cost || 0).toLocaleString()}
          </td>
          <td>
            <span
              className={`${tableStyles.categoryTag} ${
                tableStyles[expense.category] || ""
              }`}
            >
              {expense.category === "non-essential"
                ? "Non-essential"
                : expense.category.charAt(0).toUpperCase() +
                  expense.category.slice(1)}
            </span>
          </td>
        </tr>
      );
    }

    // Edit mode
    const isDebtPayment = expense.isDebtPayment;

    return (
      <tr key={expense.id || index}>
        <td>
          <input
            type="text"
            value={expense.name || ""}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
            placeholder="Expense name"
            disabled={isDebtPayment}
            style={isDebtPayment ? { opacity: 0.6 } : {}}
          />
        </td>
        <td>
          <input
            type="number"
            value={expense.cost || ""}
            onChange={(e) => {
              if (isDebtPayment) {
                // For debt payments, don't allow direct editing - they're synced from accounts
                return;
              }
              updateEditRow(index, "cost", parseFloat(e.target.value) || 0);
            }}
            className={tableStyles.tableInput}
            placeholder="0"
            step="0.01"
            min="0"
            disabled={isDebtPayment}
            style={isDebtPayment ? { opacity: 0.6 } : {}}
            title={
              isDebtPayment
                ? "This amount is synced from your debt account. Edit the monthly payment in the Accounts app to change this value."
                : ""
            }
          />
        </td>
        <td>
          <select
            value={expense.category || "required"}
            onChange={(e) => updateEditRow(index, "category", e.target.value)}
            className={`${tableStyles.tableSelect} ${
              tableStyles[expense.category] || ""
            }`}
            disabled={isDebtPayment}
            style={isDebtPayment ? { opacity: 0.6 } : {}}
          >
            <option value="required">Required</option>
            <option value="flexible">Flexible</option>
            <option value="non-essential">Non-essential</option>
          </select>
        </td>
        <td>
          <button
            onClick={() => handleRemoveExpense(expense.id)} // Pass expense ID instead of index
            className={tableStyles.removeButton}
            title={
              isDebtPayment
                ? "Remove debt payment (will also update account)"
                : "Remove expense"
            }
          >
            Remove
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
          <div className={tableStyles.filterRow}>
            <label className={tableStyles.filterLabel}>
              Category:
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={tableStyles.filterSelect}
              >
                <option value="all">All Categories</option>
                <option value="required">Required</option>
                <option value="flexible">Flexible</option>
                <option value="non-essential">Non-essential</option>
              </select>
            </label>
          </div>
        </div>
      }
    >
      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "cost", label: "Cost" },
          { key: "category", label: "Category" },
          ...(editMode ? [{ key: "actions", label: "Actions" }] : []),
        ]}
        data={displayExpenses}
        renderRow={renderExpenseRow}
        extraRow={
          editMode ? (
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
                <select
                  name="category"
                  value={newExpense.category}
                  onChange={handleNewExpenseChange}
                  className={tableStyles.tableSelect}
                >
                  <option value="required">Required</option>
                  <option value="flexible">Flexible</option>
                  <option value="non-essential">Non-essential</option>
                </select>
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
          ) : null
        }
        smallApp={smallApp}
        editMode={editMode} // Pass editMode to disable sorting
      />

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

export default ExpensesTab;
