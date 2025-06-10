// src/features/Dashboard/Apps/Accounts/Investments/InvestmentsWrapper.jsx
import React from 'react';
import HoldingsTab from './Investments/HoldingsTab';
import AllocationTab from './/Investments/AllocationTab';
import PerformanceTab from './Investments/PerformanceTab';
import InvestmentsTab from './Investments/InvestmentsTab'; // This component handles the inner tabs logic
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import styles from './accounts.module.css';

const InvestmentsWrapper = ({ smallApp, activeInnerTabId }) => {

    if (smallApp) {
        // In small app mode, render only the specific InvestmentsTab based on activeInnerTabId.
        // The InvestmentsTab component itself will then render the correct sub-component (HoldingsTab, etc.).
        return <InvestmentsTab tab={activeInnerTabId} />;
    } else {
        // In large app mode, render HoldingsTab (the table) and a combined section for charts (Allocation + Performance) side-by-side.
        const ChartsAndReportsSection = (
            <div className={styles.chartsAndReportsColumn}> {/* Use a specific style for this column */}
                <AllocationTab />
                <PerformanceTab />
            </div>
        );

        return (
            <TwoColumnLayout
                left={<HoldingsTab />} // The table
                right={ChartsAndReportsSection} // The combined charts
                smallApp={false} // This prop is for TwoColumnLayout's internal responsiveness, if any.
            />
        );
    }
};

export default InvestmentsWrapper;