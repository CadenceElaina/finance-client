import React, { useMemo, memo, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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

    // Sort pieData by value descending (largest first)
    const sortedPieData = useMemo(
      () => [...pieData].sort((a, b) => b.value - a.value),
      [pieData]
    );

    // Check if portfolio exists and has accounts
    const portfolioHasAccounts =
      portfolioId === "all" ||
      allAccounts.some(
        (acc) =>
          acc.portfolioId === portfolioId && acc.category === "Investments"
      );

    const portfolioHasSecurities = sortedPieData.length > 0;

    // Memoize the custom label renderer
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
        if (percent < 0.02) return null;

        const RADIAN = Math.PI / 180;
        const labelRadius = outerRadius + (smallApp ? 15 : 25);
        const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        const textAnchor = x > cx ? "start" : "end";
        const finalX = x + (x > cx ? 5 : -5);

        return (
          <text
            x={finalX}
            y={y}
            fill="var(--chart-label-text)"
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize="var(--font-size-xxs)"
          >
            <tspan x={finalX} dy={0}>
              {name}
            </tspan>
            <tspan x={finalX} dy={14}>
              ({(percent * 100).toFixed(1)}%)
            </tspan>
          </text>
        );
      },
      [smallApp]
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
              color: "var(--text-secondary)",
              textAlign: "center",
              padding: "var(--space-md)",
            }}
          >
            {getEmptyStateMessage()}
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedPieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={smallApp ? 80 : 100}
              labelLine={false}
              label={renderCustomLabel}
              animationBegin={0}
              animationDuration={0}
              isAnimationActive={false}
            >
              {sortedPieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--chart-color-${(index % 8) + 1})`}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                `$${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}`
              }
              contentStyle={{
                background: "var(--chart-tooltip-bg)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--border-radius-md)",
                fontSize: "var(--font-size-xs)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }, [
      sortedPieData,
      smallApp,
      renderCustomLabel,
      portfolioHasSecurities,
      getEmptyStateMessage,
    ]);

    return (
      <Section
        header={
          <SectionHeader
            title={`Allocation${portfolioName ? ` - ${portfolioName}` : ""}`}
            left={
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-primary)",
                  background: "var(--surface-dark)",
                  padding: "var(--space-xs) var(--space-sm)",
                  borderRadius: "var(--border-radius-md)",
                  border: "2px solid var(--color-primary)",
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
            height: smallApp ? 275 : 313,
            contain: "layout style paint",
          }}
        >
          {chartContent}
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
