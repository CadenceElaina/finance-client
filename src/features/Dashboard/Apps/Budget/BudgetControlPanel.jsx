// src/features/Dashboard/Apps/Budget/BudgetControlPanel.jsx asd
import React from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import Button from '../../../../components/ui/Button/Button';
import styles from './budget.module.css';

const BudgetControlPanel = ({ userSignedIn }) => {
    const { saveBudget, resetBudget, clearBudget, persistencePreference, setBudgetPersistencePreference, isLoading } = useBudget();
    return (
        <div className={styles.controlPanel}>
            <Button onClick={saveBudget} disabled={isLoading} variant="primary">
                {isLoading ? 'Saving...' : 'Save Budget'}
            </Button>
            <Button onClick={resetBudget} disabled={isLoading} variant="warning">
                Reset to Demo
            </Button>
            <Button onClick={clearBudget} disabled={isLoading} variant="danger">
                Clear All
            </Button>

            {userSignedIn && (
                <div className={styles.persistenceOption}>
                    <label htmlFor="persistence-pref" className={styles.persistenceLabel}>Data Storage:</label>
                    <select
                        id="persistence-pref"
                        value={persistencePreference}
                        onChange={(e) => setBudgetPersistencePreference(e.target.value)}
                        // className={styles.select} REMOVED: now handled by general select styles
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