// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React from "react";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import IncomeSection from "./IncomeSection";
import ExpensesSection from "./ExpensesSection";
import ExpensesBreakdownChart from "./ExpensesBreakdownChart";
import budgetStyles from "./budget.module.css";

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
  const { data } = useFinancialData();

  // Ensure budget always has a default structure
  const budget = data?.budget || {
    income: {},
    monthlyExpenses: [],
    monthlyAfterTax: 0,
    annualAfterTax: 0,
    totalMonthlyExpenses: 0,
  };

  if (smallApp) {
    // Small app: Show sections based on inner tab selection
    switch (activeInnerTabId) {
      case "income":
        return <IncomeSection budget={budget} smallApp={smallApp} />;
      case "expenses":
        return <ExpensesSection budget={budget} smallApp={smallApp} />;
      case "summary":
        return <ExpensesBreakdownChart budget={budget} smallApp={smallApp} />;
      default: // "showAll"
        return (
          <div className={budgetStyles.budgetTwoColumnLayout}>
            {/* Left: Expenses Breakdown Chart */}
            <div className={budgetStyles.leftColumn}>
              <ExpensesBreakdownChart budget={budget} smallApp={smallApp} />
            </div>
            {/* Right: Income above Expenses */}
            <div className={budgetStyles.rightColumn}>
              <div className={budgetStyles.incomeSectionWrapper}>
                <IncomeSection budget={budget} smallApp={smallApp} />
              </div>
              <div className={budgetStyles.expensesSectionWrapper}>
                <ExpensesSection budget={budget} smallApp={smallApp} />
              </div>
            </div>
          </div>
        );
    }
  }

  // Base/Large app: Show two-column layout
  return (
    <div className={budgetStyles.budgetTwoColumnLayout}>
      {/* Left: Expenses Breakdown Chart */}
      <div className={budgetStyles.leftColumn}>
        <ExpensesBreakdownChart budget={budget} smallApp={smallApp} />
      </div>
      {/* Right: Income above Expenses */}
      <div className={budgetStyles.rightColumn}>
        <div className={budgetStyles.incomeSectionWrapper}>
          <IncomeSection budget={budget} smallApp={smallApp} />
        </div>
        <div className={budgetStyles.expensesSectionWrapper}>
          <ExpensesSection budget={budget} smallApp={smallApp} />
        </div>
      </div>
    </div>
  );
};

export default BudgetOverviewWrapper;
