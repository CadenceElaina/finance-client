// src/features/Dashboard/Apps/Accounts/OverviewTab.jsx
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

    const cashAccounts = accounts.filter(acc => acc.category === 'Cash');
    const investmentAccounts = accounts.filter(acc => acc.category === 'Investments');
    const debtAccounts = accounts.filter(acc => acc.category === 'Debt');

    const filteredAccountsForTable = useMemo(() => {
        if (accountCategoryFilter === 'all') return accounts;
        if (accountCategoryFilter === 'Cash') return cashAccounts;
        if (accountCategoryFilter === 'Investments') return investmentAccounts;
        if (accountCategoryFilter === 'Debt') return debtAccounts;
        return accounts;
    }, [accounts, accountCategoryFilter, cashAccounts, investmentAccounts, debtAccounts]);

    const netWorth = getNetWorth(accounts);
    const totalCash = cashAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const totalInvestments = investmentAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const totalDebt = debtAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const totalAssets = totalCash + totalInvestments;

    const assetsPieData = [
        { name: 'Cash', value: totalCash },
        { name: 'Investments', value: totalInvestments },
    ].filter(d => d.value > 0);

    const liabilitiesPieData = debtAccounts
        .map(acc => ({
            name: acc.name,
            value: Math.abs(acc.value || 0),
        }))
        .filter(d => d.value > 0);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 15;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const textAnchor = x > cx ? 'start' : 'end';
        const finalX = x + (x > cx ? 5 : -5);
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

    // Snapshot row (always above)
    const SnapshotRow = (
        <div className={styles.snapshotRowFull}>
            <div className={styles.snapshotItem}>
                <span className={styles.snapshotLabel}>Net Worth</span>
                <span className={`${styles.positive} ${styles.value}`}>
                    ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={styles.snapshotItem}>
                <span className={styles.snapshotLabel}>Cash</span>
                <span className={`${styles.positive} ${styles.value}`}>
                    ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={styles.snapshotItem}>
                <span className={styles.snapshotLabel}>Assets</span>
                <span className={`${styles.positive} ${styles.value}`}>
                    ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={styles.snapshotItem}>
                <span className={styles.snapshotLabel}>Liabilities</span>
                <span className={`${styles.negative} ${styles.value}`}>
                    {Math.abs(totalDebt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );

    // Charts column (left)
    const ChartsColumnContent = (
        <>
            <Section className={`${styles.chartSectionCompact} ${smallApp ? styles.sectionCompactOverride : ''}`}>
                <div className={styles.chartHeader}>Assets Breakdown</div>
                <div className={styles.chartContainerCompact}>
                    {assetsPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={smallApp ? 140 : 160}> {/* Adjust height for small app */}
                            <PieChart>
                                <Pie
                                    data={assetsPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={smallApp ? 55 : 65} // Smaller radius for small app
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
                                        fontSize: smallApp ? '0.7rem' : '0.8rem' // Smaller tooltip font
                                    }}
                                />
                                <Legend align="center" verticalAlign="bottom" layout="horizontal"
                                    wrapperStyle={smallApp ? { fontSize: '0.7rem' } : {}} // Smaller legend font
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.noChartData}>No assets to display.</div>
                    )}
                </div>
            </Section>
            <Section className={`${styles.chartSectionCompact} ${smallApp ? styles.sectionCompactOverride : ''}`}>
                <div className={styles.chartHeader}>Liabilities Breakdown</div>
                <div className={styles.chartContainerCompact}>
                    {liabilitiesPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={smallApp ? 140 : 160}> {/* Adjust height for small app */}
                            <PieChart>
                                <Pie
                                    data={liabilitiesPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={smallApp ? 55 : 65} // Smaller radius for small app
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
                                        fontSize: smallApp ? '0.7rem' : '0.8rem'
                                    }}
                                />
                                <Legend align="center" verticalAlign="bottom" layout="horizontal"
                                    wrapperStyle={smallApp ? { fontSize: '0.7rem' } : {}}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.noChartData}>No liabilities to display.</div>
                    )}
                </div>
            </Section>
        </>
    );

    // Table column (right)
    const TableColumnContent = (
        <>
            <Section header={accountsHeader} className={`${styles.tableSectionCompact} ${smallApp ? styles.sectionCompactOverride : ''}`}>
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
                    smallApp={smallApp} // Pass smallApp directly to the Table component
                />
            </Section>
        </>
    );

    return (
        <div className={styles.overviewTab}>
            {SnapshotRow}
            <TwoColumnLayout
                left={<div className={styles.chartsColumn}>{ChartsColumnContent}</div>}
                right={<div className={styles.tableColumn}>{TableColumnContent}</div>}
                smallApp={false} // really should rethink approach to TwoColumnLayout and smallApp usage - our BudgetOverview shows only one section (summary or expenses) in smallApp mode whereas Accounts OverviewTab should show all the content in smallApp mode or largeApp
            />
        </div>
    );
};

export default OverviewTab;