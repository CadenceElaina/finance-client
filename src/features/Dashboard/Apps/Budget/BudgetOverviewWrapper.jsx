// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React from "react";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import SummaryTab from "./SummaryTab";
import ExpensesTab from "./ExpensesTab";
import TwoColumnLayout from "../../../../components/ui/Section/TwoColumnLayout";
import budgetStyles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import {
  getNetWorth,
  getTotalCash,
  getTotalAssets,
  getTotalLiabilities,
} from "../../../../utils/calculations/financialCalculations";

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
  const { data, userSignedIn } = useFinancialData();
  const accounts = data.accounts;
  const budget = data.budget; // This will have the recalculated fields

  // Use the calculated values from the budget object
  const monthlyIncomeAT = budget.monthlyAfterTax || 0;
  const annualIncomeAT = budget.annualAfterTax || 0;
  const monthlyIncomePT = budget.monthlyPreTax || 0;
  const annualIncomePT = budget.annualPreTax || 0;
  const monthlyExpenses = budget.totalMonthlyExpenses || 0; // This should update when expenses change
  const annualExpenses = monthlyExpenses * 12;

  const monthlyDiscretionaryAT = monthlyIncomeAT - monthlyExpenses;
  const annualDiscretionaryAT = annualIncomeAT - annualExpenses;
  const monthlyDiscretionaryPT = monthlyIncomePT - monthlyExpenses;
  const annualDiscretionaryPT = annualIncomePT - annualExpenses;

  const netWorth = getNetWorth(accounts);
  const totalCash = getTotalCash(accounts);
  const totalAssets = getTotalAssets(accounts);
  const totalDebt = getTotalLiabilities(accounts);

  // Remove the summaryProps object and pass individual props
  const expensesProps = {
    expenses: budget.monthlyExpenses,
    smallApp: smallApp,
  };

  const snapshotItems = [
    {
      label: "Net Worth",
      value: `$${netWorth.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Cash",
      value: `$${totalCash.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Assets",
      value: `$${totalAssets.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Liabilities",
      value: `$${Math.abs(totalDebt).toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "negative",
    },
  ];

  return (
    <div className={budgetStyles.budgetContentWrapper}>
      {smallApp ? (
        // Small app: Show either all content or specific tab based on activeInnerTabId
        !activeInnerTabId || activeInnerTabId === "showAll" ? (
          <>
            <SummaryTab smallApp={smallApp} />
            <ExpensesTab
              expenses={budget.monthlyExpenses}
              smallApp={smallApp}
            />
          </>
        ) : activeInnerTabId === "expenses" ? (
          <ExpensesTab expenses={budget.monthlyExpenses} smallApp={smallApp} />
        ) : (
          <SummaryTab smallApp={smallApp} />
        )
      ) : (
        // Base/Large app: Always show two-column layout
        <TwoColumnLayout
          className={sectionStyles.columns45_55}
          left={<SummaryTab smallApp={smallApp} />}
          right={
            <ExpensesTab
              expenses={budget.monthlyExpenses}
              smallApp={smallApp}
            />
          }
          smallApp={smallApp}
        />
      )}
    </div>
  );
};

export default BudgetOverviewWrapper;
