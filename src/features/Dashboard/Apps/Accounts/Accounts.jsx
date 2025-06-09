// Accounts.jsx
import React, { useRef, useState, useEffect } from 'react';
import FlexibleTabs from '../../../../components/ui/Tabs/FlexibleTabs';
import OverviewTab from './OverviewTab';
import AssetsTab from './AssetsTab';
import LiabilitiesTab from './LiabilitiesTab';
import InvestmentsTab from './Investments/InvestmentsTab';
import DropdownTabs from '../../../../components/ui/Tabs/DropdownTabs';
import styles from './accounts.module.css';

// Helper: detect small app mode (like Budget)
const isSmallApp = (size) => {
    if (!size) return false;
    return size.width < 1112 || size.height < 351;
};

const Accounts = () => {
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

    // State for active inner tab (for investments)
    const [activeInvestmentsTab, setActiveInvestmentsTab] = useState('holdings');
    const [activeTabId, setActiveTabId] = useState('overview'); // This state now correctly controls FlexibleTabs

    const investmentsInnerTabs = [
        { id: 'holdings', label: 'Holdings', component: () => <InvestmentsTab tab="holdings" smallApp={smallApp} /> },
        { id: 'allocation', label: 'Allocation', component: () => <InvestmentsTab tab="allocation" smallApp={smallApp} /> },
        { id: 'performance', label: 'Performance', component: () => <InvestmentsTab tab="performance" smallApp={smallApp} /> },
        { id: 'reports', label: 'Reports', component: () => <InvestmentsTab tab="reports" smallApp={smallApp} /> }
    ];

    const tabs = [
        { id: 'overview', label: 'Overview', component: () => <OverviewTab /> },
        { id: 'assets', label: 'Assets', component: () => <AssetsTab /> },
        { id: 'liabilities', label: 'Liabilities', component: () => <LiabilitiesTab /> },
        {
            id: 'investments',
            label: 'Investments', // This label is for FlexibleTabs internal use if not customHeader, but also conceptually
            customHeader: ({ isActive, setActive }) => (
                <DropdownTabs
                    tabs={investmentsInnerTabs}
                    activeTabId={activeInvestmentsTab}
                    onTabChange={tabId => {
                        setActiveInvestmentsTab(tabId);
                        setActive(); // Call the `setActive` prop from FlexibleTabs to set main tab active
                    }}
                    label="Investments"
                    isActive={isActive} // This now correctly reflects the active state from Accounts
                // No inline prop for classic dropdown
                />
            ),
            component: () =>
                // Render the component of the currently active *inner* investments tab
                investmentsInnerTabs.find(t => t.id === activeInvestmentsTab)?.component()
        }
    ];

    return (
        <div ref={containerRef} className={styles.accountsAppContainer}>
            <FlexibleTabs
                tabs={tabs}
                // initialTabId is no longer needed here if FlexibleTabs is controlled
                activeTabId={activeTabId} // Pass the controlled state
                onTabChange={setActiveTabId} // Pass the setter function
                smallApp={smallApp}
                className={styles.accountsTabs}
                contentClassName={styles.accountsTabContent}
            />
        </div>
    );
};

export default Accounts;