import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import sectionStyles from '../../../../../components/ui/Section/Section.module.css';
import accountsStyles from '../Accounts.module.css';
import { useFinancialData } from '../../../../../contexts/FinancialDataContext';

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

    // Custom label for the pie chart with radial lines
    const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name, value, index }) => {


        const RADIAN = Math.PI / 180;
        const radius = outerRadius * 1.1; // Position labels slightly outside the pie
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const percentageDisplay = ((value / totalValue) * 100).toFixed(1);

        // Calculate line coordinates for radial line
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + outerRadius * cos;
        const sy = cy + outerRadius * sin;
        const mx = cx + (outerRadius + (smallApp ? 10 : 20)) * cos;
        const my = cy + (outerRadius + (smallApp ? 10 : 20)) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * (smallApp ? 12 : 20);
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="var(--border-light)" fill="none" />
                <circle cx={ex} cy={ey} r={2} fill="var(--border-light)" stroke="none" />
                <text
                    x={ex + (cos >= 0 ? 1 : -1) * 6}
                    y={ey}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fill="var(--chart-label-text)" // Use theme variable for text color
                    fontSize={smallApp ? "0.6rem" : "0.7rem"}
                >
                    {`${name} (${percentageDisplay}%)`}
                </text>
            </g>
        );
    };

    // Use the same style as SectionHeader titles for the chart header
    const allocationTitle = (
        <div
            className={sectionStyles.sectionHeaderTitle}
            style={{ textAlign: 'center', width: '100%' }}
        >
            {portfolioName ? `${portfolioName}'s Allocation` : "Portfolio Allocation"}
        </div>
    );

    return (
        <Section className={`${accountsStyles.chartSection} ${smallApp ? accountsStyles.sectionSmall : ''}`}>
            {allocationTitle}
            <div className={accountsStyles.chartContainer}>
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={smallApp ? 180 : 265}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={smallApp ? 50 : 95}
                                innerRadius={smallApp ? 25 : 50}
                                // Remove label and labelLine to hide slice labels
                            >
                                {pieData.map((entry, idx) => (
                                    <Cell key={`cell-${entry.name}-${idx}`} fill={`var(--chart-color-${(idx % 8) + 1})`} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name, props) => {
                                    const percentage = totalValue ? ((value / totalValue) * 100).toFixed(2) : 0;
                                    return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${percentage}%)`, name];
                                }}
                                contentStyle={{
                                    background: 'var(--chart-tooltip-bg)',      // Use theme variable for background
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--chart-tooltip-text)',         // Use theme variable for text
                                    borderRadius: 'var(--border-radius-md)',
                                    fontSize: 'var(--font-size-xs)'
                                }}
                                itemStyle={{
                                    color: 'var(--chart-tooltip-text)',         // Ensure text inside tooltip uses theme variable
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