import React, { useMemo, memo, useCallback, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Section from "../../../../../components/ui/Section/Section";
import SectionHeader from "../../../../../components/ui/Section/SectionHeader";
import accountsStyles from "../Accounts.module.css";
import { getPortfolioAllocation } from "../../../../../utils/calculations/portfolioCalculations";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const AllocationTab = memo(
  ({
    smallApp,
    portfolioId,
    portfolioName,
    showPortfolioSelectMenu = false,
    portfolioSelectMenu,
  }) => {
    const { data } = useFinancialData();
    const allAccounts = data.accounts || [];
    const allPortfolios = data.portfolios || [];
    const chartRenderedRef = useRef(false);

    // Memoize expensive calculations with specific dependencies
    const { pieData, totalValue } = useMemo(() => {
      const result = getPortfolioAllocation(allAccounts, portfolioId);
      chartRenderedRef.current = false;
      return result;
    }, [
      allAccounts.length,
      portfolioId,
      allAccounts
        .filter(
          (acc) =>
            acc.category === "Investments" &&
            acc.hasSecurities &&
            (portfolioId === "all" || acc.portfolioId === portfolioId)
        )
        .map((acc) => `${acc.id}-${acc.value}`)
        .join(","),
    ]);

    // Sort pieData by value descending and filter out very small segments
    const processedPieData = useMemo(() => {
      const sortedData = [...pieData].sort((a, b) => b.value - a.value);

      // Group very small segments (< 2%) into "Other"
      const threshold = totalValue * 0.02;
      const mainSegments = sortedData.filter((item) => item.value >= threshold);
      const smallSegments = sortedData.filter((item) => item.value < threshold);

      if (smallSegments.length > 0 && mainSegments.length > 0) {
        const otherValue = smallSegments.reduce(
          (sum, item) => sum + item.value,
          0
        );
        return [
          ...mainSegments,
          { name: "Other", value: otherValue, isOther: true },
        ];
      }

      return sortedData;
    }, [pieData, totalValue]);

    // Check if portfolio exists and has accounts
    const portfolioHasAccounts =
      portfolioId === "all" ||
      allAccounts.some(
        (acc) =>
          acc.portfolioId === portfolioId && acc.category === "Investments"
      );

    const portfolioHasSecurities = processedPieData.length > 0;

    // Improved custom label renderer with better positioning
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
        if (percent < 0.05 || processedPieData.length > 6) return null;

        const RADIAN = Math.PI / 180;
        const labelRadius = outerRadius + (smallApp ? 12 : 20);
        const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        const textAnchor = x > cx ? "start" : "end";
        const finalX = x + (x > cx ? 3 : -3);

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
              {name}
            </tspan>
            <tspan x={finalX} dy={12}>
              {(percent * 100).toFixed(1)}%
            </tspan>
          </text>
        );
      },
      [smallApp, processedPieData.length]
    );

    // Custom legend renderer for better control
    const renderLegend = useCallback(
      (props) => {
        const { payload } = props;
        if (!payload || payload.length === 0) return null;

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
      [smallApp, totalValue]
    );

    // Generate appropriate empty state message
    const getEmptyStateMessage = () => {
      if (portfolioId !== "all" && portfolioId) {
        const portfolio = allPortfolios.find((p) => p.id === portfolioId);
        const portfolioName = portfolio?.name || "selected portfolio";

        if (!portfolioHasAccounts) {
          return `No investment accounts found for ${portfolioName}. Create an investment account and assign it to this portfolio to see allocation data.`;
        } else if (!portfolioHasSecurities) {
          return `No securities found for ${portfolioName}. Add securities to see allocation breakdown.`;
        }
      }
      return "No securities to display. Add investment accounts with securities to see allocation data.";
    };

    // Determine chart dimensions based on app size and data
    const chartDimensions = useMemo(() => {
      const hasLegend = processedPieData.length > 6;
      const baseHeight = smallApp ? 180 : 220;
      const legendHeight = hasLegend ? (smallApp ? 80 : 100) : 0;

      return {
        chartHeight: baseHeight,
        totalHeight: baseHeight + legendHeight,
        pieRadius: smallApp ? 65 : 85,
        showLabels: processedPieData.length <= 6,
        showLegend: hasLegend,
      };
    }, [smallApp, processedPieData.length]);

    // Memoize chart content to prevent unnecessary re-renders
    const chartContent = useMemo(() => {
      if (!portfolioHasSecurities) {
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
            {getEmptyStateMessage()}
          </div>
        );
      }

      return (
        <div
          style={{
            width: "100%",
            height: chartDimensions.totalHeight,
            minWidth: "240px", // Increased from 200px
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: "100%",
              height: chartDimensions.chartHeight,
              minWidth: "240px", // Increased from 200px
              minHeight: "200px", // Increased from 180px
              flex: "0 0 auto",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={240} // Increased from 200
              minHeight={200} // Increased from 180
            >
              <PieChart>
                <Pie
                  data={processedPieData}
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
                  {processedPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isOther
                          ? "var(--chart-color-8)"
                          : `var(--chart-color-${(index % 7) + 1})`
                      }
                      stroke="var(--surface-dark)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value.toLocaleString(undefined, {
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
                payload={processedPieData.map((entry, index) => ({
                  value: entry.name,
                  type: "square",
                  color: entry.isOther
                    ? "var(--chart-color-8)"
                    : `var(--chart-color-${(index % 7) + 1})`,
                  payload: entry,
                }))}
              />
            </div>
          )}
        </div>
      );
    }, [
      processedPieData,
      smallApp,
      renderCustomLabel,
      renderLegend,
      portfolioHasSecurities,
      getEmptyStateMessage,
      chartDimensions,
    ]);

    return (
      <Section
        header={
          <SectionHeader
            title={`Allocation${portfolioName ? ` - ${portfolioName}` : ""}`}
            center={
              <div
                style={{
                  fontSize: smallApp
                    ? "var(--font-size-xs)"
                    : "var(--font-size-sm)",
                  color: "var(--color-primary)",
                  background: "var(--surface-dark)",
                  padding: "var(--space-xs) var(--space-sm)",
                  borderRadius: "var(--border-radius-md)",
                  border: "2px solid var(--color-primary)",
                  fontWeight: "600",
                }}
              >
                $
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            }
            right={showPortfolioSelectMenu ? portfolioSelectMenu : null}
          />
        }
        className={accountsStyles.chartSection}
      >
        <div
          className={accountsStyles.chartContainer}
          style={{
            height: chartDimensions.totalHeight + 40,
            minHeight: "240px",
            width: "100%",
            minWidth: "280px",
            contain: "layout style paint",
            padding: smallApp ? "var(--space-xs)" : "var(--space-sm)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              minWidth: 280,
              height: chartDimensions.totalHeight,
              minHeight: 200,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={280}
              minHeight={200}
            >
              {chartContent}
            </ResponsiveContainer>
          </div>
        </div>
      </Section>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.smallApp === nextProps.smallApp &&
      prevProps.portfolioId === nextProps.portfolioId &&
      prevProps.portfolioName === nextProps.portfolioName &&
      prevProps.showPortfolioSelectMenu === nextProps.showPortfolioSelectMenu
    );
  }
);

export default AllocationTab;
