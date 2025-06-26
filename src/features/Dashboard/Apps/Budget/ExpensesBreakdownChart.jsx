import React, { useState, useMemo, memo, useCallback } from "react";
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
              percentage: parseFloat(percentage.toFixed(2)),
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
              percentage: parseFloat(percentage.toFixed(2)),
            };
          })
          .sort((a, b) => b.value - a.value);
      }
    }, [budget?.monthlyExpenses, budget?.monthlyAfterTax, viewMode]);

    // Process data similar to AllocationTab - group small segments
    const processedChartData = useMemo(() => {
      const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
      const threshold = totalValue * 0.02; // 2% threshold
      const mainSegments = chartData.filter((item) => item.value >= threshold);
      const smallSegments = chartData.filter((item) => item.value < threshold);

      if (smallSegments.length > 0 && mainSegments.length > 0) {
        const otherValue = smallSegments.reduce(
          (sum, item) => sum + item.value,
          0
        );
        const otherPercentage =
          totalValue > 0 ? (otherValue / totalValue) * 100 : 0;
        return [
          ...mainSegments,
          {
            name: "Other",
            value: otherValue,
            percentage: parseFloat(otherPercentage.toFixed(2)),
            isOther: true,
          },
        ];
      }

      return chartData;
    }, [chartData]);

    // Improved custom label renderer similar to AllocationTab
    const renderCustomLabel = useCallback(
      ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
        name,
        value,
        index,
      }) => {
        // Don't show labels for very small segments or if there are too many segments
        if (percent < 0.05 || processedChartData.length > 6) return null;

        const RADIAN = Math.PI / 180;
        const labelRadius = outerRadius + (smallApp ? 12 : 20);
        const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        const textAnchor = x > cx ? "start" : "end";
        const finalX = x + (x > cx ? 3 : -3);

        // Truncate long names for better fit
        const displayName =
          name.length > (smallApp ? 10 : 15)
            ? name.substring(0, smallApp ? 10 : 15) + "..."
            : name;

        return (
          <text
            x={finalX}
            y={y}
            fill="var(--chart-label-text)"
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={smallApp ? "10px" : "11px"}
            fontWeight="500"
          >
            <tspan x={finalX} dy={0}>
              {displayName}
            </tspan>
            <tspan x={finalX} dy={12}>
              {(percent * 100).toFixed(1)}%
            </tspan>
          </text>
        );
      },
      [smallApp, processedChartData.length]
    );

    // Custom legend renderer for better control
    const renderLegend = useCallback(
      (props) => {
        const { payload } = props;
        if (!payload || payload.length === 0) return null;

        const totalValue = processedChartData.reduce(
          (sum, item) => sum + item.value,
          0
        );
        const itemsPerRow = smallApp ? 1 : 2;
        const legendItems = [];

        for (let i = 0; i < payload.length; i += itemsPerRow) {
          const rowItems = payload.slice(i, i + itemsPerRow);
          legendItems.push(
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: smallApp ? "flex-start" : "space-between",
                marginBottom: "4px",
                gap: smallApp ? "0" : "16px",
              }}
            >
              {rowItems.map((entry, index) => {
                const percentage = (
                  (entry.payload.value / totalValue) *
                  100
                ).toFixed(1);
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: smallApp ? "1" : "0 0 48%",
                      fontSize: smallApp ? "10px" : "11px",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: entry.color,
                        marginRight: "6px",
                        borderRadius: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.value} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div
            style={{
              padding: smallApp ? "8px 12px" : "12px 16px",
              backgroundColor: "var(--surface-light)",
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--border-light)",
              margin: smallApp ? "8px 0 0 0" : "12px 0 0 0",
            }}
          >
            {legendItems}
          </div>
        );
      },
      [smallApp, processedChartData]
    );

    // Determine chart dimensions based on app size and data
    const chartDimensions = useMemo(() => {
      const hasLegend = processedChartData.length > 6;
      const baseHeight = smallApp ? 180 : 220;
      const legendHeight = hasLegend ? (smallApp ? 80 : 100) : 0;

      return {
        chartHeight: baseHeight,
        totalHeight: baseHeight + legendHeight,
        pieRadius: smallApp ? 65 : 85,
        showLabels: processedChartData.length <= 6,
        showLegend: hasLegend,
      };
    }, [smallApp, processedChartData.length]);

    const totalExpenses = processedChartData.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const budgetUsedPercentage =
      budget?.monthlyAfterTax > 0
        ? ((totalExpenses / budget?.monthlyAfterTax) * 100).toFixed(2)
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
        value: `${budgetUsedPercentage}%`,
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

    // Memoize chart content to prevent unnecessary re-renders
    const chartContent = useMemo(() => {
      if (processedChartData.length === 0) {
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: "200px",
              color: "var(--text-secondary)",
              textAlign: "center",
              padding: "var(--space-md)",
              fontSize: smallApp
                ? "var(--font-size-xs)"
                : "var(--font-size-sm)",
            }}
          >
            No expense data to display. Add some expenses to see the breakdown.
          </div>
        );
      }

      return (
        <div
          style={{
            width: "100%",
            height: chartDimensions.totalHeight,
            minWidth: "200px",
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: "100%",
              height: chartDimensions.chartHeight,
              minWidth: "200px",
              minHeight: "180px",
              flex: "0 0 auto",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={200}
              minHeight={180}
            >
              <PieChart>
                <Pie
                  data={processedChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={chartDimensions.pieRadius}
                  innerRadius={smallApp ? 15 : 20}
                  labelLine={false}
                  label={chartDimensions.showLabels ? renderCustomLabel : false}
                  animationBegin={0}
                  animationDuration={400}
                  animationEasing="ease-out"
                >
                  {processedChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isOther
                          ? "var(--chart-color-8)"
                          : COLORS[index % COLORS.length]
                      }
                      stroke="var(--surface-dark)"
                      strokeWidth={1}
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
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    background: "var(--color-secondary)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: smallApp
                      ? "var(--font-size-xs)"
                      : "var(--font-size-sm)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    padding: "8px 12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {chartDimensions.showLegend && (
            <div style={{ flex: "0 0 auto", marginTop: "8px" }}>
              <Legend
                content={renderLegend}
                payload={processedChartData.map((entry, index) => ({
                  value: entry.name,
                  type: "square",
                  color: entry.isOther
                    ? "var(--chart-color-8)"
                    : COLORS[index % COLORS.length],
                  payload: entry,
                }))}
              />
            </div>
          )}
        </div>
      );
    }, [
      processedChartData,
      smallApp,
      renderCustomLabel,
      renderLegend,
      chartDimensions,
    ]);

    return (
      <Section
        header={
          <SectionHeader title="Expenses Breakdown" right={viewSelectMenu} />
        }
        className={budgetStyles.chartSection}
      >
        <ChartSummary items={summaryItems} />
        <div
          className={budgetStyles.chartContainer}
          style={{
            height: chartDimensions.totalHeight + 40, // Add padding
            minHeight: "240px",
            width: "100%",
            minWidth: "240px",
            contain: "layout style paint",
            padding: smallApp ? "var(--space-xs)" : "var(--space-sm)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          {chartContent}
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
