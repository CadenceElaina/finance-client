import React, { useState, useEffect, useRef } from 'react';
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

const SMALL_APP_WIDTH_BREAKPOINT = 1112;
const SMALL_APP_HEIGHT_BREAKPOINT = 552.6;

const Overview = () => {
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('after');

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

    // Show internal tabs if width or height is below breakpoint
    const showInternalTabs =
        (containerSize.width > 0 && containerSize.width < SMALL_APP_WIDTH_BREAKPOINT) ||
        (containerSize.height > 0 && containerSize.height < SMALL_APP_HEIGHT_BREAKPOINT);

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

    // --- UI for summary section (No longer contains BudgetControlPanel) ---
    const SummarySectionContent = () => {
        const format = (val) =>
            `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Helper to render a section for a given period/tax
        const renderSummarySection = (periodLabel, income, expenses, discretionary, taxLabel) => (
            <div style={{ marginBottom: 16, width: '100%' }}>
                <div className={styles.overviewTitle} style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.05em', marginBottom: 4 }}>
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

        if (period === 'both') {
            // Decide which sections to show based on tax
            const showAfter = tax === 'after' || tax === 'both';
            const showPre = tax === 'pre' || tax === 'both';

            return (
                <div className={styles.summarySectionCustom}>
                    <h3>Summary</h3>
                    <div className={styles.summaryBothGrid}>
                        {/* Left: Monthly */}
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
                        {/* Right: Annual */}
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
                    </div>
                </div>
            );
        }

        // Handle single period, but possibly both tax statuses
        if (period === 'monthly' || period === 'annual') {
            let sections = [];

            if (tax === 'after' || tax === 'both') {
                if (period === 'monthly') {
                    sections.push(renderSummarySection(
                        'Monthly',
                        monthlyIncomeAT,
                        monthlyExpenses,
                        monthlyDiscretionaryAT,
                        'After-tax'
                    ));
                } else {
                    sections.push(renderSummarySection(
                        'Annual',
                        annualIncomeAT,
                        annualExpenses,
                        annualDiscretionaryAT,
                        'After-tax'
                    ));
                }
            }
            if (tax === 'pre' || tax === 'both') {
                if (period === 'monthly') {
                    sections.push(renderSummarySection(
                        'Monthly',
                        monthlyIncomePT,
                        monthlyExpenses,
                        monthlyDiscretionaryPT,
                        'Pre-tax'
                    ));
                } else {
                    sections.push(renderSummarySection(
                        'Annual',
                        annualIncomePT,
                        annualExpenses,
                        annualDiscretionaryPT,
                        'Pre-tax'
                    ));
                }
            }

            return (
                <div className={styles.summarySectionCustom}>
                    <h3>Summary</h3>
                    {sections}
                </div>
            );
        }

        return null;
    };

    // --- UI for expenses section ---
    const ExpensesSectionWrapper = () => (
        <ExpensesSection expenses={budget.monthlyExpenses} />
    );

    // --- Controls for period/tax ---
    const Controls = (
        <div className={styles.stackedControls}>
            <div className={styles.stackedButtonGroup}>
                <label htmlFor="period-select" style={{ fontSize: '0.95em', marginBottom: 2 }}>Period</label>
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
                <label htmlFor="tax-select" style={{ fontSize: '0.95em', marginBottom: 2 }}>Tax</label>
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

    return (
        <div
            className={`${styles.budgetContentWrapper} ${showInternalTabs ? styles.smallApp : ''}`}
            ref={budgetOverviewRef}
        >
            {/* Main content area: either grid or internal tabs */}
            {showInternalTabs ? (
                <div className={styles.smallAppTabsContainer}>
                    <div className={styles.smallAppTabHeaderRow}>
                        <div className={styles.smallAppTabButtons}>
                            <button
                                className={`${styles.smallAppTabButton} ${activeInternalTab === 'summary' ? styles.active : ''}`}
                                onClick={() => setActiveInternalTab('summary')}
                            >
                                Overview
                            </button>
                            <button
                                className={`${styles.smallAppTabButton} ${activeInternalTab === 'expenses' ? styles.active : ''}`}
                                onClick={() => setActiveInternalTab('expenses')}
                            >
                                Expenses
                            </button>
                        </div>
                        <div className={styles.smallAppTabControls}>
                            {Controls}
                        </div>
                    </div>
                    <div className={styles.smallAppTabContent}>
                        {activeInternalTab === 'summary' && <SummarySectionContent />}
                        {activeInternalTab === 'expenses' && <ExpensesSectionWrapper />}
                    </div>
                </div>
            ) : (
                <div className={styles.overviewGridCustom}>
                    {/* Left: Overall Summary (now with Controls inside this section too, for layout consistency) */}
                    <div>
                        {Controls}
                        <SummarySectionContent />
                    </div>
                    {/* Right: Expenses */}
                    <ExpensesSectionWrapper />
                </div>
            )}
            {/* BudgetControlPanel is now a direct child of budgetContentWrapper, always visible */}
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default Overview;