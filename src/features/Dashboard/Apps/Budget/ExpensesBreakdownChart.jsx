import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import Section from "../../../../components/ui/Section/Section";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
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

const CATEGORY_LABELS = {
  required: "Required",
  flexible: "Flexible",
  "non-essential": "Non-essential",
};

const ExpensesBreakdownChart = ({ budget, smallApp }) => {
  const expenses = budget?.monthlyExpenses || [];
  const totalBudget = budget?.monthlyAfterTax || 0;
  const [viewMode, setViewMode] = useState("individual"); // "individual" or "category"

  // Create pie chart data for individual expenses (as percentage of total budget)
  const individualPieData = useMemo(() => {
    return expenses
      .filter((expense) => expense.cost > 0)
      .map((expense) => ({
        name: expense.name,
        value: expense.cost,
        percentage: totalBudget > 0 ? ((expense.cost / totalBudget) * 100).toFixed(1) : 0,
        category: expense.category || "required",
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [expenses, totalBudget]);

  // Create pie chart data grouped by category (as percentage of total budget)
  const categoryPieData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || "required";
      acc[category] = (acc[category] || 0) + (expense.cost || 0);
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: CATEGORY_LABELS[category] || category,
        value,
        percentage: totalBudget > 0 ? ((value / totalBudget) * 100).toFixed(1) : 0,
        category,
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [expenses, totalBudget]);

  const currentData = viewMode === "individual" ? individualPieData : categoryPieData;

  // Custom label renderer for the pie chart
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
    value,
    percentage,
  }) => {
    if (percent < 0.03) return null; // Hide labels for slices < 3%

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + (smallApp ? 25 : 35);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";

    return (
      <text
        x={x}
        y={y}
        fill="var(--chart-label-text)"
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={smallApp ? "9px" : "11px"}
        fontWeight="500"
      >
        {`${name}`}
        <tspan x={x} dy="12" fontSize={smallApp ? "8px" : "10px"} opacity="0.8">
          {`${percentage}% of budget`}
        </tspan>
      </text>
    );
  };

  const totalExpenses = currentData.reduce((sum, item) => sum + item.value, 0);
  const budgetUsedPercentage = totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(1) : 0;
  const discretionaryIncome = totalBudget - totalExpenses;

  // Create the select menu component
  const viewSelectMenu = (
    <div className={budgetStyles.selectGroup}>
      <label htmlFor="view-mode-select" className={budgetStyles.selectLabel}>
        View:
      </label>
      <select
        id="view-mode-select"
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value)}
        className={budgetStyles.chartSelect}
      >
        <option value="individual">Individual Expenses</option>
        <option value="category">By Category</option>
      </select>
    </div>
  );

  return (
    <Section
      header={
        <SectionHeader
          title="Expenses Breakdown"
          right={viewSelectMenu}
        />
      }
      className={budgetStyles.chartSection}
      smallApp={smallApp}
    >
      {/* Summary stats ABOVE chart */}
      {totalExpenses > 0 && (
        <div className={budgetStyles.chartSummaryTop}>
          <div className={budgetStyles.summaryItem}>
            <span className={budgetStyles.summaryLabel}>Monthly Budget:</span>
            <span className={budgetStyles.summaryValue}>
              ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className={budgetStyles.summaryItem}>
            <span className={budgetStyles.summaryLabel}>Used:</span>
            <span className={budgetStyles.summaryValue}>
              ${totalExpenses.toLocaleString()} ({budgetUsedPercentage}%)
            </span>
          </div>
          <div className={budgetStyles.summaryItem}>
            <span className={budgetStyles.summaryLabel}>Discretionary:</span>
            <span className={`${budgetStyles.summaryValue} ${
              discretionaryIncome >= 0 ? budgetStyles.positive : budgetStyles.negative
            }`}>
              ${discretionaryIncome.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className={budgetStyles.chartContainer}>
        {currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={smallApp ? 200 : 280}>
            <PieChart>
              <Pie
                data={currentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={smallApp ? "60%" : "65%"}
                innerRadius="35%"
                label={renderLabel}
                labelLine={false}
              >
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `$${value.toLocaleString()}`,
                  `${name} (${props.payload.percentage}% of budget)`,
                ]}
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--border-light)",
                  color: "var(--chart-tooltip-text)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: "var(--font-size-xs)",
                }}
              />
              <Legend
                align="center"
                verticalAlign="bottom"
                layout="horizontal"
                iconSize={6}
                wrapperStyle={{
                  fontSize: smallApp ? "0.55rem" : "0.65rem",
                  color: "var(--chart-label-text)",
                  paddingTop: smallApp ? "4px" : "8px",
                  lineHeight: "1.2",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={budgetStyles.noChartData}>No expenses to display</div>
        )}
      </div>
    </Section>
  );
};

export default ExpensesBreakdownChart;
