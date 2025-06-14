import React from 'react';
import HoldingsTab from './Investments/HoldingsTab';
import AllocationTab from './Investments/AllocationTab';
import PerformanceTab from './Investments/PerformanceTab';
import sectionStyles from '../../../../components/ui/Section/Section.module.css';

const PortfoliosWrapper = ({ smallApp, activeInnerTabId }) => {
    if (smallApp) {
        // In small app mode, render tabs based on activeInnerTabId or all if 'showAll'
        if (!activeInnerTabId || activeInnerTabId === 'showAll') {
            return (
                <>
                    <AllocationTab smallApp={smallApp} />
                    <PerformanceTab smallApp={smallApp} />
                    <HoldingsTab smallApp={smallApp} />
                </>
            );
        }
        switch (activeInnerTabId) {
            case 'holdings': return <HoldingsTab smallApp={smallApp} />;
            case 'allocation': return <AllocationTab smallApp={smallApp} />;
            case 'performance': return <PerformanceTab smallApp={smallApp} />;
            case 'reports': return (
                <>
                    <AllocationTab smallApp={smallApp} />
                    <PerformanceTab smallApp={smallApp} />
                </>
            );
            default: return null;
        }
    } else {
        // In large app mode, show charts side by side above the table
        return (
            <div className={sectionStyles.twoColumn} style={{ flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', width: '100%' }}>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                        <AllocationTab smallApp={false} />
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                        <PerformanceTab smallApp={false} />
                    </div>
                </div>
                <div style={{ width: '100%', marginTop: 'var(--space-xs)' }}>
                    <HoldingsTab smallApp={false} />
                </div>
            </div>
        );
    }
};

export default PortfoliosWrapper;
