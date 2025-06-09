// Budget.jsx
import React, { useRef, useState, useEffect } from 'react';
import Overview from './Overview';
import ExpensesSection from './ExpensesSection'; // Not used in provided snippet, but keep if needed
import IncomeSection from './IncomeSection';
import FlexibleTabs from '../../../../components/ui/Tabs/FlexibleTabs';
import DropdownTabs from '../../../../components/ui/Tabs/DropdownTabs';
import styles from './budget.module.css';
import { isSmallApp } from '../../../../utils/isSmallApp';

const Budget = () => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

    useEffect(() => {
        if (!containerRef.current) return;
        const setInitialSize = () => {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };
        setInitialSize();
        const resizeObserver = new window.ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === containerRef.current) {
                    const { width, height } = entry.contentRect;
                    setContainerSize({ width, height });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const smallApp = isSmallApp(containerSize);

    // State for main active tab in Budget app
    const [activeMainTabId, setActiveMainTabId] = useState('budget'); // New state for main tabs

    // Inner tabs for Budget Overview (small app only)
    const [activeBudgetInnerTab, setActiveBudgetInnerTab] = useState('summary');

    // Budget Overview tab content logic (simplified for demonstration)
    const BudgetOverviewContent = () => {
        // You already have this logic; ensure it correctly uses activeBudgetInnerTab
        return smallApp
            ? (activeBudgetInnerTab === 'expenses' ? <Overview smallTab="expenses" /> : <Overview smallTab="summary" />)
            : (
                <div className={styles.budgetTwoColumn}>
                    <Overview smallTab="summary" />
                    <Overview smallTab="expenses" />
                </div>
            );
    };

    // Inner tabs for Budget Overview (for DropdownTabs)
    const budgetInnerTabs = [
        { id: 'summary', label: 'Overview' },
        { id: 'expenses', label: 'Expenses' }
    ];

    // Main tabs for FlexibleTabs
    const tabs = [
        {
            id: 'budget',
            label: 'Budget Overview', // Good to keep for reference if not customHeader
            customHeader: ({ isActive, setActive }) =>
                smallApp ? (
                    <DropdownTabs
                        tabs={budgetInnerTabs}
                        activeTabId={activeBudgetInnerTab} // Controls active state within dropdown
                        onTabChange={tabId => {
                            setActiveBudgetInnerTab(tabId);
                            setActive(); // Crucial: sets 'budget' as the active main tab
                        }}
                        label="Budget Overview"
                        isActive={isActive} // Passes the main tab's active state to DropdownTabs
                        inline // This makes it inline for the small app case
                    />
                ) : (
                    <button
                        className={`${styles.tabHeader} ${isActive ? styles.active : ''}`} // Use styles.active now
                        onClick={setActive} // Crucial: sets 'budget' as the active main tab
                        type="button"
                    >
                        Budget Overview
                    </button>
                ),
            component: BudgetOverviewContent // Use the component directly
        },
        {
            id: 'income',
            label: 'Income',
            component: () => <IncomeSection />
        }
    ];

    return (
        <div ref={containerRef} className={styles.budgetAppContainer}>
            <FlexibleTabs
                tabs={tabs}
                activeTabId={activeMainTabId} // Controlled state from Budget component
                onTabChange={setActiveMainTabId} // Setter function from Budget component
                smallApp={smallApp}
                className={styles.tabsRow}
                contentClassName={styles.budgetTabContent}
            />
        </div>
    );
};

export default Budget;