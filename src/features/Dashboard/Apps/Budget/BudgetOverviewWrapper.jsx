// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React, { useState } from "react";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import SummaryTab from "./SummaryTab";
import ExpensesTab from "./ExpensesTab";
import TwoColumnLayout from "../../../../components/ui/Section/TwoColumnLayout";
import BudgetControlPanel from "./BudgetControlPanel";
import budgetStyles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import {
  getNetWorth,
  getTotalCash,
  getTotalAssets,
  getTotalLiabilities,
} from "../../../../utils/calculations/financialCalculations";
import SnapshotRow from "../../../../components/ui/Snapshot/SnapshotRow";

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
  const { data, userSignedIn } = useFinancialData();
  const accounts = data.accounts;
  const budget = data.budget;
  const [period, setPeriod] = useState("both");
  const [tax, setTax] = useState("both");

  const monthlyIncomeAT = budget.monthlyAfterTax || 0;
  const annualIncomeAT =
    monthlyIncomeAT * 12 +
    (budget.income.bonusAfterTax || 0) +
    (budget.income.additionalIncomeAfterTax || 0);

  const monthlyIncomePT =
    budget.income.type === "salary"
      ? (budget.income.annualPreTax || 0) / 12
      : ((budget.income.hourlyRate || 0) *
          (budget.income.expectedAnnualHours || 0)) /
        12;

  const annualIncomePT =
    budget.income.type === "salary"
      ? budget.income.annualPreTax || 0
      : (budget.income.hourlyRate || 0) *
        (budget.income.expectedAnnualHours || 0);

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
    period,
    setPeriod,
    tax,
    setTax,
    monthlyIncomeAT,
    annualIncomeAT,
    monthlyIncomePT,
    annualIncomePT,
    monthlyExpenses,
    annualExpenses,
    monthlyDiscretionaryAT,
    annualDiscretionaryAT,
    monthlyDiscretionaryPT,
    annualDiscretionaryPT,
  };

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
      <SnapshotRow items={snapshotItems} small={smallApp} />

      {smallApp ? (
        !activeInnerTabId || activeInnerTabId === "showAll" ? (
          <>
            <SummaryTab {...summaryProps} smallApp={smallApp} />
            <BudgetControlPanel userSignedIn={userSignedIn} />{" "}
            {/* <-- Move here */}
            <ExpensesTab {...expensesProps} smallApp={smallApp} />
          </>
        ) : activeInnerTabId === "expenses" ? (
          <ExpensesTab {...expensesProps} smallApp={smallApp} />
        ) : (
          <>
            <SummaryTab {...summaryProps} smallApp={smallApp} />
            <BudgetControlPanel userSignedIn={userSignedIn} />{" "}
            {/* <-- Move here */}
          </>
        )
      ) : (
        <TwoColumnLayout
          className={sectionStyles.columns45_55}
          left={
            <>
              <SummaryTab {...summaryProps} smallApp={smallApp} />
              <BudgetControlPanel userSignedIn={userSignedIn} />{" "}
              {/* <-- Move here */}
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
