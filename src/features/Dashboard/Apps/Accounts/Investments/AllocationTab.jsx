import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import { DEMO_ACCOUNTS } from '../../../../../utils/constants';

const COLORS = [
    'var(--color-primary)', 'var(--color-secondary)', '#7AA2F7', '#BB9AF7', '#FFD700', '#EF5350'
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
    return Object.entries(map).map(([name, value]) => ({ name, value }));
};

const AllocationTab = () => {
    const data = getAllocationData();
    return (
        <Section title="Allocation (Chart View)">
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {data.map((entry, idx) => (
                                <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                        <Legend align="center" verticalAlign="bottom" />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div>No investment allocation data.</div>
            )}
        </Section>
    );
};

export default AllocationTab;