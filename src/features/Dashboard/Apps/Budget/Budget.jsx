import React, { useRef, useState, useEffect } from 'react';
import BudgetOverviewWrapper from './BudgetOverviewWrapper';
import IncomeTab from './IncomeTab';
import FlexibleTabs from '../../../../components/ui/Tabs/FlexibleTabs';
import budgetStyles from './budget.module.css'; // Renamed to budgetStyles for consistency
import { isSmallApp } from "../../../../utils/isSmallApp";
import { useFinancialData } from '../../../../contexts/FinancialDataContext';

const Budget = () => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 955, height: 442 });
    const { data, updateIncome, addExpense, updateExpense, removeExpense } = useFinancialData();
    const budget = data.budget;

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };
        updateSize();

        let resizeObserver = null;
        if (containerRef.current && window.ResizeObserver) {
            resizeObserver = new window.ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === containerRef.current) {
                        const { width, height } = entry.contentRect;
                        setContainerSize({ width, height });
                    }
                }
            });
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('resize', updateSize);

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    const smallApp = isSmallApp(containerSize);
    const [activeMainTabId, setActiveMainTabId] = useState('budget');

    const tabs = [
        {
            id: 'budget',
            label: 'Budget Overview',
            innerTabs: [
                { id: 'showAll', label: 'All', component: () => null }, // Added 'showAll' inner tab
                { id: 'summary', label: 'Summary', component: () => null },
                { id: 'expenses', label: 'Expenses', component: () => null }
            ],
            component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
                <BudgetOverviewWrapper
                    smallApp={flexTabsSmallApp}
                    activeInnerTabId={activeInnerTabId}
                />
            )
        },
        {
            id: 'income',
            label: 'Income',
            component: () => <IncomeTab />
        }
    ];

    return (
        <div ref={containerRef} className={budgetStyles.budgetAppContainer}> {/* FIX: Changed from styles to budgetStyles */}
            <FlexibleTabs
                tabs={tabs}
                activeTabId={activeMainTabId}
                onTabChange={setActiveMainTabId}
                smallApp={smallApp}
                className={budgetStyles.tabsRow}
                contentClassName={budgetStyles.budgetTabContent}
            />
        </div>
    );
};

export default Budget;