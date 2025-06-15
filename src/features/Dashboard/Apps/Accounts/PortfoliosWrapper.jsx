import React, { useState } from 'react';
import HoldingsTab from './Investments/HoldingsTab';
import AllocationTab from './Investments/AllocationTab';
import PerformanceTab from './Investments/PerformanceTab';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import sectionStyles from '../../../../components/ui/Section/Section.module.css';
import { useFinancialData } from '../../../../contexts/FinancialDataContext';
import { DEMO_PORTFOLIOS } from '../../../../utils/constants';
import accountsStyles from './Accounts.module.css';

const PortfoliosWrapper = ({ smallApp, activeInnerTabId }) => {
    const { data } = useFinancialData();
    const allAccounts = data.accounts || [];
    // Only show portfolios that have at least one security
    const portfolios = (data.portfolios && data.portfolios.length > 0
        ? data.portfolios
        : DEMO_PORTFOLIOS
    ).filter(p => {
        // Find accounts for this portfolio
        const portfolioAccounts = allAccounts.filter(acc => acc.portfolioId === p.id && acc.category === 'Investments');
        // Only include if at least one account has securities and securities.length > 0
        return portfolioAccounts.some(acc => Array.isArray(acc.securities) && acc.securities.length > 0);
    });

    const [selectedPortfolioId, setSelectedPortfolioId] = useState('all');

    // Find the selected portfolio name for AllocationTab title
    const selectedPortfolioName = selectedPortfolioId === 'all'
        ? 'All Portfolios'
        : (portfolios.find(p => p.id === selectedPortfolioId)?.name || '');

    // Common props for tabs
    const tabProps = {
        smallApp,
        portfolioId: selectedPortfolioId,
        portfolioName: selectedPortfolioName,
        portfolios, // Pass the filtered portfolios list
        setSelectedPortfolioId, // Pass setter
        selectedPortfolioId // Pass current value
    };

    return (
        <div style={{ position: 'relative', paddingTop: '0', height: '100%' }}>
            {/* portfolioSelect removed from here */}
            {(!activeInnerTabId || activeInnerTabId === 'showAll') && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <div style={{ flex: 1 }}>
                            <AllocationTab {...tabProps} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <PerformanceTab {...tabProps} />
                        </div>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <HoldingsTab {...tabProps} />
                    </div>
                </div>
            )}
            {activeInnerTabId === 'holdings' && <HoldingsTab {...tabProps} />}
            {activeInnerTabId === 'allocation' && <AllocationTab {...tabProps} fullHeight={true} />}
            {activeInnerTabId === 'performance' && <PerformanceTab {...tabProps} fullHeight={true} />}
        </div>
    );
};

export default PortfoliosWrapper;
