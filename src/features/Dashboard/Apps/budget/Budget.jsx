// src/features/Dashboard/Apps/Budget.jsx (New Main Budget App Component)
import React from 'react';
import Tabs from '../../Tabs'
import Overview from './Overview';
import IncomeSection from './IncomeSection';
import styles from './budget.module.css'; // Use budget.module.css for overall styles

const Budget = () => {
    const budgetTabs = [
        { id: 'overview', label: 'Budget Overview', component: Overview },
        { id: 'income', label: 'Income Details', component: IncomeSection },
        // Add more tabs here if needed in the future
        // { id: 'savings', label: 'Savings Goals', component: SavingsGoalsSection },
    ];

    return (
        <div className={styles.budgetAppContainer}> {/* Use a new class for the overall app container */}
            <Tabs
                tabs={budgetTabs}
                initialTabId="overview" // Set the default tab to show
                className={styles.budgetTabs} // Optional: add custom class for tabs wrapper
                contentClassName={styles.budgetTabContent} // Optional: add custom class for tab content area
            />
        </div>
    );
};

export default Budget;