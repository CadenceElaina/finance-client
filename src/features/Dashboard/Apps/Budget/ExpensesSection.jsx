import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import styles from './budget.module.css';
import Button from '../../../../components/ui/Button/Button';
import Table from '../../../../components/ui/Table/Table';
import tableStyles from '../../../../components/ui/Table/Table.module.css';
import Section from '../../../../components/ui/Section/Section';
import SectionHeader from '../../../../components/ui/Section/SectionHeader';

const ExpensesSection = ({
    expenses,
    smallApp,
    activeInternalTab,
    setActiveInternalTab
}) => {
    const { addExpense, updateExpense, removeExpense } = useBudget();
    const [newExpense, setNewExpense] = useState({ name: '', cost: '', category: 'required' });

    const handleNewExpenseChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewExpense(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : (type === 'checkbox' ? checked : value)
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

    const expenseCategories = ["required", "flexible", "non-essential"];

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'cost', label: 'Cost' },
        { key: 'category', label: 'Category' },
        { key: 'action', label: 'Action' }
    ];

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
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                </select>
            </td>
            <td>
                <Button
                    variant="danger"
                    onClick={() => removeExpense(exp.id)}
                >
                    Remove
                </Button>
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
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                </select>
            </td>
            <td>
                <Button
                    variant="primary"
                    onClick={handleAddExpense}
                >
                    Add
                </Button>
            </td>
        </tr>
    );

    // --- Header Row (matches Overview) ---
    const renderTabButtons = () => (
        <div className={styles.smallAppTabButtons}>
            <Button
                tab
                active={activeInternalTab === 'summary'}
                onClick={() => setActiveInternalTab('summary')}
            >
                Overview
            </Button>
            <Button
                tab
                active={activeInternalTab === 'expenses'}
                onClick={() => setActiveInternalTab('expenses')}
            >
                Expenses
            </Button>
        </div>
    );

    return (
        <Table
            columns={columns}
            data={expenses}
            renderRow={renderRow}
            className={styles.expenseTable}
            smallApp={smallApp}
            extraRow={renderNewExpenseRow}
        />
    );
};

export default ExpensesSection;