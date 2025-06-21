// src/features/Dashboard/Apps/Budget/ExpensesTab.jsx
import React, { useState, useRef } from "react";
import { useToast } from "../../../../hooks/useToast";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../hooks/useEditableTable";
import Table from "../../../../components/ui/Table/Table";
import tableStyles from "../../../../components/ui/Table/Table.module.css";
import Section from "../../../../components/ui/Section/Section";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import EditableTableHeader from "../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../components/ui/ControlPanel/ControlPanel";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";

const ExpensesTab = ({ expenses, smallApp }) => {
  const {
    addExpense,
    updateExpense,
    removeExpense,
    saveData,
    data,
    clearExpenses,
    resetBudgetToDemo,
  } = useFinancialData();

  const { showSuccess, showWarning, showInfo } = useToast(); // Use specific toast methods

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

  // Handle saving from control panel
  const handleSave = () => {
    // Find changed debt payment expenses
    const originalDebtPayments = expenses.filter((exp) => exp.isDebtPayment);
    const editedDebtPayments = editRows.filter((exp) => exp.isDebtPayment);

    let updatedAccounts = [...data.accounts];
    let accountChanges = [];

    // Track changes to debt payment expenses
    editedDebtPayments.forEach((editedExp) => {
      const origExp = originalDebtPayments.find((o) => o.id === editedExp.id);
      if (
        !origExp ||
        origExp.cost !== editedExp.cost ||
        origExp.category !== editedExp.category
      ) {
        // Update the linked account's monthlyPayment
        updatedAccounts = updatedAccounts.map((acc) => {
          if (acc.id === editedExp.linkedToAccountId) {
            const oldPayment = acc.monthlyPayment || 0;
            const newPayment = editedExp.cost;

            if (oldPayment !== newPayment) {
              accountChanges.push({
                name: acc.name,
                oldAmount: oldPayment,
                newAmount: newPayment,
                type:
                  newPayment === 0
                    ? "removed"
                    : oldPayment === 0
                    ? "added"
                    : "updated",
              });
            }

            return {
              ...acc,
              monthlyPayment: newPayment,
            };
          }
          return acc;
        });
      }
    });

    // Check for removed debt payment expenses
    const removedDebtPayments = originalDebtPayments.filter(
      (origExp) =>
        !editedDebtPayments.find((editedExp) => editedExp.id === origExp.id)
    );

    removedDebtPayments.forEach((removedExp) => {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === removedExp.linkedToAccountId) {
          const oldPayment = acc.monthlyPayment || 0;

          if (oldPayment > 0) {
            accountChanges.push({
              name: acc.name,
              oldAmount: oldPayment,
              newAmount: 0,
              type: "removed",
            });
          }

          return {
            ...acc,
            monthlyPayment: 0,
          };
        }
        return acc;
      });
    });

    // Save updated budget and accounts
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: editRows,
    };
    const updatedData = {
      ...data,
      budget: updatedBudget,
      accounts: updatedAccounts,
    };
    saveData(updatedData);
    exitEditMode();

    // Show a single notification for account changes
    if (accountChanges.length > 0) {
      let message;
      if (accountChanges.length === 1) {
        const change = accountChanges[0];
        if (change.type === "added") {
          message = `Account updated: ${change.name} monthly payment added ($${change.newAmount})`;
        } else if (change.type === "removed") {
          message = `Account updated: ${change.name} monthly payment removed (was $${change.oldAmount})`;
        } else {
          message = `Account updated: ${change.name} monthly payment ($${change.oldAmount} → $${change.newAmount})`;
        }
      } else {
        message =
          "Accounts updated:\n" +
          accountChanges
            .map((change, i) => {
              if (change.type === "added") {
                return `${i + 1}. ${change.name} monthly payment added ($${
                  change.newAmount
                })`;
              } else if (change.type === "removed") {
                return `${i + 1}. ${
                  change.name
                } monthly payment removed (was $${change.oldAmount})`;
              } else {
                return `${i + 1}. ${change.name} monthly payment ($${
                  change.oldAmount
                } → $${change.newAmount})`;
              }
            })
            .join("\n");
      }
      showInfo(message, { autoClose: 6000 });
    } else {
      showSuccess("Expenses saved successfully!");
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
      showInfo("Expenses reset to demo data");
    }
  };

  // Handle clear all expenses
  const handleClearAll = () => {
    if (window.confirm("Clear all expenses? This action cannot be undone.")) {
      clearExpenses();
      exitEditMode();
      showWarning("All expenses cleared");
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
    const expenseIndex = editRows.findIndex((exp) => exp.id === expenseId);
    if (expenseIndex !== -1) {
      removeEditRow(expenseIndex);
    }
  };

  const filteredExpenses = editMode ? editRows : expenses;
  const displayExpenses =
    categoryFilter === "all"
      ? filteredExpenses
      : filteredExpenses.filter((exp) => exp.category === categoryFilter);

  // FIX: Update renderExpenseRow to pass expense ID instead of index
  const renderExpenseRow = (expense, index) => {
    // Helper for category class
    const getCategoryClassName = (category) =>
      category === "non-essential" ? "nonessential" : category || "required";

    if (!editMode) {
      return (
        <tr key={expense.id || index}>
          <td>
            {expense.name.replace(" Payment", "")}
            {expense.isDebtPayment && (
              <span className={tableStyles.syncedIndicator}>(Synced)</span>
            )}
          </td>
          <td className={tableStyles.alignRight}>
            ${(expense.cost || 0).toLocaleString()}
          </td>
          <td>
            <span
              className={`${tableStyles.categoryBadge} ${
                tableStyles[getCategoryClassName(expense.category)]
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

    // Edit mode: DO NOT disable debt payment fields
    return (
      <tr key={expense.id || index}>
        <td>
          <input
            type="text"
            value={expense.name.replace(" Payment", "") || ""}
            onChange={(e) =>
              updateEditRow(
                index,
                "name",
                e.target.value + (expense.isDebtPayment ? " Payment" : "")
              )
            }
            className={tableStyles.tableInput}
            placeholder="Expense name"
          />
        </td>
        <td>
          <input
            type="number"
            value={expense.cost || ""}
            onChange={(e) =>
              updateEditRow(index, "cost", parseFloat(e.target.value) || 0)
            }
            className={tableStyles.tableInput}
            placeholder="0"
            step="0.01"
            min="0"
          />
        </td>
        <td>
          <select
            value={expense.category || "required"}
            onChange={(e) => updateEditRow(index, "category", e.target.value)}
            className={`${tableStyles.tableSelect} ${
              tableStyles[getCategoryClassName(expense.category)]
            }`}
          >
            <option value="required">Required</option>
            <option value="flexible">Flexible</option>
            <option value="non-essential">Non-essential</option>
          </select>
        </td>
        <td>
          <button
            onClick={() => handleRemoveExpense(expense.id)}
            className={tableStyles.removeButton}
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
