// src/features/Dashboard/Apps/Budget/ExpensesSection.jsx
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
    // Create updated budget with new expenses
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: editRows,
    };

    // Save the entire data structure with updated budget
    // This will trigger recalculation of budget fields
    saveData({
      ...data,
      budget: updatedBudget,
    });

    exitEditMode();
  };

  // Handle reset to demo expenses
  const handleResetToDemo = () => {
    if (editMode) {
      // If in edit mode, reset edit rows to demo data
      const demoExpenses = DEFAULT_DEMO_BUDGET.monthlyExpenses || [];
      const updatedBudget = {
        ...data.budget,
        monthlyExpenses: demoExpenses,
      };
      saveData({
        ...data,
        budget: updatedBudget,
      });
      exitEditMode();
    } else {
      // If not in edit mode, use the context method
      resetBudgetToDemo();
    }
  };

  // Handle clear all expenses
  const handleClearAll = () => {
    if (editMode) {
      // If in edit mode, clear edit rows
      const updatedBudget = {
        ...data.budget,
        monthlyExpenses: [],
      };
      saveData({
        ...data,
        budget: updatedBudget,
      });
      exitEditMode();
    } else {
      // If not in edit mode, use the context method
      clearExpenses();
    }
  };

  const handleNewExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense((prev) => ({
      ...prev,
      [name]: name === "cost" ? parseFloat(value) || "" : value,
    }));
  };

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.cost) {
      const expense = {
        id: Date.now(),
        ...newExpense,
        cost: parseFloat(newExpense.cost),
      };

      if (editMode) {
        addEditRow(expense);
      } else {
        addExpense(expense);
      }

      setNewExpense({ name: "", cost: "", category: "required" });
      newExpenseNameRef.current?.focus();
    }
  };

  const filteredExpenses = editMode ? editRows : expenses;
  const displayExpenses =
    categoryFilter === "all"
      ? filteredExpenses
      : filteredExpenses.filter((exp) => exp.category === categoryFilter);

  const renderExpenseRow = (expense, index) => {
    if (!editMode) {
      // View mode - plain text
      return (
        <tr key={expense.id}>
          <td>{expense.name}</td>
          <td>${expense.cost}</td>
          <td>{expense.category}</td>
          <td></td>
        </tr>
      );
    }

    // Edit mode - inputs
    return (
      <tr key={expense.id}>
        <td>
          <input
            type="text"
            value={expense.name}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="number"
            value={expense.cost}
            onChange={(e) =>
              updateEditRow(index, "cost", parseFloat(e.target.value) || 0)
            }
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <select
            value={expense.category}
            onChange={(e) => updateEditRow(index, "category", e.target.value)}
            className={tableStyles.tableSelect}
          >
            <option value="required">Required</option>
            <option value="flexible">Flexible</option>
            <option value="non-essential">Non-essential</option>
          </select>
        </td>
        <td>
          <button
            onClick={() => removeEditRow(index)}
            className={tableStyles.removeButton}
            title="Remove"
          >
            ✕
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
          {/* Filter controls in the same row */}
          <div className={sectionStyles.filterRow}>
            <label className={sectionStyles.filterLabel}>
              Category:
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={sectionStyles.filterSelect}
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
      {/* Table */}
      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "cost", label: "Cost" },
          { key: "category", label: "Category" },
          { key: "actions", label: editMode ? "Actions" : "" },
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
      />

      {/* Control Panel - only show in edit mode */}
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
