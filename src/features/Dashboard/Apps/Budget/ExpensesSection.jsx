// src/features/Dashboard/Apps/Budget/ExpensesSection.jsx
import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import Table from '../../../../components/ui/Table/Table';
import tableStyles from '../../../../components/ui/Table/Table.module.css';
import Section from '../../../../components/ui/Section/Section';
import SectionHeader from '../../../../components/ui/Section/SectionHeader';
import styles from './budget.module.css';

const ExpensesSection = ({
    expenses,
    smallApp,
}) => {
    const { addExpense, updateExpense, removeExpense } = useBudget();
    const [newExpense, setNewExpense] = useState({ name: '', cost: '', category: 'required' });
    const [categoryFilter, setCategoryFilter] = useState('all');

    const handleNewExpenseChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewExpense(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : (type === 'checkbox' ? checked : value)
        }));
    };

    const handleAddExpense = () => {
        if (newExpense.name.trim() && newExpense.cost !== '') {
            addExpense(newExpense);
            setNewExpense({ name: '', cost: '', category: 'required' }); // Reset form
        }
    };

    const handleUpdateExpense = (id, field, value) => {
        const updatedValue = typeof value === 'string' && field === 'cost' ? parseFloat(value) || 0 : value;
        updateExpense(id, { [field]: updatedValue });
    };

    const expenseCategories = [
        { id: 'required', label: 'Required' },
        { id: 'flexible', label: 'Flexible' },
        { id: 'non-essential', label: 'Non-essential' }
    ];

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'cost', label: 'Cost' },
        { key: 'category', label: 'Category' },
        { key: 'action', label: 'Action' }
    ];

    // Filter expenses by category
    const filteredExpenses = categoryFilter === 'all'
        ? expenses
        : expenses.filter(exp => exp.category === categoryFilter);

    const renderRow = (exp, idx) => (
        <tr key={exp.id}>
            <td>
                <input
                    type="text"
                    value={exp.name}
                    onChange={(e) => handleUpdateExpense(exp.id, 'name', e.target.value)}
                    className={tableStyles.tableInput}
                />
            </td>
            <td>
                <input
                    type="number"
                    value={exp.cost}
                    onChange={(e) => handleUpdateExpense(exp.id, 'cost', e.target.value)}
                    className={tableStyles.tableInput}
                />
            </td>
            <td>
                <select
                    value={exp.category}
                    onChange={(e) => handleUpdateExpense(exp.id, 'category', e.target.value)}
                    className={tableStyles.tableSelect}
                >
                    {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </td>
            <td>
                <button
                    className={tableStyles.removeButton}
                    onClick={() => removeExpense(exp.id)}
                >
                    Remove
                </button>
            </td>
        </tr>
    );

    // New expense row
    const renderNewExpenseRow = () => (
        <tr>
            <td>
                <input
                    type="text"
                    name="name"
                    value={newExpense.name}
                    onChange={handleNewExpenseChange}
                    placeholder="New Expense Name"
                    className={tableStyles.tableInput}
                />
            </td>
            <td>
                <input
                    type="number"
                    name="cost"
                    value={newExpense.cost}
                    onChange={handleNewExpenseChange}
                    placeholder="Cost"
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
                    {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </td>
            <td>
                <button
                    className={tableStyles.addButton} // Use tableStyles.addButton
                    onClick={handleAddExpense}
                >
                    Add
                </button>
            </td>
        </tr>
    );

    // Filter row (like Accounts)
    const filterRow = (
        <div className={tableStyles.filterRow}> {/* Use tableStyles.filterRow */}
            <label htmlFor="expenseCategoryFilter" className={tableStyles.filterLabel}> {/* Use tableStyles.filterLabel */}
                Show:
            </label>
            <select
                id="expenseCategoryFilter"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className={tableStyles.filterSelect} // Use tableStyles.filterSelect
            >
                <option value="all">All Expenses</option>
                {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
            </select>
        </div>
    );

    return (
        <Section
            className={tableStyles.tableSection} // Use tableStyles.tableSection here
            header={
                <SectionHeader
                    title="Monthly Expenses"
                    titleClassName={tableStyles.tableHeaderTitle} // Pass titleClassName to SectionHeader
                    right={filterRow}
                />
            }
        >
            <div className={tableStyles.tableContainer}>
                <Table
                    columns={columns}
                    data={filteredExpenses}
                    renderRow={renderRow}
                    className={tableStyles.compactTable}
                    smallApp={smallApp}
                    extraRow={renderNewExpenseRow}
                />
            </div>
        </Section>
    );
};

export default ExpensesSection;