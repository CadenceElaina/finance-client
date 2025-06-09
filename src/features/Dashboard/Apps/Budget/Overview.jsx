import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import ExpensesSection from './ExpensesSection';
import BudgetControlPanel from './BudgetControlPanel';
import styles from './budget.module.css';
import { isSmallApp } from '../../../../utils/isSmallApp';
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

const Overview = ({ smallTab }) => {
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('both');
    const budgetOverviewRef = useRef(null);

    // State for observing container size
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!budgetOverviewRef.current) return;
        const setInitialSize = () => {
            const rect = budgetOverviewRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };
        setInitialSize();
        const resizeObserver = new window.ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === budgetOverviewRef.current) {
                    const { width, height } = entry.contentRect;
                    setContainerSize({ width, height });
                }
            }
        });
        resizeObserver.observe(budgetOverviewRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const smallApp = isSmallApp(containerSize);

    if (isLoading) return <div className={styles.budgetContentWrapper} ref={budgetOverviewRef}>Loading budget overview...</div>;
    if (error) return <div className={`${styles.budgetContentWrapper} ${styles.error}`} ref={budgetOverviewRef}>{error}</div>;
    if (!budget) return <div className={styles.budgetContentWrapper} ref={budgetOverviewRef}>No budget data available.</div>;

    // Calculated values
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
    const annualDiscretionaryAT = (monthlyIncomeAT * 12 + (budget.income.bonusAfterTax || 0) + (budget.income.additionalIncomeAfterTax || 0)) - annualExpenses;
    const monthlyDiscretionaryPT = monthlyIncomePT - monthlyExpenses;
    const annualDiscretionaryPT = (monthlyIncomePT * 12) - annualExpenses;

    // --- Controls for period/tax ---
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

    // --- UI for summary section ---
    const SummarySectionContent = () => {
        const format = (val) =>
            `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const showAfter = tax === 'after' || tax === 'both';
        const showPre = tax === 'pre' || tax === 'both';

        const showMonthly = period === 'monthly' || period === 'both';
        const showAnnual = period === 'annual' || period === 'both';

        // Determine if only one column should be shown
        const singleColumn = (showMonthly && !showAnnual) || (!showMonthly && showAnnual);

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
                    gridTemplateColumns: singleColumn ? '1fr' : '1fr 1fr',
                    gap: 24,
                    maxWidth: 700,
                    margin: '0 auto'
                }}>
                    {/* Left: Monthly */}
                    {showMonthly && (
                        <div>
                            {showAfter &&
                                renderSummarySection(
                                    'Monthly',
                                    monthlyIncomeAT,
                                    monthlyExpenses,
                                    monthlyDiscretionaryAT,
                                    'After-tax'
                                )}
                            {showPre &&
                                renderSummarySection(
                                    'Monthly',
                                    monthlyIncomePT,
                                    monthlyExpenses,
                                    monthlyDiscretionaryPT,
                                    'Pre-tax'
                                )}
                        </div>
                    )}
                    {/* Right: Annual */}
                    {showAnnual && (
                        <div>
                            {showAfter &&
                                renderSummarySection(
                                    'Annual',
                                    annualIncomeAT,
                                    annualExpenses,
                                    annualDiscretionaryAT,
                                    'After-tax'
                                )}
                            {showPre &&
                                renderSummarySection(
                                    'Annual',
                                    annualIncomePT,
                                    annualExpenses,
                                    annualDiscretionaryPT,
                                    'Pre-tax'
                                )}
                        </div>
                    )}
                </div>
            </Section>
        );
    };

    // --- UI for expenses section ---
    const ExpensesSectionWrapper = () => {
        return (
            <Section
                header={
                    <SectionHeader
                        title="Monthly Expenses"
                        right={null}
                    />
                }
            >
                <ExpensesSection
                    expenses={budget.monthlyExpenses}
                    smallApp={smallApp}
                />
            </Section>
        );
    };

    // --- Render logic ---
    return (
        <div className={styles.budgetContentWrapper} ref={budgetOverviewRef}>
            {/* Small app: show only the selected tab */}
            {smallApp && smallTab === 'expenses' && <ExpensesSectionWrapper />}
            {smallApp && smallTab === 'summary' && <SummarySectionContent />}
            {/* Not small app: always show both side by side */}
            {!smallApp && (
                <TwoColumnLayout
                    left={<SummarySectionContent />}
                    right={<ExpensesSectionWrapper />}
                    smallApp={false}
                />
            )}
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default Overview;