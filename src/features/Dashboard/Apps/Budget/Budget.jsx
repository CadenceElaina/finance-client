// src/features/Dashboard/Apps/Budget.jsx (New Main Budget App Component)
import React from 'react';
import FlexibleTabs from '../../../../components/ui/Tabs/FlexibleTabs';
import Overview from './Overview';
import ExpensesSection from './ExpensesSection';
import IncomeSection from './IncomeSection';
import styles from './budget.module.css';
import { isSmallApp } from '../../../../utils/isSmallApp';

const Budget = () => {
    // Example: detect small app mode (you may want to use context or props)
    const [smallApp, setSmallApp] = React.useState(false);
    // ...logic to set smallApp based on container size...

    const budgetTabs = [
        {
            id: 'overview',
            label: 'Budget Overview',
            // If smallApp, split into inner tabs
            component: !smallApp
                ? () => <Overview />
                : undefined,
            innerTabs: smallApp
                ? [
                    { id: 'summary', label: 'Summary', component: () => <Overview summaryOnly /> },
                    { id: 'expenses', label: 'Expenses', component: () => <ExpensesSection /> }
                ]
                : undefined
        },
        {
            id: 'income',
            label: 'Income Details',
            component: () => <IncomeSection />
        }
    ];

    return (
        <div className={styles.budgetAppContainer}>
            <div className={styles.tabsRow}>
                <FlexibleTabs
                    tabs={budgetTabs}
                    initialTabId="overview"
                    smallApp={smallApp}
                    className={styles.budgetTabs}
                    contentClassName={styles.budgetTabContent}
                />
            </div>
        </div>
    );
};

export default Budget;