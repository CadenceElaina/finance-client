import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import { DEMO_ACCOUNTS } from '../../../../../utils/constants';

// Simulate portfolio value over time (using purchase dates and current value)
const getPerformanceData = () => {
    // Gather all securities with purchase date and value
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
    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Cumulative sum for "current value" and "cost basis"
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
    // Add current total as last point
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

const PerformanceTab = () => {
    const data = getPerformanceData();
    return (
        <Section title="Performance (Graph View)">
            {data.length > 1 ? (
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                        <Legend />
                        <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Cost Basis" stroke="var(--color-secondary)" strokeDasharray="4 2" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div>Not enough data for performance chart.</div>
            )}
        </Section>
    );
};

export default PerformanceTab;