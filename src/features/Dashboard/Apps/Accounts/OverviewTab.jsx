// src/features/Dashboard/Apps/Accounts/OverviewTab.jsx
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Section from '../../../../components/ui/Section/Section';
import Table from '../../../../components/ui/Table/Table';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import accountsStyles from './accounts.module.css'; // This is the correct import for account-specific styles
import tableStyles from '../../../../components/ui/Table/Table.module.css'; // This is for general table styles
import { DEMO_ACCOUNTS } from '../../../../utils/constants';
import sectionStyles from '../../../../components/ui/Section/Section.module.css';
import { useFinancialData } from '../../../../contexts/FinancialDataContext';
import { renderPieLabel } from './utils/pieChartLabelUtil'
import SectionHeader from '../../../../components/ui/Section/SectionHeader';

// Modern theme-aware color palette for charts
const CHART_COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    '#7AA2F7', // Tokyo Night blue
    '#BB9AF7', // Tokyo Night purple
    '#00FFD1', // Accent tealLet
    '#FF8C69', // Accent coral
    '#FFD700', // Gold
    '#EF5350', // Red
];

// Utility: Net worth calculation
const getNetWorth = (accounts) =>
    accounts.reduce((sum, acc) => sum + (typeof acc.value === 'number' ? acc.value : 0), 0);

const OverviewTab = ({ smallApp }) => {
    const { data: { accounts } } = useFinancialData();
    //console.log('OverviewTab rendered with smallApp:', smallApp);
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

    // The accountsHeader structure.
    // It's a header for the accounts table, and its layout should be handled by SectionHeader
    // The filter row itself uses tableStyles.filterRow
    const accountsHeader = (
        <SectionHeader
            title="Your Accounts"
            right={
                <div>
                    <label htmlFor="accountCategoryFilter" className={tableStyles.filterLabel}>Show:</label>
                    <select
                        id="accountCategoryFilter"
                        value={accountCategoryFilter}
                        onChange={e => setAccountCategoryFilter(e.target.value)}
                        className={tableStyles.select} // Use the unified select class
                    >
                        <option value="all">All Accounts</option>
                        <option value="Cash">Cash Accounts</option>
                        <option value="Investments">Investment Accounts</option>
                        <option value="Debt">Liability Accounts</option>
                    </select>
                </div>
            }
        />
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
                                    label={props => renderPieLabel({ ...props, smallApp })} // FIX: Use renderPieLabel utility
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
                                        background: '#fff',
                                        border: '1px solid var(--border-light)',
                                        color: 'var(--chart-tooltip-text)',
                                        borderRadius: 8,
                                        fontSize: '0.7rem'
                                    }}
                                />
                                <Legend
                                    align="center"
                                    verticalAlign="bottom"
                                    layout="horizontal"
                                    wrapperStyle={{
                                        color: 'var(--chart-label-text)',
                                        fontSize: smallApp ? '0.65rem' : '0.7rem'
                                    }}
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
                                    label={props => renderPieLabel({ ...props, smallApp })} // FIX: Use renderPieLabel utility
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
                                        background: '#fff',
                                        border: '1px solid var(--border-light)',
                                        color: 'var(--chart-tooltip-text)',
                                        borderRadius: 8,
                                        fontSize: '0.7rem'
                                    }}
                                />
                                <Legend
                                    align="center"
                                    verticalAlign="bottom"
                                    layout="horizontal"
                                    wrapperStyle={{
                                        color: 'var(--chart-label-text)',
                                        fontSize: smallApp ? '0.65rem' : '0.7rem'
                                    }}
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
            <TwoColumnLayout
                className={sectionStyles.columns70_30 }
                left={<div className={accountsStyles.tableColumn}>{TableColumnContent}</div>}
                right={<div className={accountsStyles.chartsColumn}>{ChartsColumnContent}</div>}
                smallApp={smallApp}
            />
        </div>
    );
};

export default OverviewTab;