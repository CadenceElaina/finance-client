import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import sectionStyles from '../../../../../components/ui/Section/Section.module.css';
import accountsStyles from '../accounts.module.css';
import { DEMO_ACCOUNTS } from '../../../../../utils/constants';

// Simulate portfolio value over time (using purchase dates and current value)
const getPerformanceData = () => {
    let events = [];
    DEMO_ACCOUNTS.forEach(acc => {
        if (acc.hasSecurities && Array.isArray(acc.securities)) {
            acc.securities.forEach(sec => {
                if (sec.datePurchased) {
                    events.push({
                        date: sec.datePurchased.slice(0, 10),
                        value: sec.value || 0,
                        purchasePrice: (sec.purchasePrice || 0) * (sec.quantity || 1)
                    });
                }
            });
        }
    });
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    let totalValue = 0, totalCost = 0;
    const data = [];
    events.forEach(ev => {
        totalValue += ev.value;
        totalCost += ev.purchasePrice;
        data.push({
            date: ev.date,
            'Portfolio Value': totalValue,
            'Cost Basis': totalCost
        });
    });
    if (data.length > 0) {
        const last = data[data.length - 1];
        data.push({
            date: 'Now',
            'Portfolio Value': DEMO_ACCOUNTS.filter(a => a.category === 'Investments').reduce((sum, a) => sum + (a.value || 0), 0),
            'Cost Basis': last['Cost Basis']
        });
    }
    return data;
};

const PerformanceTab = ({ smallApp }) => {
    const data = getPerformanceData();
    return (
        <Section className={accountsStyles.chartSectionNoBorder}>
            <div className={sectionStyles.chartHeader}>Performance (Graph View)</div>
            <div className={accountsStyles.chartContainerCompact}>
                {data.length > 1 ? (
                    <ResponsiveContainer width="100%" height={smallApp ? 120 : 150}>
                        <LineChart data={data}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                            <Legend
                                align="center"
                                verticalAlign="bottom"
                                layout="horizontal"
                                wrapperStyle={{
                                    color: 'var(--chart-label-text)',
                                    fontSize: smallApp ? '0.65rem' : '0.7rem'
                                }}
                            />
                            <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Cost Basis" stroke="var(--color-secondary)" strokeDasharray="4 2" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className={accountsStyles.noChartData}>Not enough data for performance chart.</div>
                )}
            </div>
        </Section>
    );
};

export default PerformanceTab;