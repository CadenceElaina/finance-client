// src/features/Dashboard/Apps/Budget/Budget.jsx
import React, { useRef, useState, useEffect } from 'react';
import BudgetOverviewWrapper from './BudgetOverviewWrapper';
import IncomeSection from './IncomeSection';
import FlexibleTabs from '../../../../components/ui/Tabs/FlexibleTabs';
import styles from './budget.module.css';
import { isSmallApp } from "../../../../utils/isSmallApp";

const Budget = () => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 955, height: 442 }); // initial unnecessary>?

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
            component: () => <IncomeSection />
        }
    ];

    return (
        <div ref={containerRef} className={styles.budgetAppContainer}>
            <FlexibleTabs
                tabs={tabs}
                activeTabId={activeMainTabId}
                onTabChange={setActiveMainTabId}
                smallApp={smallApp}
                className={styles.tabsRow}
                contentClassName={styles.budgetTabContent}
            />
        </div>
    );
};

export default Budget;