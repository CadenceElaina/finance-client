import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Text } from 'recharts';
import Section from '../../../../components/ui/Section/Section';
import Table from '../../../../components/ui/Table/Table';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import styles from './accounts.module.css';
import { DEMO_ACCOUNTS } from '../../../../utils/constants';

// Modern theme-aware color palette for charts
const CHART_COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    '#7AA2F7', // Tokyo Night blue
    '#BB9AF7', // Tokyo Night purple
    '#00FFD1', // Accent teal
    '#FF8C69', // Accent coral
    '#FFD700', // Gold
    '#EF5350', // Red
];

// Utility: Net worth calculation
const getNetWorth = (accounts) =>
    accounts.reduce((sum, acc) => sum + (typeof acc.value === 'number' ? acc.value : 0), 0);

const OverviewTab = ({ accounts = DEMO_ACCOUNTS, smallApp }) => {
    console.log('OverviewTab rendered with smallApp:', smallApp);
    const [accountCategoryFilter, setAccountCategoryFilter] = useState('all');

    // Categorize accounts using the 'category' field
    const cashAccounts = accounts.filter(acc => acc.category === 'Cash');
    const investmentAccounts = accounts.filter(acc => acc.category === 'Investments');
    const debtAccounts = accounts.filter(acc => acc.category === 'Debt');

    // Filtered Accounts for the Table (based on the dropdown)
    const filteredAccountsForTable = useMemo(() => {
        if (accountCategoryFilter === 'all') return accounts;
        if (accountCategoryFilter === 'Cash') return cashAccounts;
        if (accountCategoryFilter === 'Investments') return investmentAccounts;
        if (accountCategoryFilter === 'Debt') return debtAccounts;
        return accounts;
    }, [accounts, accountCategoryFilter, cashAccounts, investmentAccounts, debtAccounts]);

    // Net Worth & Totals for Snapshot and Pie Charts
    const netWorth = getNetWorth(accounts);
    const totalCash = cashAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const totalInvestments = investmentAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const totalDebt = debtAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const totalAssets = totalCash + totalInvestments;

    // Data for Assets Pie Chart (aggregated by top-level categories)
    const assetsPieData = [
        { name: 'Cash', value: totalCash },
        { name: 'Investments', value: totalInvestments },
    ].filter(d => d.value > 0);

    // Data for Liabilities Pie Chart (each liability account gets a slice, using absolute values)
    const liabilitiesPieData = debtAccounts
        .map(acc => ({
            name: acc.name,
            value: Math.abs(acc.value || 0),
        }))
        .filter(d => d.value > 0);

    // Custom Label for Pie Charts
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 15; // Increased distance from pie
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const textAnchor = x > cx ? 'start' : 'end';
        const finalX = x + (x > cx ? 5 : -5); // Small offset to prevent overlap with slice edge
        const finalY = y;

        return (
            <Text
                x={finalX}
                y={finalY}
                fill="var(--text-primary)"
                textAnchor={textAnchor}
                dominantBaseline="central"
                className={styles.chartLabelText}
            >
                {`${name} (${(percent * 100).toFixed(0)}%)`}
            </Text>
        );
    };

    // --- Section header for "Your Accounts" with select menu on the right ---
    const accountsHeader = (
        <div className={styles.accountsHeaderRow}>
            <h3 className={styles.accountsHeaderTitle}>Your Accounts</h3>
            <div className={styles.filterRow}>
                <label htmlFor="accountCategoryFilter" className={styles.filterLabel}>Show:</label>
                <select
                    id="accountCategoryFilter"
                    value={accountCategoryFilter}
                    onChange={e => setAccountCategoryFilter(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">All Accounts</option>
                    <option value="Cash">Cash Accounts</option>
                    <option value="Investments">Investment Accounts</option>
                    <option value="Debt">Liability Accounts</option>
                </select>
            </div>
        </div>
    );

    // Encapsulate chart content for reusability in conditional rendering
    const ChartsColumnContent = (
        <div className={styles.chartsColumn}>
            <Section className={styles.chartSectionCompact}>
                <div className={styles.chartHeader}>Assets Breakdown</div>
                <div className={styles.chartContainerCompact}>
                    {assetsPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}> {/* Consistent height, let Recharts scale */}
                            <PieChart>
                                <Pie
                                    data={assetsPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={65} // Increased outerRadius for labels
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {assetsPieData.map((entry, idx) => (
                                        <Cell
                                            key={`cell-${idx}`}
                                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={value => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                    contentStyle={{
                                        background: 'var(--surface-light)',
                                        border: '1px solid var(--border-light)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 8,
                                        fontSize: '0.8rem'
                                    }}
                                />
                                <Legend align="center" verticalAlign="bottom" layout="horizontal" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.noChartData}>No assets to display.</div>
                    )}
                </div>
            </Section>
            <Section className={styles.chartSectionCompact}>
                <div className={styles.chartHeader}>Liabilities Breakdown</div>
                <div className={styles.chartContainerCompact}>
                    {liabilitiesPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}> {/* Consistent height, let Recharts scale */}
                            <PieChart>
                                <Pie
                                    data={liabilitiesPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={65} // Increased outerRadius for labels
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {liabilitiesPieData.map((entry, idx) => (
                                        <Cell
                                            key={`cell-liab-${idx}`}
                                            fill={CHART_COLORS[(idx + 2) % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={value => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                    contentStyle={{
                                        background: 'var(--surface-light)',
                                        border: '1px solid var(--border-light)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 8,
                                        fontSize: '0.8rem'
                                    }}
                                />
                                <Legend align="center" verticalAlign="bottom" layout="horizontal" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.noChartData}>No liabilities to display.</div>
                    )}
                </div>
            </Section>
        </div>
    );

    // Encapsulate table content for reusability in conditional rendering
    const TableColumnContent = (
        <div className={styles.tableColumn}>
            <Section header={accountsHeader} className={styles.tableSectionCompact}>
                <Table
                    className={styles.compactTable}
                    columns={[
                        { key: 'name', label: 'Account' },
                        { key: 'accountProvider', label: 'Institution' },
                        { key: 'category', label: 'Category' },
                        { key: 'subType', label: 'Type' },
                        {
                            key: 'value', label: 'Value', render: val =>
                                <span className={val >= 0 ? styles.positive : styles.negative}>
                                    ${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                        },
                        { key: 'taxStatus', label: 'Tax Status' }
                    ]}
                    data={filteredAccountsForTable}
                />
            </Section>
        </div>
    );


    return (
        <div className={styles.overviewTab}>
            {/* --- Snapshot Section (full width, above charts/table row) --- */}
            <div className={`${styles.snapshotRowFull} ${smallApp ? styles.snapshotRowFullSmall : ''}`}>
                <div className={styles.snapshotItem}>
                    <span className={styles.snapshotLabel}>Net Worth</span>
                    <span className={`${styles.positive} value`}>
                        ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className={styles.snapshotItem}>
                    <span className={styles.snapshotLabel}>Cash</span>
                    <span className={`${styles.positive} value`}>
                        ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className={styles.snapshotItem}>
                    <span className={styles.snapshotLabel}>Assets</span>
                    <span className={`${styles.positive} value`}>
                        ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className={styles.snapshotItem}>
                    <span className={styles.snapshotLabel}>Liabilities</span>
                    <span className={`${styles.negative} value`}>
                        {Math.abs(totalDebt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* --- Charts & Table Row - Always use TwoColumnLayout, letting it handle its own responsiveness --- */}
            <TwoColumnLayout
                left={ChartsColumnContent}
                right={TableColumnContent}
                // Removed smallApp prop here, or explicitly set to false.
                // This ensures TwoColumnLayout uses its internal logic for 1 or 2 columns.
                smallApp={false} // This explicitly tells TwoColumnLayout to attempt 2 columns first
            />
        </div>
    );
};

export default OverviewTab;