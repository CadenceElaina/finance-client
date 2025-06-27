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

// Helper function to truncate text smartly
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;

  // Try to break at word boundaries
  const words = text.split(" ");
  if (words.length > 1) {
    let result = words[0];
    for (let i = 1; i < words.length; i++) {
      if ((result + " " + words[i]).length <= maxLength - 3) {
        result += " " + words[i];
      } else {
        return result + "...";
      }
    }
    return result;
  }

  // If single word, just truncate
  return text.substring(0, maxLength - 3) + "...";
};

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

    // Improved custom label renderer with better text handling
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
        if (percent < 0.05 || processedChartData.length > 5) return null;

        const RADIAN = Math.PI / 180;
        const labelRadius = outerRadius + (smallApp ? 15 : 25);
        const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        const textAnchor = x > cx ? "start" : "end";
        const finalX = x + (x > cx ? 3 : -3);

        // Smart truncation based on app size
        const maxLength = smallApp ? 8 : 12;
        const displayName = truncateText(name, maxLength);

        return (
          <text
            x={finalX}
            y={y}
            fill="var(--chart-label-text)"
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={smallApp ? "9px" : "10px"}
            fontWeight="500"
          >
            <tspan x={finalX} dy={0}>
              {displayName}
            </tspan>
            <tspan x={finalX} dy={smallApp ? 10 : 12}>
              {(percent * 100).toFixed(1)}%
            </tspan>
          </text>
        );
      },
      [smallApp, processedChartData.length]
    );

    const renderSideLegend = useCallback(
      (props) => {
        const { payload } = props;
        if (!payload || payload.length === 0) return null;

        const totalValue = processedChartData.reduce(
          (sum, item) => sum + item.value,
          0
        );

        // Split payload into rows of two items each
        const rows = [];
        for (let i = 0; i < payload.length; i += 2) {
          rows.push(payload.slice(i, i + 2));
        }

        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              padding: smallApp ? "6px" : "8px",
              backgroundColor: "var(--surface-light)",
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--border-light)",
              display: "flex",
              alignContent: "center",
              justifyContent: "center",

              flexDirection: "column",
              gap: smallApp ? "4px" : "6px",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: smallApp ? "4px" : "6px",
                  width: "100%",
                }}
              >
                {row.map((entry, colIndex) => {
                  const percentage = (
                    (entry.payload.value / totalValue) *
                    100
                  ).toFixed(1);

                  // Adjust text length based on container size
                  const maxNameLength = smallApp ? 10 : 14;
                  const displayName = truncateText(entry.value, maxNameLength);

                  return (
                    <div
                      key={colIndex}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: smallApp ? "4px" : "6px",
                        fontSize: smallApp ? "9px" : "10px",
                        padding: smallApp ? "3px 4px" : "4px 6px",
                        borderRadius: "3px",
                        backgroundColor: "var(--surface-primary)",
                        border: "1px solid var(--border-light)",
                        transition: "background-color 0.2s ease",
                        minHeight: "35px", // <-- updated
                        minWidth: "100px", // <-- updated
                        boxSizing: "border-box",
                        flex: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--surface-dark)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--surface-primary)";
                      }}
                    >
                      <div
                        style={{
                          width: smallApp ? "10px" : "12px",
                          height: smallApp ? "10px" : "12px",
                          backgroundColor: entry.color,
                          borderRadius: "2px",
                          flexShrink: 0,
                          border: "1px solid var(--border-light)",
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text-primary)",
                            fontWeight: "500",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                            fontSize: smallApp ? "9px" : "10px",
                          }}
                          title={entry.value}
                        >
                          {displayName}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: smallApp ? "8px" : "9px",
                            color: "var(--text-secondary)",
                            lineHeight: 1.1,
                          }}
                        >
                          <span>{percentage}%</span>
                          <span>
                            $
                            {entry.payload.value.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* If odd number of items, fill the last cell to keep grid aligned */}
                {row.length < 2 && <div style={{ flex: 1, minWidth: 0 }} />}
              </div>
            ))}
          </div>
        );
      },
      [smallApp, processedChartData]
    );

    // Chart dimensions for horizontal layout - FIXED
    const chartDimensions = useMemo(() => {
      const hasLegend = processedChartData.length > 0;
      const baseHeight = smallApp ? 180 : 300;

      return {
        chartHeight: baseHeight,
        totalHeight: baseHeight,
        pieRadius: smallApp ? 50 : 70, // Reduced to give more space to legend
        showLabels: processedChartData.length <= 3, // Even fewer labels since we have side legend
        showLegend: hasLegend,
        legendWidth: smallApp ? "30%" : "50%", // Increased legend width
        chartWidth: smallApp ? "70%" : "50%", // Reduced chart width
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

    // Memoize chart content with horizontal layout - FIXED
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
            minWidth: "280px", // Increased minimum width
            minHeight: "200px",
            display: "flex",
            flexDirection: "row",
            gap: smallApp ? "6px" : "8px",
            alignItems: "stretch",
            boxSizing: "border-box",
          }}
        >
          {chartDimensions.showLegend && (
            <div
              style={{
                width: chartDimensions.legendWidth,
                minWidth: smallApp ? "130px" : "160px",
                maxWidth: smallApp ? "180px" : "220px",
                flex: "0 0 auto",
                height: "100%",
                boxSizing: "border-box",
                display: "flex", // Add this
                alignItems: "center", // Center vertically
                justifyContent: "center", // Center horizontally
              }}
            >
              <Legend
                content={renderSideLegend}
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

          {/* Chart on the right - FIXED */}
          <div
            style={{
              width: chartDimensions.showLegend
                ? chartDimensions.chartWidth
                : "100%",
              height: chartDimensions.chartHeight,
              minWidth: "140px", // Reduced minimum width
              minHeight: "140px",
              flex: chartDimensions.showLegend ? "1 1 0" : "1", // Allow chart to grow
              boxSizing: "border-box",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={140}
              minHeight={140}
            >
              <PieChart>
                <Pie
                  data={processedChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={chartDimensions.pieRadius}
                  innerRadius={smallApp ? 12 : 15}
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
        </div>
      );
    }, [
      processedChartData,
      smallApp,
      renderCustomLabel,
      renderSideLegend,
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
            height: chartDimensions.totalHeight + 10,
            minHeight: "220px",
            width: "100%",
            minWidth: "320px", // Increased for better legend visibility
            contain: "layout style paint",
            padding: smallApp ? "var(--space-xs)" : "var(--space-xs)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "stretch",
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
