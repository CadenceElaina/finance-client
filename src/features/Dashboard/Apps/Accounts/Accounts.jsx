import React, { useRef, useState, useEffect } from 'react';
import FlexibleTabs from '../../../../components/ui/Tabs/FlexibleTabs';
import OverviewTab from './OverviewTab';
import AssetsTab from './AssetsTab';
import LiabilitiesTab from './LiabilitiesTab';
import PortfoliosWrapper from './PortfoliosWrapper'; 
import accountsStyles from './Accounts.module.css';
import { getAppSize } from '../../../../utils/getAppSize';
import { useFinancialData } from '../../../../contexts/FinancialDataContext';

const Accounts = () => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 955, height: 442 });
    const { data, updateAccount, addAccount, removeAccount } = useFinancialData();
    const accounts = data.accounts; // Assuming 'data' contains 'accounts'

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

    const appSize = getAppSize(containerSize);
    const smallApp = appSize === 'small';
    const largeApp = appSize === 'large';

    const [activeTabId, setActiveTabId] = useState('overview');

    const tabs = [
        {
            id: 'overview',
            label: 'Overview',
            component: ({ smallApp: flexTabsSmallApp }) => <OverviewTab smallApp={flexTabsSmallApp} />
        },
        { id: 'assets', label: 'Assets', component: () => <AssetsTab /> },
        { id: 'liabilities', label: 'Liabilities', component: () => <LiabilitiesTab /> },
        {
            id: 'portfolios',
            label: 'Portfolios',
            innerTabs: [
                { id: 'showAll', label: 'All', component: () => null },
                { id: 'holdings', label: 'Holdings', component: () => null },
                { id: 'allocation', label: 'Allocation', component: () => null },
                { id: 'performance', label: 'Performance', component: () => null },
            ],
            component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
                <PortfoliosWrapper
                    smallApp={flexTabsSmallApp}
                    activeInnerTabId={activeInnerTabId}
                />
            )
        }
    ];

    return (
        <div
            ref={containerRef}
            className={`
                ${accountsStyles.accountsAppContainer}
                ${smallApp ? 'smallApp' : ''}
                ${largeApp ? 'largeApp' : ''}
            `}
        >
            <FlexibleTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabChange={setActiveTabId}
                smallApp={smallApp}
                largeApp={largeApp}
                className={`
                    ${accountsStyles.accountsTabs}
                    ${smallApp ? 'smallApp' : ''}
                    ${largeApp ? 'largeApp' : ''}
                `}
                contentClassName={accountsStyles.accountsTabContent}
                alwaysShowInnerTabsAsRow={true}
            />
        </div>
    );
};

export default Accounts;