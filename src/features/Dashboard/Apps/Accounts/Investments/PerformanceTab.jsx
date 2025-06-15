import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Section from '../../../../../components/ui/Section/Section';
import sectionStyles from '../../../../../components/ui/Section/Section.module.css';
import accountsStyles from '../Accounts.module.css';
import { useFinancialData } from '../../../../../contexts/FinancialDataContext';

const getPerformanceDataForPortfolio = (accounts, portfolioId) => {
    let relevantAccounts = [];
    if (portfolioId === 'all') {
        relevantAccounts = accounts.filter(acc => acc.category === 'Investments' && acc.hasSecurities);
    } else {
        relevantAccounts = accounts.filter(acc => acc.category === 'Investments' && acc.hasSecurities && acc.portfolioId === portfolioId);
    }

    let events = [];
    let currentPortfolioValue = 0;
    relevantAccounts.forEach(acc => {
        currentPortfolioValue += (acc.value || 0); // Sum current values for "Now" point
        if (Array.isArray(acc.securities)) {
            acc.securities.forEach(sec => {
                if (sec.datePurchased) {
                    events.push({
                        date: sec.datePurchased.slice(0, 10), // Ensure YYYY-MM-DD format for sorting
                        valueChange: (sec.value || 0) - ((sec.purchasePrice || 0) * (sec.quantity || 1)), // Value change from this event
                        cost: (sec.purchasePrice || 0) * (sec.quantity || 1)
                    });
                }
            });
        }
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    const data = [];
    let cumulativeValue = 0;
    let cumulativeCost = 0;

    // Find the earliest date to start the chart from a zero-like baseline if needed
    const earliestDate = events.length > 0 ? events[0].date : new Date().toISOString().slice(0,10);

    if (events.length > 0) {
         // Optional: Add a point before the first purchase if you want the line to start from 0
        const dayBeforeFirstPurchase = new Date(events[0].date);
        dayBeforeFirstPurchase.setDate(dayBeforeFirstPurchase.getDate() -1);
        data.push({
            date: dayBeforeFirstPurchase.toISOString().slice(0,10),
            'Portfolio Value': 0,
            'Cost Basis': 0,
        });
    }


    const aggregatedEvents = events.reduce((acc, event) => {
        acc[event.date] = acc[event.date] || { date: event.date, valueChange: 0, cost: 0 };
        acc[event.date].valueChange += event.valueChange;
        acc[event.date].cost += event.cost;
        return acc;
    }, {});

    const sortedDates = Object.keys(aggregatedEvents).sort((a,b) => new Date(a) - new Date(b));

    sortedDates.forEach(date => {
        cumulativeCost += aggregatedEvents[date].cost;
        // For portfolio value, it's trickier with just purchase events.
        // A true performance chart often needs historical prices or snapshots.
        // This simplified version will show cost basis and an estimated value line.
        // For a more accurate "Portfolio Value", you'd typically sum current values of holdings at each date point.
        // The current `currentPortfolioValue` is the *total current value*, not historical.
        // Let's adjust to make "Portfolio Value" reflect the sum of costs + gains up to that point.
        // This is still an estimation.
        cumulativeValue += aggregatedEvents[date].cost + aggregatedEvents[date].valueChange; // Simplified: cost + gain/loss from purchases
                                                                                          // A better approach would be to track total market value over time.
        data.push({
            date: date,
            'Portfolio Value': cumulativeValue, // This is an approximation
            'Cost Basis': cumulativeCost
        });
    });
    
    // Add "Now" point using the sum of current values of securities in the portfolio
    if (data.length > 0) {
         const finalCostBasis = data[data.length -1]['Cost Basis'];
         data.push({
            date: 'Now',
            'Portfolio Value': relevantAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0),
            'Cost Basis': finalCostBasis
        });
    } else if (relevantAccounts.length > 0) { // Case: portfolio exists but no purchase history
         data.push({
            date: 'Now',
            'Portfolio Value': relevantAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0),
            'Cost Basis': 0
        });
    }


    return data.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.date === item.date
        ))
    ); // Remove duplicate dates if any
};


const PerformanceTab = ({ smallApp, portfolioId }) => {
    const { data: financialData } = useFinancialData();
    const accounts = financialData.accounts || [];

    const performanceChartData = useMemo(() => {
        return getPerformanceDataForPortfolio(accounts, portfolioId);
    }, [accounts, portfolioId]);

    return (
        <Section className={accountsStyles.chartSectionNoBorder}>
            <div className={sectionStyles.chartHeader}>Portfolio Performance</div>
            <div className={accountsStyles.chartContainerCompact}>
                {performanceChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={smallApp ? 140 : 180}>
                        <LineChart data={performanceChartData}>
                            <XAxis dataKey="date" fontSize={smallApp ? 9 : 11} />
                            <YAxis fontSize={smallApp ? 9 : 11} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend wrapperStyle={{ fontSize: smallApp ? "0.65rem" : "0.75rem" }} />
                            <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Cost Basis" stroke="var(--color-secondary)" strokeDasharray="5 3" dot={false} />
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