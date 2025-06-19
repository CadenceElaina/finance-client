import React, { useMemo } from "react";
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

const BudgetChartsTab = ({ expenses, smallApp }) => {
  // Pie data for each expense (by name)
  const expensePieData = useMemo(() => {
    return expenses.map((exp) => ({
      name: exp.name,
      value: Number(exp.cost) || 0,
    }));
  }, [expenses]);

  const totalExpenses = expensePieData.reduce((sum, d) => sum + d.value, 0);

  // Pie data for category breakdown
  const categoryPieData = useMemo(() => {
    const totals = {};
    expenses.forEach((exp) => {
      if (!totals[exp.category]) totals[exp.category] = 0;
      totals[exp.category] += Number(exp.cost) || 0;
    });
    return Object.entries(totals).map(([cat, value], idx) => ({
      name: CATEGORY_LABELS[cat] || cat,
      value,
      color: COLORS[idx % COLORS.length],
    }));
  }, [expenses]);

  const totalByCategory = categoryPieData.reduce((sum, d) => sum + d.value, 0);

  function renderPieLabel({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
    value,
    index,
  }) {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";
    const percentDisplay = ((percent || 0) * 100).toFixed(1);

    return (
      <text
        x={x}
        y={y}
        fill="var(--chart-label-text)"
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize="var(--font-size-xxs)"
        style={{ fontWeight: 500, pointerEvents: "none" }}
      >
        {`${name} (${percentDisplay}%)`}
      </text>
    );
  }

  return (
    <div
      className={`${budgetStyles.budgetChartsTabContainer} ${
        smallApp ? budgetStyles.smallApp : ""
      }`}
    >
      <Section
        className={budgetStyles.budgetChartsTabSection}
        header={<SectionHeader title="Expenses by Name" />}
      >
        <div
          className={`${budgetStyles.budgetChartsTabChart} ${
            smallApp ? budgetStyles.smallApp : ""
          }`}
        >
          {expensePieData.length > 0 && totalExpenses > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={expensePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={smallApp ? 60 : 90}
                  label={renderPieLabel}
                >
                  {expensePieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}`,
                    name,
                  ]}
                  contentStyle={{
                    background: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--border-light)",
                    color: "var(--chart-tooltip-text)",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "var(--font-size-xxs)",
                  }}
                  itemStyle={{
                    color: "var(--chart-tooltip-text)",
                    fontSize: "var(--font-size-xxs)",
                  }}
                />
                <Legend
                  align="center"
                  verticalAlign="bottom"
                  layout="horizontal"
                  wrapperStyle={{
                    color: "var(--chart-label-text)",
                    fontSize: smallApp ? "0.65rem" : "var(--font-size-xxs)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={budgetStyles.noChartData}>
              No expenses to display.
            </div>
          )}
        </div>
      </Section>
      <Section
        className={budgetStyles.budgetChartsTabSection}
        header={<SectionHeader title="Category Breakdown" />}
      >
        <div
          className={`${budgetStyles.budgetChartsTabChart} ${
            smallApp ? budgetStyles.smallApp : ""
          }`}
        >
          {categoryPieData.length > 0 && totalByCategory > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={smallApp ? 60 : 90}
                  label={renderPieLabel}
                >
                  {categoryPieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}`,
                    name,
                  ]}
                  contentStyle={{
                    background: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--border-light)",
                    color: "var(--chart-tooltip-text)",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "var(--font-size-xxs)",
                  }}
                  itemStyle={{
                    color: "var(--chart-tooltip-text)",
                    fontSize: "var(--font-size-xxs)",
                  }}
                />
                <Legend
                  align="center"
                  verticalAlign="bottom"
                  layout="horizontal"
                  wrapperStyle={{
                    color: "var(--chart-label-text)",
                    fontSize: smallApp ? "0.65rem" : "var(--font-size-xxs)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={budgetStyles.noChartData}>
              No expenses to display.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default BudgetChartsTab;
