// src/features/Dashboard/Apps/Budget.jsx (New Main Budget App Component)
import React from 'react';
import Tabs from '../../Tabs'
import Overview from './Overview';
import IncomeSection from './IncomeSection';
import styles from './budget.module.css';

const Budget = () => {
    const budgetTabs = [
        { id: 'overview', label: 'Budget Overview', component: Overview },
        { id: 'income', label: 'Income Details', component: IncomeSection },
    ];

    return (
        <div className={styles.budgetAppContainer}>
            <div className={styles.tabsRow}>
                <Tabs
                    tabs={budgetTabs}
                    initialTabId="overview"
                    className={styles.budgetTabs}
                    contentClassName={styles.budgetTabContent}
                />
            </div>
        </div>
    );
};

export default Budget;