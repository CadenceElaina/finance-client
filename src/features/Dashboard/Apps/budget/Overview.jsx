// src/features/Dashboard/Apps/Budget/BudgetOverviewContent.jsx (Renamed and Modified)
import React from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import ExpensesSection from './ExpensesSection'; // Path changed to relative within Budget folder
import BudgetControlPanel from './BudgetControlPanel'; // Path changed
import styles from './budget.module.css'; // Path changed

// This component will now contain the original main budget display logic
const Overview = () => {
    const { budget, isLoading, error, userSignedIn } = useBudget();

    if (isLoading) {
        return <div className={styles.budgetContentWrapper}>Loading budget overview...</div>;
    }

    if (error) {
        return <div className={`${styles.budgetContentWrapper} ${styles.error}`}>{error}</div>;
    }

    if (!budget) {
        return <div className={styles.budgetContentWrapper}>No budget data available.</div>;
    }

    return (
        <div className={styles.budgetContentWrapper}>
            <div className={styles.summarySection}>
                <h3>Overall Summary</h3>
                <p><strong>Total Monthly Income (After Taxes):</strong> ${budget.averageIncomeAfterTaxMonthly?.toFixed(2) || '0.00'}</p>
                <p><strong>Total Monthly Expenses:</strong> ${budget.totalMonthlyExpenses?.toFixed(2) || '0.00'}</p>
                <p><strong>Average Discretionary Income (Monthly):</strong> <span className={budget.averageDiscretionaryIncomeMonthly < 0 ? styles.negative : ''}>${budget.averageDiscretionaryIncomeMonthly?.toFixed(2) || '0.00'}</span></p>
                <p><strong>Estimated Discretionary Income (Annually):</strong> <span className={budget.discretionaryIncomeAnnually < 0 ? styles.negative : ''}>${budget.discretionaryIncomeAnnually?.toFixed(2) || '0.00'}</span></p>
            </div>

            <ExpensesSection expenses={budget.monthlyExpenses} />
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default Overview;