// src/features/Dashboard/Apps/Budget/BudgetSummarySection.jsx
import React from "react";
import Section from "../../../../components/ui/Section/Section";
import budgetStyles from "./budget.module.css";

const BudgetSummarySection = ({ budget, smallApp }) => {
  const monthlyIncomeAT = budget?.monthlyAfterTax || 0;
  const monthlyExpenses = budget?.totalMonthlyExpenses || 0;
  const monthlyDiscretionary = monthlyIncomeAT - monthlyExpenses;

  const annualIncomeAT = budget?.annualAfterTax || 0;
  const annualExpenses = monthlyExpenses * 12;
  const annualDiscretionary = annualIncomeAT - annualExpenses;

  const discretionaryRate =
    monthlyIncomeAT > 0 ? (monthlyDiscretionary / monthlyIncomeAT) * 100 : 0;
  const expenseRate =
    monthlyIncomeAT > 0 ? (monthlyExpenses / monthlyIncomeAT) * 100 : 0;

  return (
    <Section
      title="Budget Summary"
      className={`${budgetStyles.summarySection} ${budgetStyles.compactSection}`}
      smallApp={smallApp}
    >
      <div className={budgetStyles.accountingTable}>
        <table
          className={`${budgetStyles.accountingTableGrid} ${budgetStyles.compactTable}`}
        >
          <thead>
            <tr>
              <th className={budgetStyles.descriptionColumn}>Description</th>
              <th className={budgetStyles.amountColumn}>Monthly</th>
              <th className={budgetStyles.amountColumn}>Annual</th>
              <th className={budgetStyles.percentColumn}>Income</th>
            </tr>
          </thead>
          <tbody>
            <tr className={budgetStyles.incomeRow}>
              <td className={budgetStyles.incomeLabel}>
                Total Income (After Tax)
              </td>
              <td className={budgetStyles.incomeAmount}>
                ${monthlyIncomeAT.toLocaleString()}
              </td>
              <td className={budgetStyles.incomeAmount}>
                ${annualIncomeAT.toLocaleString()}
              </td>
              <td className={budgetStyles.percentAmount}>100.0%</td>
            </tr>
            <tr className={budgetStyles.expenseRow}>
              <td className={budgetStyles.expenseLabel}>Total Expenses</td>
              <td className={budgetStyles.expenseAmount}>
                (${monthlyExpenses.toLocaleString()})
              </td>
              <td className={budgetStyles.expenseAmount}>
                (${annualExpenses.toLocaleString()})
              </td>
              <td className={budgetStyles.percentAmount}>
                ({expenseRate.toFixed(1)}%)
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className={budgetStyles.discretionaryRow}>
              <td className={budgetStyles.discretionaryLabel}>
                <strong>Discretionary Income</strong>
              </td>
              <td
                className={`${budgetStyles.discretionaryAmount} ${
                  monthlyDiscretionary >= 0
                    ? budgetStyles.positive
                    : budgetStyles.negative
                }`}
              >
                <strong>
                  {monthlyDiscretionary >= 0 ? "$" : "($"}
                  {Math.abs(monthlyDiscretionary).toLocaleString()}
                  {monthlyDiscretionary < 0 ? ")" : ""}
                </strong>
              </td>
              <td
                className={`${budgetStyles.discretionaryAmount} ${
                  annualDiscretionary >= 0
                    ? budgetStyles.positive
                    : budgetStyles.negative
                }`}
              >
                <strong>
                  {annualDiscretionary >= 0 ? "$" : "($"}
                  {Math.abs(annualDiscretionary).toLocaleString()}
                  {annualDiscretionary < 0 ? ")" : ""}
                </strong>
              </td>
              <td
                className={`${budgetStyles.percentAmount} ${
                  discretionaryRate >= 0
                    ? budgetStyles.positive
                    : budgetStyles.negative
                }`}
              >
                <strong>{discretionaryRate.toFixed(1)}%</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Section>
  );
};

export default BudgetSummarySection;
