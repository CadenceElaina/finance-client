// src/features/Dashboard/Apps/Budget/Overview.jsx
import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import ExpensesSection from './ExpensesSection';
import BudgetControlPanel from './BudgetControlPanel';
import styles from './budget.module.css';

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

const Overview = () => {
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('after');

    if (isLoading) return <div className={styles.budgetContentWrapper}>Loading budget overview...</div>;
    if (error) return <div className={`${styles.budgetContentWrapper} ${styles.error}`}>{error}</div>;
    if (!budget) return <div className={styles.budgetContentWrapper}>No budget data available.</div>;

    // Calculated values
    const monthlyIncomeAT = budget.averageIncomeAfterTaxMonthly || 0;
    const annualIncomeAT = monthlyIncomeAT * 12 + (budget.income.bonus || 0) + (budget.income.additionalIncome || 0);
    const monthlyIncomePT = budget.income.type === 'salary'
        ? (budget.income.salary || 0)
        : ((budget.income.hourlyRate || 0) * (budget.income.expectedAnnualHours || 0) / 12);
    const annualIncomePT = budget.income.type === 'salary'
        ? (budget.income.salary || 0) * 12
        : ((budget.income.hourlyRate || 0) * (budget.income.expectedAnnualHours || 0));
    const monthlyExpenses = budget.totalMonthlyExpenses || 0;
    const annualExpenses = monthlyExpenses * 12;
    const monthlyDiscretionaryAT = monthlyIncomeAT - monthlyExpenses;
    const annualDiscretionaryAT = (monthlyIncomeAT * 12) - annualExpenses;
    const monthlyDiscretionaryPT = monthlyIncomePT - monthlyExpenses;
    const annualDiscretionaryPT = (monthlyIncomePT * 12) - annualExpenses;

    // Helper to decide what to show
    const showMonthly = period === 'monthly' || period === 'both';
    const showAnnual = period === 'annual' || period === 'both';
    const showAT = tax === 'after' || tax === 'both';
    const showPT = tax === 'pre' || tax === 'both';

    return (
        <div className={styles.budgetContentWrapper}>
            <div className={styles.overviewGridCustom}>
                {/* Left: Overall Summary */}
                <div className={styles.summarySectionCustom}>
                    <h2 className={styles.overviewTitle}>Overall Summary</h2>
                    <div className={styles.stackedControls}>
                        <div className={styles.stackedButtonGroup}>
                            {PERIOD_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPeriod(opt.id)}
                                    className={`${styles.overviewButton} ${period === opt.id ? styles.active : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.stackedButtonGroup}>
                            {TAX_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTax(opt.id)}
                                    className={`${styles.overviewButton} ${tax === opt.id ? styles.active : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.summaryValues}>
                        {showMonthly && (
                            <>
                                <h4 style={{ marginBottom: 8 }}>Monthly</h4>
                                {showAT && (
                                    <>
                                        <div className={styles.summaryRow}>
                                            <span>Income (After-tax):</span>
                                            <span>${monthlyIncomeAT.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Discretionary (After-tax):</span>
                                            <span className={monthlyDiscretionaryAT < 0 ? styles.negative : ''}>
                                                ${monthlyDiscretionaryAT.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {showPT && (
                                    <>
                                        <div className={styles.summaryRow}>
                                            <span>Income (Pre-tax):</span>
                                            <span>${monthlyIncomePT.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Discretionary (Pre-tax):</span>
                                            <span className={monthlyDiscretionaryPT < 0 ? styles.negative : ''}>
                                                ${monthlyDiscretionaryPT.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className={styles.summaryRow}>
                                    <span>Expenses:</span>
                                    <span>${monthlyExpenses.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                        {showAnnual && (
                            <>
                                <h4 style={{ marginBottom: 8 }}>Annual</h4>
                                {showAT && (
                                    <>
                                        <div className={styles.summaryRow}>
                                            <span>Income (After-tax):</span>
                                            <span>${annualIncomeAT.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Discretionary (After-tax):</span>
                                            <span className={annualDiscretionaryAT < 0 ? styles.negative : ''}>
                                                ${annualDiscretionaryAT.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {showPT && (
                                    <>
                                        <div className={styles.summaryRow}>
                                            <span>Income (Pre-tax):</span>
                                            <span>${annualIncomePT.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Discretionary (Pre-tax):</span>
                                            <span className={annualDiscretionaryPT < 0 ? styles.negative : ''}>
                                                ${annualDiscretionaryPT.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className={styles.summaryRow}>
                                    <span>Expenses:</span>
                                    <span>${annualExpenses.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {/* Right: Expenses */}
                <ExpensesSection expenses={budget.monthlyExpenses} />
            </div>
            {/* BudgetControlPanel is now inside the budgetContentWrapper */}
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default Overview;