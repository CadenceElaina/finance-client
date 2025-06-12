// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import SummaryTab from './SummaryTab';
import ExpensesTab from './ExpensesTab';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import BudgetControlPanel from './BudgetControlPanel';
import budgetStyles from './budget.module.css'; // FIX: Changed 'styles' to 'budgetStyles' here
import sectionStyles from '../../../../components/ui/Section/Section.module.css'; // Import the new styles for TwoColumnLayout

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
    console.log('BudgetOverviewWrapper rendered with smallApp:', smallApp, 'activeInnerTabId:', activeInnerTabId);
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const [period, setPeriod] = useState('both');
    const [tax, setTax] = useState('both');

    if (isLoading) return <div className={budgetStyles.budgetContentWrapper}>Loading budget overview...</div>;
    if (error) return <div className={`${budgetStyles.budgetContentWrapper} ${budgetStyles.error}`}>{error}</div>;
    if (!budget) return <div className={budgetStyles.budgetContentWrapper}>No budget data available.</div>;

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
        smallApp: smallApp, // Pass smallApp prop to ExpensesSection if it needs internal adjustments
    };

    return (
        <div className={budgetStyles.budgetContentWrapper}> {/* FIX: Changed from styles to budgetStyles */}
               {smallApp ? (
                (!activeInnerTabId || activeInnerTabId === 'showAll') ? (
                    <>
                        <SummaryTab {...summaryProps} smallApp={smallApp} />
                        <ExpensesTab {...expensesProps} smallApp={smallApp} />
                    </>
                ) : activeInnerTabId === 'expenses' ? (
                    <ExpensesTab {...expensesProps} smallApp={smallApp} />
                ) : (
                    <SummaryTab {...summaryProps} smallApp={smallApp} />
                )
            ) : (
                <TwoColumnLayout
                    className={sectionStyles.columns45_55} // Apply the new class here
                    left={<SummaryTab {...summaryProps} smallApp={smallApp} />}
                    right={<ExpensesTab {...expensesProps} smallApp={smallApp} />}
                    smallApp={smallApp}
                />
            )}
            <BudgetControlPanel userSignedIn={userSignedIn} />
        </div>
    );
};

export default BudgetOverviewWrapper;