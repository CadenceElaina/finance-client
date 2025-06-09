import React from 'react';
import HoldingsTab from './HoldingsTab';
import AllocationTab from './AllocationTab';
import PerformanceTab from './PerformanceTab';

const InvestmentsTab = ({ tab = 'all', smallApp = false }) => {
    // If smallApp, only show one tab at a time
    if (smallApp) {
        if (tab === 'holdings') return <HoldingsTab />;
        if (tab === 'allocation') return <AllocationTab />;
        if (tab === 'performance') return <PerformanceTab />;
        if (tab === 'reports') {
            return (
                <>
                    <AllocationTab />
                    <PerformanceTab />
                </>
            );
        }
        return <HoldingsTab />;
    }

    // Large app: show Holdings table and Reports (charts) side by side
    return (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', width: '100%' }}>
            <div style={{ flex: 2, minWidth: 0 }}>
                <HoldingsTab />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <AllocationTab />
                <PerformanceTab />
            </div>
        </div>
    );
};

export default InvestmentsTab;