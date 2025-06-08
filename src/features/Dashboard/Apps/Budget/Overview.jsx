import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import ExpensesSection from './ExpensesSection';
import BudgetControlPanel from './BudgetControlPanel';
import styles from './budget.module.css';
import { isSmallApp } from '../../../../utils/isSmallApp';
import Button from '../../../../components/ui/Button/Button';
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

const Overview = () => {
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('both');

    // State for observing container size
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const budgetOverviewRef = useRef(null);

    // State for internal tabs when app is small
    const [activeInternalTab, setActiveInternalTab] = useState('summary'); // 'summary' or 'expenses'

    useEffect(() => {
        if (!budgetOverviewRef.current) return;

        // Helper to set initial size immediately
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

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Determine if we should use small app mode
    const smallApp = isSmallApp(containerSize);

    if (isLoading) return <div className={styles.budgetContentWrapper} ref={budgetOverviewRef}>Loading budget overview...</div>;
    if (error) return <div className={`${styles.budgetContentWrapper} ${styles.error}`} ref={budgetOverviewRef}>{error}</div>;
    if (!budget) return <div className={styles.budgetContentWrapper} ref={budgetOverviewRef}>No budget data available.</div>;

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

    // --- Controls for period/tax ---
    const Controls = (
        <div className={styles.stackedControls}>
            <div className={styles.stackedButtonGroup}>
                <label htmlFor="period-select" >Period</label>
                <select
                    id="period-select"
                    className={styles.select}
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                >
                    {PERIOD_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className={styles.stackedButtonGroup}>
                <label htmlFor="tax-select" >Tax</label>
                <select
                    id="tax-select"
                    className={styles.select}
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

        // Helper to render a section for a given period/tax
        const renderSummarySection = (periodLabel, income, expenses, discretionary, taxLabel) => (
            <div className={styles.summarySection + 'noBorder'}>
                <div className={styles.overviewTitle} >
                    {periodLabel} {taxLabel ? `(${taxLabel})` : ''}
                </div>
                <div className={styles.summaryRow}>
                    <span>Income:</span>
                    <strong>{format(income)}</strong>
                </div>
                <div className={styles.summaryRow}>
                    <span>Expenses:</span>
                    <strong>{format(expenses)}</strong>
                </div>
                <div className={styles.summaryRow}>
                    <span>Discretionary:</span>
                    <strong className={discretionary < 0 ? styles.negative : ''}>{format(discretionary)}</strong>
                </div>
            </div>
        );

        const renderTabButtons = () => (
            <div className={styles.smallAppTabButtons}>
                <Button
                    tab
                    active={activeInternalTab === 'summary'}
                    onClick={() => setActiveInternalTab('summary')}
                >
                    Overview
                </Button>
                <Button
                    tab
                    active={activeInternalTab === 'expenses'}
                    onClick={() => setActiveInternalTab('expenses')}
                >
                    Expenses
                </Button>
            </div>
        );

        // Use Section for all summary content
        return (
            <Section
                header={
                    <SectionHeader
                        left={smallApp ? renderTabButtons() : null}
                        title="Summary"
                        right={(!smallApp || activeInternalTab === 'summary') ? Controls : null}
                    />
                }
            >
                <div className={styles.summaryBothGrid}>
                    {/* Left: Monthly */}
                    {showMonthly && (
                        <div className={styles.summaryBothCol}>
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
                        <div className={styles.summaryBothCol}>
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
        const renderTabButtons = () => (
            <div className={styles.smallAppTabButtons}>
                <Button
                    tab
                    active={activeInternalTab === 'summary'}
                    onClick={() => setActiveInternalTab('summary')}
                >
                    Overview
                </Button>
                <Button
                    tab
                    active={activeInternalTab === 'expenses'}
                    onClick={() => setActiveInternalTab('expenses')}
                >
                    Expenses
                </Button>
            </div>
        );

        return (
            <Section
                header={
                    <SectionHeader
                        left={smallApp ? renderTabButtons() : null}
                        title="Monthly Expenses"
                        right={null}
                    />
                }
            >
                <ExpensesSection
                    expenses={budget.monthlyExpenses}
                    smallApp={smallApp}
                    activeInternalTab={activeInternalTab}
                    setActiveInternalTab={setActiveInternalTab}
                />
            </Section>
        );
    };

    const showMonthly = period === 'monthly' || period === 'both';
    const showAnnual = period === 'annual' || period === 'both';

    return (
        <div className={`${styles.budgetContentWrapper} ${smallApp ? 'smallApp' : ''}`} ref={budgetOverviewRef}>
            {smallApp ? (
                <div className={styles.smallAppTabsContainer}>
                    {activeInternalTab === 'summary' && <SummarySectionContent />}
                    {activeInternalTab === 'expenses' && <ExpensesSectionWrapper />}
                </div>
            ) : (
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