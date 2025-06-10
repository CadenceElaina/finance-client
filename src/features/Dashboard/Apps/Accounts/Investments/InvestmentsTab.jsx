// src/features/Dashboard/Apps/Accounts/Investments/InvestmentsTab.jsx
import React from 'react';
import HoldingsTab from './HoldingsTab';
import AllocationTab from './AllocationTab';
import PerformanceTab from './PerformanceTab';

// This component is now responsible for rendering the content of a single 'inner tab'.
// The 'smallApp' prop is no longer needed here, as the parent (InvestmentsWrapper)
// handles whether to render one or multiple of these based on app size.
const InvestmentsTab = ({ tab }) => {
    if (tab === 'holdings') {
        return <HoldingsTab />;
    }
    if (tab === 'allocation') {
        return <AllocationTab />;
    }
    if (tab === 'performance') {
        return <PerformanceTab />;
    }
    if (tab === 'reports') {
        // As per the user's previous logic, 'reports' combines allocation and performance.
        // This is a reasonable interpretation of an 'inner tab' that is itself a combination.
        return (
            <>
                <AllocationTab />
                <PerformanceTab />
            </>
        );
    }
    // Default to holdings if tab is not recognized (or null/undefined)
    return <HoldingsTab />;
};

export default InvestmentsTab;