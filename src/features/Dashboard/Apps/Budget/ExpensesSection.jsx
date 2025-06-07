import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import styles from './budget.module.css';

const ExpensesSection = ({ expenses }) => {
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

    return (
        <div className={styles.expensesSectionCustom}>
            <h3>Monthly Expenses</h3>
            <div className={styles.expenseTableContainer}>
                <table className={styles.expenseTable}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Cost</th>
                            <th>Category</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp.id}>
                                <td data-label="Name"> {/* Added data-label */}
                                    <input
                                        type="text"
                                        value={exp.name}
                                        onChange={(e) => handleUpdateExpense(exp.id, 'name', e.target.value)}
                                        className={styles.tableInput}
                                    />
                                </td>
                                <td data-label="Cost"> {/* Added data-label */}
                                    <input
                                        type="number"
                                        value={exp.cost}
                                        onChange={(e) => handleUpdateExpense(exp.id, 'cost', e.target.value)}
                                        className={styles.tableInput}
                                    />
                                </td>
                                <td data-label="Category"> {/* Added data-label */}
                                    <select
                                        value={exp.category}
                                        onChange={(e) => handleUpdateExpense(exp.id, 'category', e.target.value)}
                                        className={styles.tableSelect}
                                    >
                                        {expenseCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                        ))}
                                    </select>
                                </td>
                                <td data-label="Action"> {/* Added data-label */}
                                    <button onClick={() => removeExpense(exp.id)} className={styles.removeButton}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {/* New expense row */}
                        <tr>
                            <td data-label="New Name"> {/* Added data-label */}
                                <input
                                    type="text"
                                    name="name"
                                    value={newExpense.name}
                                    onChange={handleNewExpenseChange}
                                    placeholder="New Expense Name"
                                    className={styles.tableInput}
                                />
                            </td>
                            <td data-label="New Cost"> {/* Added data-label */}
                                <input
                                    type="number"
                                    name="cost"
                                    value={newExpense.cost}
                                    onChange={handleNewExpenseChange}
                                    placeholder="Cost"
                                    className={styles.tableInput}
                                />
                            </td>
                            <td data-label="New Category"> {/* Added data-label */}
                                <select
                                    name="category"
                                    value={newExpense.category}
                                    onChange={handleNewExpenseChange}
                                    className={styles.tableSelect}
                                >
                                    {expenseCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>
                            </td>
                            <td data-label="Add Action"> {/* Added data-label */}
                                <button onClick={handleAddExpense} className={styles.addButton}>
                                    Add
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpensesSection;