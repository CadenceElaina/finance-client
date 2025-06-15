import React from 'react';
import HoldingsTab from './Investments/HoldingsTab';
import AllocationTab from './Investments/AllocationTab';
import PerformanceTab from './Investments/PerformanceTab';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import sectionStyles from '../../../../components/ui/Section/Section.module.css';

const PortfoliosWrapper = ({ smallApp, activeInnerTabId }) => {
    if (!activeInnerTabId || activeInnerTabId === 'showAll') {
        // Row: Allocation and Performance, then Holdings table below
        return (
            <div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ flex: 1 }}>
                        <AllocationTab smallApp={smallApp} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <PerformanceTab smallApp={smallApp} />
                    </div>
                </div>
                <HoldingsTab smallApp={smallApp} />
            </div>
        );
    }
    if (activeInnerTabId === 'holdings') {
        return <HoldingsTab smallApp={smallApp} />;
    }
    if (activeInnerTabId === 'allocation') {
        return <AllocationTab smallApp={smallApp} />;
    }
    if (activeInnerTabId === 'performance') {
        return <PerformanceTab smallApp={smallApp} />;
    }
    if (activeInnerTabId === 'reports') {
        // Two columns: Allocation left, Performance right
        return (
            <TwoColumnLayout
                className={sectionStyles.columns50_50}
                left={<AllocationTab smallApp={smallApp} />}
                right={<PerformanceTab smallApp={smallApp} />}
                smallApp={smallApp}
            />
        );
    }
    return null;
};

export default PortfoliosWrapper;
