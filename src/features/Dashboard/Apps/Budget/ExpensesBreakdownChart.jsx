import React, { useState, useMemo, memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Section from "../../../../components/ui/Section/Section";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import ChartSummary from "../../../../components/ui/Chart/ChartSummary";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import budgetStyles from "./budget.module.css";

const COLORS = [
  "var(--chart-color-1)",
  "var(--chart-color-2)",
  "var(--chart-color-3)",
  "var(--chart-color-4)",
  "var(--chart-color-5)",
  "var(--chart-color-6)",
  "var(--chart-color-7)",
  "var(--chart-color-8)",
];

const ExpensesBreakdownChart = memo(
  ({ budget, smallApp }) => {
    const [viewMode, setViewMode] = useState("individual");

    // Memoize expensive chart data calculations with proper 2 decimal place formatting
    const chartData = useMemo(() => {
      const expenses = budget?.monthlyExpenses || [];
      const totalBudget = budget?.monthlyAfterTax || 0;

      if (viewMode === "individual") {
        return expenses
          .filter((expense) => expense.cost > 0)
          .map((expense) => {
            const cost = parseFloat(expense.cost) || 0;
            const percentage = totalBudget > 0 ? (cost / totalBudget) * 100 : 0;

            return {
              name: expense.name,
              value: cost,
              percentage: parseFloat(percentage.toFixed(2)), // Format to 2 decimal places
            };
          })
          .sort((a, b) => b.value - a.value);
      } else {
        // Category grouping logic with proper formatting
        const categoryTotals = expenses.reduce((acc, expense) => {
          const category = expense.category || "other";
          const cost = parseFloat(expense.cost) || 0;
          acc[category] = (acc[category] || 0) + cost;
          return acc;
        }, {});

        return Object.entries(categoryTotals)
          .map(([category, value]) => {
            const percentage =
              totalBudget > 0 ? (value / totalBudget) * 100 : 0;

            return {
              name: category,
              value: value,
              percentage: parseFloat(percentage.toFixed(2)), // Format to 2 decimal places
            };
          })
          .sort((a, b) => b.value - a.value);
      }
    }, [budget?.monthlyExpenses, budget?.monthlyAfterTax, viewMode]);

    const currentData = chartData;

    // Custom label renderer for the pie chart with 2 decimal place formatting
    const renderLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
      if (percent < 0.02) return null; // Don't show labels for very small slices

      const RADIAN = Math.PI / 180;
      // Increased spacing from pie chart
      const labelRadius = outerRadius + (smallApp ? 25 : 35);
      const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
      const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

      // Format percentage to 2 decimal places
      const formattedPercent = (percent * 100).toFixed(2);

      return (
        <text
          x={x}
          y={y}
          fill="var(--chart-label-text)"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={smallApp ? "var(--font-size-xxxs)" : "var(--font-size-xxs)"}
          fontWeight="var(--font-weight-medium)"
        >
          {name} ({formattedPercent}%)
        </text>
      );
    };

    const totalExpenses = currentData.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const budgetUsedPercentage =
      budget?.monthlyAfterTax > 0
        ? ((totalExpenses / budget?.monthlyAfterTax) * 100).toFixed(2) // Format to 2 decimal places
        : "0.00";
    const discretionaryIncome = (budget?.monthlyAfterTax || 0) - totalExpenses;

    // Create the select menu component using standard styling
    const viewSelectMenu = (
      <div className={sectionStyles.selectGroup}>
        <label htmlFor="view-mode-select" className={sectionStyles.selectLabel}>
          View:
        </label>
        <select
          id="view-mode-select"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className={sectionStyles.baseSelect}
        >
          <option value="individual">Individual Expenses</option>
          <option value="category">By Category</option>
        </select>
      </div>
    );

    const summaryItems = [
      {
        label: "Budget Used",
        value: `${budgetUsedPercentage}%`, // Now formatted to 2 decimal places
        valueClass:
          parseFloat(budgetUsedPercentage) > 90 ? "negative" : "positive",
      },
      {
        label: "Discretionary",
        value: `$${discretionaryIncome.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        valueClass: discretionaryIncome >= 0 ? "positive" : "negative",
      },
      {
        label: "Total Expenses",
        value: `$${totalExpenses.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        valueClass: "neutral",
      },
    ];

    return (
      <Section
        header={
          <SectionHeader title="Expenses Breakdown" right={viewSelectMenu} />
        }
        className={budgetStyles.chartSection}
      >
        <ChartSummary items={summaryItems} />
        <div className={budgetStyles.chartContainer}>
          {currentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={smallApp ? 300 : 380}>
              <PieChart
                margin={{
                  top: 20,
                  right: smallApp ? 60 : 80,
                  bottom: smallApp ? 60 : 80,
                  left: smallApp ? 60 : 80,
                }}
              >
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={smallApp ? "35%" : "40%"}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={0}
                  isAnimationActive={false}
                >
                  {currentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    name,
                  ]}
                  contentStyle={{
                    background: "var(--color-secondary)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-on-secondary)",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "var(--font-size-xs)",
                  }}
                  itemStyle={{
                    color: "var(--text-on-secondary)",
                    fontSize: "var(--font-size-xs)",
                  }}
                  animationDuration={0}
                  isAnimationActive={false}
                />
                <Legend
                  verticalAlign="bottom"
                  height={smallApp ? 40 : 50}
                  wrapperStyle={{
                    paddingTop: smallApp ? "20px" : "30px",
                    fontSize: smallApp ? "0.65rem" : "0.75rem",
                    color: "var(--chart-label-text)",
                    lineHeight: "1.2",
                  }}
                  iconType="circle"
                  iconSize={smallApp ? 8 : 10}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={budgetStyles.noChartData}>
              No expense data to display. Add some expenses to see the
              breakdown.
            </div>
          )}
        </div>
      </Section>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      prevProps.smallApp === nextProps.smallApp &&
      prevProps.budget?.monthlyAfterTax === nextProps.budget?.monthlyAfterTax &&
      prevProps.budget?.monthlyExpenses?.length ===
        nextProps.budget?.monthlyExpenses?.length &&
      JSON.stringify(prevProps.budget?.monthlyExpenses) ===
        JSON.stringify(nextProps.budget?.monthlyExpenses)
    );
  }
);

export default ExpensesBreakdownChart;
