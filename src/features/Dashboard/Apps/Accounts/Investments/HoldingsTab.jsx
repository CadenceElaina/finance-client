import React, { useMemo } from 'react';
import Table from '../../../../../components/ui/Table/Table';
import Section from '../../../../../components/ui/Section/Section';
import SectionHeader from '../../../../../components/ui/Section/SectionHeader';
import tableStyles from '../../../../../components/ui/Table/Table.module.css';
import accountsStyles from '../Accounts.module.css';
import { useFinancialData } from '../../../../../contexts/FinancialDataContext';

const HoldingsTab = ({
    portfolioId,
    smallApp,
    portfolios = [],
    setSelectedPortfolioId,
    selectedPortfolioId
}) => {
    const { data } = useFinancialData();
    const allAccounts = data.accounts || [];

    const holdings = useMemo(() => {
        let relevantAccounts = [];
        if (portfolioId === 'all') {
            relevantAccounts = allAccounts.filter(acc => acc.category === 'Investments' && acc.hasSecurities);
        } else {
            relevantAccounts = allAccounts.filter(acc => acc.category === 'Investments' && acc.hasSecurities && acc.portfolioId === portfolioId);
        }

        let rows = [];
        relevantAccounts.forEach(acc => {
            if (Array.isArray(acc.securities)) {
                acc.securities.forEach(sec => {
                    rows.push({
                        id: `${acc.id}-${sec.ticker || sec.name}`,
                        accountName: acc.name,
                        accountProvider: acc.accountProvider,
                        portfolioName: data.portfolios?.find(p => p.id === acc.portfolioId)?.name || 'N/A',
                        ...sec
                    });
                });
            }
        });
        return rows;
    }, [allAccounts, portfolioId, data.portfolios]);

    const baseColumns = [
        { key: 'accountName', label: 'Account' },
        { key: 'accountProvider', label: 'Broker' },
        { key: 'name', label: 'Security Name' },
        { key: 'ticker', label: 'Ticker' },
        { key: 'quantity', label: 'Qty', render: v => v?.toLocaleString() },
        { key: 'value', label: 'Value', render: v => `$${v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { key: 'purchasePrice', label: 'Avg. Cost', render: v => v ? `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-' },
        { key: 'datePurchased', label: 'Last Purchased', render: v => v ? new Date(v).toLocaleDateString() : '-' }
    ];

    const columns = useMemo(() => {
        let cols = [...baseColumns];
        if (portfolioId === 'all') {
            cols.splice(1, 0, { key: 'portfolioName', label: 'Portfolio' });
        }
        return cols;
    }, [portfolioId]);

    // Portfolio select menu for table header
    const portfolioSelectMenu = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <label htmlFor="portfolio-select" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                View Portfolio:
            </label>
            <select
                id="portfolio-select"
                value={selectedPortfolioId}
                onChange={e => setSelectedPortfolioId(e.target.value)}
                className={accountsStyles.portfolioSelectMenu}
            >
                <option value="all">All Portfolios</option>
                {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
        </div>
    );

    return (
        <Section
            header={
                <SectionHeader
                    title="Investment Holdings"
                    right={portfolioSelectMenu}
                />
            }
            className={tableStyles.tableSection}
        >
            <div className={tableStyles.tableContainer}>
                <Table
                    columns={columns}
                    data={holdings}
                    className={tableStyles.compactTable}
                    smallApp={smallApp}
                />
            </div>
        </Section>
    );
};

export default HoldingsTab;