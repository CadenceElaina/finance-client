// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import SummarySection from './SummarySection'; // Correctly imports SummarySection
import ExpensesSection from './ExpensesSection';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import BudgetControlPanel from './BudgetControlPanel';
import styles from './budget.module.css';

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
    console.log('BudgetOverviewWrapper rendered with smallApp:', smallApp, 'activeInnerTabId:', activeInnerTabId);
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('both');

    if (isLoading) return <div className={styles.budgetContentWrapper}>Loading budget overview...</div>;
    if (error) return <div className={`${styles.budgetContentWrapper} ${styles.error}`}>{error}</div>;
    if (!budget) return <div className={styles.budgetContentWrapper}>No budget data available.</div>;

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
    const annualDiscretionaryAT = annualIncomeAT - annualExpenses;
    const monthlyDiscretionaryPT = monthlyIncomePT - monthlyExpenses;
    const annualDiscretionaryPT = annualIncomePT - annualExpenses;

    const summaryProps = {
        period, setPeriod, tax, setTax,
        monthlyIncomeAT, annualIncomeAT, monthlyIncomePT, annualIncomePT,
        monthlyExpenses, annualExpenses,
        monthlyDiscretionaryAT, annualDiscretionaryAT,
        monthlyDiscretionaryPT, annualDiscretionaryPT
    };

    const expensesProps = {
        expenses: budget.monthlyExpenses,
        smallApp: smallApp,
    };

    return (
        <div className={styles.budgetContentWrapper}>
            {smallApp ? (
                // Small app: show both if "showAll" or no inner tab, else just one section
                (!activeInnerTabId || activeInnerTabId === 'showAll') ? (
                    <>
                        <SummarySection {...summaryProps} />
                        <ExpensesSection {...expensesProps} />
                    </>
                ) : activeInnerTabId === 'expenses' ? (
                    <ExpensesSection {...expensesProps} />
                ) : (
                    <SummarySection {...summaryProps} />
                )
            ) : (
                // Large app: always show both, side by side
                <TwoColumnLayout
                    left={<SummarySection {...summaryProps} />}
                    right={<ExpensesSection {...expensesProps} />}
                    smallApp={false}
                />
            )}
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default BudgetOverviewWrapper;