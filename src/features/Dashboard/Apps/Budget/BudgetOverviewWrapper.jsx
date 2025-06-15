// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React, { useState } from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import { useFinancialData } from '../../../../contexts/FinancialDataContext';
import SummaryTab from './SummaryTab';
import ExpensesTab from './ExpensesTab';
import TwoColumnLayout from '../../../../components/ui/Section/TwoColumnLayout';
import BudgetControlPanel from './BudgetControlPanel';
import budgetStyles from './budget.module.css';
import sectionStyles from '../../../../components/ui/Section/Section.module.css';
import { getNetWorth, getTotalCash, getTotalAssets, getTotalLiabilities } from '../../../../utils/financialCalculations';

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
    //console.log('BudgetOverviewWrapper rendered with smallApp:', smallApp, 'activeInnerTabId:', activeInnerTabId);
    const { budget, isLoading, error, userSignedIn } = useBudget();
    const { data } = useFinancialData();
    const accounts = data.accounts;
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

    const netWorth = getNetWorth(accounts);
    const totalCash = getTotalCash(accounts);
    const totalAssets = getTotalAssets(accounts);
    const totalDebt = getTotalLiabilities(accounts);

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
    
    // Snapshot row component
    const SnapshotRow = (
        <div className={smallApp ? `${budgetStyles.snapshotRowFull} ${budgetStyles.snapshotRowFullSmall}` : budgetStyles.snapshotRowFull}>
            <div className={smallApp ? `${budgetStyles.snapshotItem} ${budgetStyles.snapshotItemSmall}` : budgetStyles.snapshotItem}>
                <span className={smallApp ? `${budgetStyles.snapshotLabel} ${budgetStyles.snapshotLabelSmall}` : budgetStyles.snapshotLabel}>Net Worth</span>
                <span className={smallApp ? `${budgetStyles.positive} ${budgetStyles.valueSmall}` : budgetStyles.positive + " value"}>
                    ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={smallApp ? `${budgetStyles.snapshotItem} ${budgetStyles.snapshotItemSmall}` : budgetStyles.snapshotItem}>
                <span className={smallApp ? `${budgetStyles.snapshotLabel} ${budgetStyles.snapshotLabelSmall}` : budgetStyles.snapshotLabel}>Cash</span>
                <span className={smallApp ? `${budgetStyles.positive} ${budgetStyles.valueSmall}` : budgetStyles.positive + " value"}>
                    ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={smallApp ? `${budgetStyles.snapshotItem} ${budgetStyles.snapshotItemSmall}` : budgetStyles.snapshotItem}>
                <span className={smallApp ? `${budgetStyles.snapshotLabel} ${budgetStyles.snapshotLabelSmall}` : budgetStyles.snapshotLabel}>Assets</span>
                <span className={smallApp ? `${budgetStyles.positive} ${budgetStyles.valueSmall}` : budgetStyles.positive + " value"}>
                    ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className={smallApp ? `${budgetStyles.snapshotItem} ${budgetStyles.snapshotItemSmall}` : budgetStyles.snapshotItem}>
                <span className={smallApp ? `${budgetStyles.snapshotLabel} ${budgetStyles.snapshotLabelSmall}` : budgetStyles.snapshotLabel}>Liabilities</span>
                <span className={smallApp ? `${budgetStyles.negative} ${budgetStyles.valueSmall}` : budgetStyles.negative + " value"}>
                    ${Math.abs(totalDebt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );

    return (
        <div className={budgetStyles.budgetContentWrapper}>
            {/* Snapshot row is now placed above all content */}
            {SnapshotRow}
            
            {smallApp ? (
                (!activeInnerTabId || activeInnerTabId === 'showAll') ? (
                    <>
                        <SummaryTab {...summaryProps} smallApp={smallApp} />
                        <BudgetControlPanel userSignedIn={userSignedIn} /> {/* <-- Move here */}
                        <ExpensesTab {...expensesProps} smallApp={smallApp} />
                    </>
                ) : activeInnerTabId === 'expenses' ? (
                    <ExpensesTab {...expensesProps} smallApp={smallApp} />
                ) : (
                    <>
                        <SummaryTab {...summaryProps} smallApp={smallApp} />
                        <BudgetControlPanel userSignedIn={userSignedIn} /> {/* <-- Move here */}
                    </>
                )
            ) : (
                <TwoColumnLayout
                    className={sectionStyles.columns45_55}
                    left={
                        <>
                            <SummaryTab {...summaryProps} smallApp={smallApp} />
                            <BudgetControlPanel userSignedIn={userSignedIn} /> {/* <-- Move here */}
                        </>
                    }
                    right={<ExpensesTab {...expensesProps} smallApp={smallApp} />}
                    smallApp={smallApp}
                />
            )}
        </div>
    );
};

export default BudgetOverviewWrapper;