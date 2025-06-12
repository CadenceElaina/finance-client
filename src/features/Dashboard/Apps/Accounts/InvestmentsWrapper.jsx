// src/features/Dashboard/Apps/Accounts/Investments/InvestmentsWrapper.jsx
import React from 'react';
import HoldingsTab from './Investments/HoldingsTab';
import AllocationTab from './Investments/AllocationTab';
import PerformanceTab from './Investments/PerformanceTab';
import InvestmentsTab from './Investments/InvestmentsTab';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import accountsStyles from './accounts.module.css'; 

const InvestmentsWrapper = ({ smallApp, activeInnerTabId }) => {

    if (smallApp) {
        if (!activeInnerTabId || activeInnerTabId === 'showAll') {
            return (
                <>
                    {/* Removed smallApp prop from InvestmentsTab components */}
                    <InvestmentsTab tab="holdings" />
                    <InvestmentsTab tab="allocation" />
                    <InvestmentsTab tab="performance" />
                    <InvestmentsTab tab="reports" />
                </>
            );
        }
        switch (activeInnerTabId) {
            // Removed smallApp prop from InvestmentsTab components
            case 'holdings': return <InvestmentsTab tab="holdings" />;
            case 'allocation': return <InvestmentsTab tab="allocation" />;
            case 'performance': return <InvestmentsTab tab="performance" />;
            case 'reports': return <InvestmentsTab tab="reports" />;
            default: return null;
        }

    } else {
        const ChartsAndReportsSection = (
            <div className={accountsStyles.chartsAndReportsColumn}>
                <AllocationTab />
                <PerformanceTab />
            </div>
        );

        return (
            <TwoColumnLayout
                left={<HoldingsTab />}
                right={ChartsAndReportsSection}
                smallApp={false} // This prop is for TwoColumnLayout's internal responsiveness, if any.
            />
        );
    }
};

export default InvestmentsWrapper;