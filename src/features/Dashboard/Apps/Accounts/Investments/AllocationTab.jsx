import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import accountsStyles from '../Accounts.module.css';
import { DEMO_ACCOUNTS } from '../../../../../utils/constants';
import { renderPieLabel } from '../utils/pieChartLabelUtil';  
// Modern theme-aware color palette for charts (copied from OverviewTab for consistency)
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

const getAllocationData = () => {
    // Aggregate by subType (asset class)
    const map = {};
    DEMO_ACCOUNTS.forEach(acc => {
        if (acc.category === 'Investments') {
            const key = acc.subType || 'Other';
            map[key] = (map[key] || 0) + (acc.value || 0);
        }
    });
    // Filter out entries with zero value to prevent displaying empty slices
    return Object.entries(map).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
};

const AllocationTab = ({ smallApp }) => {
    const data = getAllocationData();
    
    return (
        <Section className={`${accountsStyles.chartSectionNoBorder} ${accountsStyles.chartSectionCompact} ${smallApp ? accountsStyles.sectionCompactOverride : ''}`}>
            <div className={accountsStyles.chartHeader}>Allocation</div>
            <div className={accountsStyles.chartContainerCompact}>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={smallApp ? 120 : 140}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                // Outer radius consistent with OverviewTab
                                outerRadius={smallApp ? 40 : 45}
                                labelLine={false}
                                label={props => renderPieLabel({ ...props, smallApp })}
                            >
                                {data.map((entry, idx) => (
                                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                // Formatter consistent with OverviewTab
                                formatter={v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                // Content style consistent with OverviewTab
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
                                // No wrapping, just show as-is
                                formatter={value => value}
                                wrapperStyle={{
                                    color: 'var(--chart-label-text)',
                                    fontSize: smallApp ? '0.65rem' : '0.7rem'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className={accountsStyles.noChartData}>No investment allocation data.</div>
                )}
            </div>
        </Section>
    );
};

export default AllocationTab;