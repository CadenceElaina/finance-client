// src/features/Dashboard/Apps/Budget/BudgetControlPanel.jsx
import React from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import styles from './budget.module.css';

const BudgetControlPanel = ({ userSignedIn }) => {
    const { saveBudget, resetBudget, clearBudget, persistencePreference, setBudgetPersistencePreference, isLoading } = useBudget();

    return (
        <div className={styles.controlPanel}>
            <button onClick={saveBudget} disabled={isLoading} className={styles.controlButton}>
                {isLoading ? 'Saving...' : 'Save Budget'}
            </button>
            <button onClick={resetBudget} disabled={isLoading} className={styles.controlButton}>
                Reset to Demo
            </button>
            <button onClick={clearBudget} disabled={isLoading} className={`${styles.controlButton} ${styles.dangerButton}`}>
                Clear All
            </button>

            {userSignedIn && (
                <div className={styles.persistenceOption}>
                    <label htmlFor="persistence-pref" className={styles.persistenceLabel}>Data Storage:</label>
                    <select
                        id="persistence-pref"
                        value={persistencePreference}
                        onChange={(e) => setBudgetPersistencePreference(e.target.value)}
                        className={styles.select}
                        disabled={isLoading}
                    >
                        <option value="server">Server (Cloud)</option>
                        <option value="local">Local Storage</option>
                        <option value="none">Don't Save</option>
                    </select>
                </div>
            )}
        </div>
    );
};

export default BudgetControlPanel;