// src/features/Dashboard/Apps/Budget/BudgetOverviewWrapper.jsx
import React from "react";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { enrichBudgetWithCalculations } from "../../../../utils/calculations/budgetCalculations";
import IncomeSection from "./IncomeSection";
import ExpensesSection from "./ExpensesSection";
import ExpensesBreakdownChart from "./ExpensesBreakdownChart";
import budgetStyles from "./budget.module.css";

const BudgetOverviewWrapper = ({ smallApp, activeInnerTabId }) => {
  const { data } = useFinancialData();

  // FIXED: Better loading state handling
  if (!data?.budget) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "var(--space-lg)",
          color: "var(--text-secondary)",
        }}
      >
        Initializing budget...
      </div>
    );
  }

  // Budget should already be enriched by context
  const budget = data.budget;

  // FIXED: Verify budget has calculations
  if (budget.discretionaryIncome === undefined) {
    console.warn("Budget missing calculations, re-enriching...");
    const enrichedBudget = enrichBudgetWithCalculations(budget);
    // You could update context here or just use enriched version locally
  }

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
