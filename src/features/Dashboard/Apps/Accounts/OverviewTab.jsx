// src/features/Dashboard/Apps/Accounts/OverviewTab.jsx
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Text } from 'recharts';
import Section from '../../../../components/ui/Section/Section';
import Table from '../../../../components/ui/Table/Table';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import accountsStyles from './accounts.module.css'; // This is the correct import for account-specific styles
import tableStyles from '../../../../components/ui/Table/Table.module.css'; // This is for general table styles
import { DEMO_ACCOUNTS } from '../../../../utils/constants';
import sectionStyles from '../../../../components/ui/Section/Section.module.css';

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
    const radius = outerRadius + (smallApp ? 6 : 10);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const textAnchor = x > cx ? 'start' : 'end';
    const finalX = x + (x > cx ? 5 : -5);
    const finalY = y;

    // Compose label and split into words
    const labelText = `${name} (${(percent * 100).toFixed(0)}%)`;
    const words = labelText.split(' ');

    // Build lines with a max character count per line (e.g., 12)
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length > 12) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    });
    if (currentLine) lines.push(currentLine);

    return (
        <text
            x={finalX}
            y={finalY}
            fill="var(--text-primary)"
            textAnchor={textAnchor}
            dominantBaseline="central"
            className={accountsStyles.chartLabelText}
        >
            {lines.map((line, idx) => (
                <tspan
                    key={idx}
                    x={finalX}
                    dy={idx === 0 ? 0 : '1.1em'}
                >
                    {line}
                </tspan>
            ))}
        </text>
    );
};

    // The accountsHeader structure.
    // It's a header for the accounts table, and its layout should be handled by SectionHeader
    // The filter row itself uses tableStyles.filterRow
    const accountsHeader = (
        <div className={tableStyles.filterRow}> {/* This div acts as the container for title and filter */}
            <h3 className={tableStyles.tableHeaderTitle}>Your Accounts</h3>
            <div className={tableStyles.filterRow}> {/* This is the actual filter controls wrapper */}
                <label htmlFor="accountCategoryFilter" className={tableStyles.filterLabel}>Show:</label>
                <select
                    id="accountCategoryFilter"
                    value={accountCategoryFilter}
                    onChange={e => setAccountCategoryFilter(e.target.value)}
                    className={tableStyles.filterSelect}
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
        <div className={accountsStyles.snapshotRowFull}> {/* FIX: Changed from styles to accountsStyles */}
            <div className={accountsStyles.snapshotItem}> {/* FIX: Changed from styles to accountsStyles */}
                <span className={accountsStyles.snapshotLabel}>Net Worth</span> {/* FIX: Changed from styles to accountsStyles */}
                <span className={`${accountsStyles.positive} ${accountsStyles.value}`}> {/* FIX: Changed from styles to accountsStyles */}
                    ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={accountsStyles.snapshotItem}> {/* FIX: Changed from styles to accountsStyles */}
                <span className={accountsStyles.snapshotLabel}>Cash</span> {/* FIX: Changed from styles to accountsStyles */}
                <span className={`${accountsStyles.positive} ${accountsStyles.value}`}> {/* FIX: Changed from styles to accountsStyles */}
                    ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={accountsStyles.snapshotItem}> {/* FIX: Changed from styles to accountsStyles */}
                <span className={accountsStyles.snapshotLabel}>Assets</span> {/* FIX: Changed from styles to accountsStyles */}
                <span className={`${accountsStyles.positive} ${accountsStyles.value}`}> {/* FIX: Changed from styles to accountsStyles */}
                    ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={accountsStyles.snapshotItem}> {/* FIX: Changed from styles to accountsStyles */}
                <span className={accountsStyles.snapshotLabel}>Liabilities</span> {/* FIX: Changed from styles to accountsStyles */}
                <span className={`${accountsStyles.negative} ${accountsStyles.value}`}> {/* FIX: Changed from styles to accountsStyles */}
                    {Math.abs(totalDebt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );

    // Charts column (left)
    const ChartsColumnContent = (
        <>
            <Section className={`${accountsStyles.chartSectionCompact} ${accountsStyles.chartSectionNoBorder} ${smallApp ? accountsStyles.sectionCompactOverride : ''}`}> {/* FIX: Changed from styles to accountsStyles */}
                <div className={accountsStyles.chartHeader}>Assets Breakdown</div> {/* FIX: Changed from styles to accountsStyles */}
                <div className={accountsStyles.chartContainerCompact}> {/* FIX: Changed from styles to accountsStyles */}
                    {assetsPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={smallApp ? 120 : 140}> {/* Adjust height for small app */}
                            <PieChart>
                                <Pie
                                    data={assetsPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={smallApp ? 40 : 45} // Smaller radius for small app
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
                                <Legend
                                    align="center"
                                    verticalAlign="bottom"
                                    layout="vertical"
                                    wrapperStyle={{ fontSize: smallApp ? '0.65rem' : '0.7rem' }} // Smaller legend font always
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={accountsStyles.noChartData}>No assets to display.</div> // FIX: Changed from styles to accountsStyles
                    )}
                </div>
            </Section>
            <Section className={`${accountsStyles.chartSectionCompact} ${accountsStyles.chartSectionNoBorder} ${smallApp ? accountsStyles.sectionCompactOverride : ''}`}> {/* FIX: Changed from styles to accountsStyles */}
                <div className={accountsStyles.chartHeader}>Liabilities Breakdown</div> {/* FIX: Changed from styles to accountsStyles */}
                <div className={accountsStyles.chartContainerCompact}> {/* FIX: Changed from styles to accountsStyles */}
                    {liabilitiesPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={smallApp ? 120 : 140}> {/* Adjust height for small app */}
                            <PieChart>
                                <Pie
                                    data={liabilitiesPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={smallApp ? 40 : 45} // Smaller radius for small app
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
                                <Legend
                                    align="center"
                                    verticalAlign="bottom"
                                    layout="vertical"
                                    wrapperStyle={{ fontSize: smallApp ? '0.65rem' : '0.7rem' }} // Smaller legend font always
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={accountsStyles.noChartData}>No liabilities to display.</div> // FIX: Changed from styles to accountsStyles
                    )}
                </div>
            </Section>
        </>
    );

    // Table column (right)
    const TableColumnContent = (
        <>
            <Section header={accountsHeader} className={`${tableStyles.tableSection} ${smallApp ? accountsStyles.sectionCompactOverride : ''}`}>
                <Table
                    className={tableStyles.compactTable}
                    columns={[
                        { key: 'name', label: 'Account' },
                        { key: 'accountProvider', label: 'Institution' },
                        { key: 'category', label: 'Category' },
                        { key: 'subType', label: 'Type' },
                        {
                            key: 'value', label: 'Value', render: val =>
                                <span className={val >= 0 ? accountsStyles.positive : accountsStyles.negative}> {/* FIX: Changed from styles to accountsStyles */}
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
        <div className={accountsStyles.overviewTab}>
            {SnapshotRow}
            <TwoColumnLayout
                className={sectionStyles.columns66_34}
                left={<div className={accountsStyles.tableColumn}>{TableColumnContent}</div>}
                right={<div className={accountsStyles.chartsColumn}>{ChartsColumnContent}</div>}
                smallApp={smallApp}
            />
        </div>
    );
};

export default OverviewTab;