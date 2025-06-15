import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import sectionStyles from '../../../../../components/ui/Section/Section.module.css';
import accountsStyles from '../Accounts.module.css';
import { useFinancialData } from '../../../../../contexts/FinancialDataContext';

const CHART_COLORS = [
    'var(--color-primary)', '#7AA2F7', 'var(--color-secondary)', '#BB9AF7',
    '#00FFD1', '#FF8C69', '#FFD700', '#EF5350',
    '#4CAF50', '#FF9800', '#9C27B0', '#2196F3'
];

const AllocationTab = ({ smallApp, portfolioId, portfolioName }) => {
    const { data } = useFinancialData();
    const allAccounts = data.accounts || [];

    const { pieData, totalValue } = useMemo(() => {
        let relevantAccounts = [];
        if (portfolioId === 'all') {
            relevantAccounts = allAccounts.filter(acc => acc.category === 'Investments' && acc.hasSecurities);
        } else {
            relevantAccounts = allAccounts.filter(acc => acc.category === 'Investments' && acc.hasSecurities && acc.portfolioId === portfolioId);
        }

        const securitiesInPortfolio = [];
        relevantAccounts.forEach(acc => {
            if (Array.isArray(acc.securities)) {
                securitiesInPortfolio.push(...acc.securities);
            }
        });

        const currentTotalValue = securitiesInPortfolio.reduce((sum, sec) => sum + (sec.value || 0), 0);

        // Aggregate securities by ticker/name if they appear multiple times
        const aggregatedSecurities = securitiesInPortfolio.reduce((acc, curr) => {
            const key = curr.ticker || curr.name;
            if (!acc[key]) {
                acc[key] = { name: key, value: 0 };
            }
            acc[key].value += (curr.value || 0);
            return acc;
        }, {});

        const currentPieData = Object.values(aggregatedSecurities).filter(d => d.value > 0);

        return { pieData: currentPieData, totalValue: currentTotalValue };
    }, [allAccounts, portfolioId]);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
        if (percent < 0.03 || !totalValue) return null;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const percentageDisplay = ((value / totalValue) * 100).toFixed(1);

        return (
            <text
                x={x}
                y={y}
                fill="var(--chart-label-text)"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={smallApp ? "0.6rem" : "0.7rem"}
            >
                {`${name} (${percentageDisplay}%)`}
            </text>
        );
    };

    // Use the same style as SectionHeader titles for the chart header
    const allocationTitle = (
        <div className={sectionStyles.sectionHeaderTitle}>
            {portfolioName ? `${portfolioName}'s Allocation` : "Portfolio Allocation"}
        </div>
    );

    return (
        <Section className={`${accountsStyles.chartSectionNoBorder} ${accountsStyles.chartSectionCompact} ${smallApp ? accountsStyles.sectionCompactOverride : ''}`}>
            {allocationTitle}
            <div className={accountsStyles.chartContainerCompact}>
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={smallApp ? 140 : 180}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={smallApp ? 50 : 65}
                                innerRadius={smallApp ? 25 : 35}
                                labelLine={false}
                                label={renderCustomizedLabel}
                            >
                                {pieData.map((entry, idx) => (
                                    <Cell key={`cell-${entry.name}-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name, props) => {
                                    const percentage = totalValue ? ((value / totalValue) * 100).toFixed(2) : 0;
                                    return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${percentage}%)`, name];
                                }}
                                contentStyle={{
                                    background: 'var(--surface-light)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--chart-tooltip-text)',
                                    borderRadius: 'var(--border-radius-md)',
                                    fontSize: 'var(--font-size-xs)'
                                }}
                            />
                            <Legend
                                align="center"
                                verticalAlign="bottom"
                                layout="horizontal"
                                iconSize={10}
                                wrapperStyle={{
                                    fontSize: smallApp ? "0.65rem" : "0.75rem",
                                    color: 'var(--chart-label-text)',
                                    paddingTop: smallApp ? '5px' : '10px',
                                    lineHeight: '1.5'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className={accountsStyles.noChartData}>No securities to display for this portfolio.</div>
                )}
            </div>
        </Section>
    );
};

export default AllocationTab;