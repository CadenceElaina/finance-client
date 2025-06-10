// src/features/Dashboard/Apps/Budget/BudgetOverviewContent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import ExpensesSection from './ExpensesSection';
import BudgetControlPanel from './BudgetControlPanel';
import styles from './budget.module.css';
import Section from '../../../../components/ui/Section/Section';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import SectionHeader from '../../../../components/ui/Section/SectionHeader';


const PERIOD_OPTIONS = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'annual', label: 'Annual' },
    { id: 'both', label: 'Both' },
];

const TAX_OPTIONS = [
    { id: 'after', label: 'After-tax' },
    { id: 'pre', label: 'Pre-tax' },
    { id: 'both', label: 'Both' },
];

// Extract SummaryContent to its own component (if it's not already)
// and pass all necessary props to it.
// This helps keep BudgetOverviewContent cleaner.
const SummaryContent = ({
    period, setPeriod, tax, setTax,
    monthlyIncomeAT, annualIncomeAT, monthlyIncomePT, annualIncomePT,
    monthlyExpenses, annualExpenses,
    monthlyDiscretionaryAT, annualDiscretionaryAT,
    monthlyDiscretionaryPT, annualDiscretionaryPT
}) => {
    const format = (val) =>
        `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const showAfter = tax === 'after' || tax === 'both';
    const showPre = tax === 'pre' || tax === 'both';

    const showMonthly = period === 'monthly' || period === 'both';
    const showAnnual = period === 'annual' || period === 'both';

    // Determine if only one column should be shown within the summary section itself
    const singleColumnSummary = (showMonthly && !showAnnual) || (!showMonthly && showAnnual);

    // Helper to render a section for a given period/tax
    const renderSummarySection = (periodLabel, income, expenses, discretionary, taxLabel) => (
        <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {periodLabel} {taxLabel ? `(${taxLabel})` : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Income:</span>
                <strong>{format(income)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Expenses:</span>
                <strong>{format(expenses)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discretionary:</span>
                <strong style={{ color: discretionary < 0 ? 'var(--color-danger)' : undefined }}>{format(discretionary)}</strong>
            </div>
        </div>
    );

    const Controls = (
        <div style={{ display: 'flex', gap: 8 }}>
            <div>
                <label htmlFor="period-select" style={{ marginRight: 4 }}>Period</label>
                <select
                    id="period-select"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                >
                    {PERIOD_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="tax-select" style={{ marginRight: 4 }}>Tax</label>
                <select
                    id="tax-select"
                    value={tax}
                    onChange={e => setTax(e.target.value)}
                >
                    {TAX_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );

    return (
        <Section
            header={
                <SectionHeader
                    title="Summary"
                    right={Controls}
                />
            }
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: singleColumnSummary ? '1fr' : '1fr 1fr', // Use the internal singleColumnSummary
                gap: 24,
                maxWidth: 700,
                margin: '0 auto'
            }}>
                {showMonthly && (
                    <div>
                        {showAfter && renderSummarySection('Monthly', monthlyIncomeAT, monthlyExpenses, monthlyDiscretionaryAT, 'After-tax')}
                        {showPre && renderSummarySection('Monthly', monthlyIncomePT, monthlyExpenses, monthlyDiscretionaryPT, 'Pre-tax')}
                    </div>
                )}
                {showAnnual && (
                    <div>
                        {showAfter && renderSummarySection('Annual', annualIncomeAT, annualExpenses, annualDiscretionaryAT, 'After-tax')}
                        {showPre && renderSummarySection('Annual', annualIncomePT, annualExpenses, annualDiscretionaryPT, 'Pre-tax')}
                    </div>
                )}
            </div>
        </Section>
    );
};


// This is the main component for the Budget Overview content area
const BudgetOverviewContent = ({ smallApp, activeInnerTabId }) => {
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('both');
    const overviewContentRef = useRef(null);

    // No need for local resize observer here, smallApp comes from parent.

    if (isLoading) return <div className={styles.budgetContentWrapper} ref={overviewContentRef}>Loading budget overview...</div>;
    if (error) return <div className={`${styles.budgetContentWrapper} ${styles.error}`} ref={overviewContentRef}>{error}</div>;
    if (!budget) return <div className={styles.budgetContentWrapper} ref={overviewContentRef}>No budget data available.</div>;

    // Move all calculated values that depend on 'budget' INSIDE the component
    // after `useBudget()` has provided the `budget` object.
    const monthlyIncomeAT = budget.monthlyAfterTax || 0;
    const annualIncomeAT = (monthlyIncomeAT * 12) + (budget.income.bonusAfterTax || 0) + (budget.income.additionalIncomeAfterTax || 0);

    const monthlyIncomePT = budget.income.type === 'salary'
        ? (budget.income.annualPreTax || 0) / 12
        : ((budget.income.hourlyRate || 0) * (budget.income.expectedAnnualHours || 0) / 12);

    const annualIncomePT = budget.income.type === 'salary'
        ? (budget.income.annualPreTax || 0)
        : ((budget.income.hourlyRate || 0) * (budget.income.expectedAnnualHours || 0));

    const monthlyExpenses = budget.totalMonthlyExpenses || 0;
    const annualExpenses = monthlyExpenses * 12;

    const monthlyDiscretionaryAT = monthlyIncomeAT - monthlyExpenses;
    const annualDiscretionaryAT = annualIncomeAT - annualExpenses; // Corrected annual calc
    const monthlyDiscretionaryPT = monthlyIncomePT - monthlyExpenses;
    const annualDiscretionaryPT = annualIncomePT - annualExpenses; // Corrected annual calc


    // Props to pass to SummaryContent
    const summaryProps = {
        period, setPeriod, tax, setTax,
        monthlyIncomeAT, annualIncomeAT, monthlyIncomePT, annualIncomePT,
        monthlyExpenses, annualExpenses,
        monthlyDiscretionaryAT, annualDiscretionaryAT,
        monthlyDiscretionaryPT, annualDiscretionaryPT
    };

    // Props to pass to ExpensesSection
    const expensesProps = {
        expenses: budget.monthlyExpenses,
        smallApp: smallApp, // Pass smallApp down if ExpensesSection needs it
    };

    return (
        <div className={styles.budgetContentWrapper} ref={overviewContentRef}>
            {smallApp ? (
                // In small app mode, display only the actively selected inner tab content
                activeInnerTabId === 'expenses' ? <ExpensesSection {...expensesProps} /> : <SummaryContent {...summaryProps} />
            ) : (
                // Not in small app mode, display both side-by-side
                <TwoColumnLayout
                    left={<SummaryContent {...summaryProps} />}
                    right={<ExpensesSection {...expensesProps} />}
                    smallApp={false}
                />
            )}
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default BudgetOverviewContent;