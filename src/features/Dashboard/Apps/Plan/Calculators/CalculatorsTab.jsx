// src/features/Dashboard/Apps/Plan/Calculators/CalculatorsTab.jsx
import React, { useState } from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import CompoundInterestCalculator from "./CompoundInterestCalculator";
import RetirementCalculator from "./RetirementCalculator";
import LoanCalculator from "./LoanCalculator";
import SavingsGoalCalculator from "./SavingsGoalCalculator";
import planStyles from "../plan.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const CalculatorsTab = ({ smallApp, activeInnerTabId }) => {
  const { data } = useFinancialData();

  // Filter calculators based on activeInnerTabId
  const shouldShowCalculator = (calculatorType) => {
    if (!activeInnerTabId || activeInnerTabId === "showAll") return true;
    return activeInnerTabId === calculatorType;
  };

  const calculators = [
    {
      id: "compound",
      title: "Compound Interest Calculator",
      component: CompoundInterestCalculator,
      show: shouldShowCalculator("compound"),
      description:
        "See how your investments grow over time with compound interest.",
    },
    {
      id: "retirement",
      title: "Retirement Calculator",
      component: RetirementCalculator,
      show: shouldShowCalculator("retirement"),
      description:
        "Plan for retirement based on your current savings and contributions.",
    },
    {
      id: "loan",
      title: "Loan Calculator",
      component: LoanCalculator,
      show: shouldShowCalculator("loan"),
      description: "Calculate loan payments, interest, and payoff scenarios.",
    },
    {
      id: "savings",
      title: "Savings Goal Calculator",
      component: SavingsGoalCalculator,
      show: shouldShowCalculator("savings") || shouldShowCalculator("showAll"),
      description: "Determine how much to save monthly to reach your goals.",
    },
  ];

  const visibleCalculators = calculators.filter((calc) => calc.show);

  return (
    <div className={planStyles.planContentWrapper}>
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Financial Calculators"
              editMode={false}
              editable={false}
            />
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-secondary)",
              }}
            >
              Discretionary Income: $
              {(data.budget?.discretionaryIncome || 0).toLocaleString()}/month
            </div>
          </div>
        }
      >
        <div className={planStyles.calculatorsGrid}>
          {visibleCalculators.map((calculator) => {
            const CalculatorComponent = calculator.component;
            return (
              <CalculatorComponent
                key={calculator.id}
                smallApp={smallApp}
                financialData={data} // Pass financial data to calculators
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
};

export default CalculatorsTab;
