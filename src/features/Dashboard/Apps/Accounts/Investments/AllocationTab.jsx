import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Section from "../../../../../components/ui/Section/Section";
import SectionHeader from "../../../../../components/ui/Section/SectionHeader";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import accountsStyles from "../Accounts.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const AllocationTab = ({
  smallApp,
  portfolioId,
  portfolioName,
  showPortfolioSelectMenu = false,
  portfolioSelectMenu,
}) => {
  const { data } = useFinancialData();
  const allAccounts = data.accounts || [];

  // --- NEW: Aggregate securities and cash for the selected portfolio ---
  const { pieData, totalValue } = useMemo(() => {
    let relevantAccounts = [];
    if (portfolioId === "all") {
      relevantAccounts = allAccounts.filter(
        (acc) => acc.category === "Investments" && acc.hasSecurities
      );
    } else {
      relevantAccounts = allAccounts.filter(
        (acc) =>
          acc.category === "Investments" &&
          acc.hasSecurities &&
          acc.portfolioId === portfolioId
      );
    }

    const securitiesInPortfolio = [];
    let cashTotal = 0;
    relevantAccounts.forEach((acc) => {
      if (Array.isArray(acc.securities)) {
        securitiesInPortfolio.push(...acc.securities);
      }
      if (typeof acc.cashBalance === "number") {
        cashTotal += acc.cashBalance;
      }
    });

    const aggregatedSecurities = securitiesInPortfolio.reduce((acc, curr) => {
      const key = curr.ticker || curr.name;
      if (!acc[key]) {
        acc[key] = { name: curr.name, value: 0 };
      }
      acc[key].value += curr.value || 0;
      return acc;
    }, {});

    const currentPieData = Object.values(aggregatedSecurities).filter(
      (d) => d.value > 0
    );
    if (cashTotal > 0) {
      currentPieData.push({ name: "Cash", value: cashTotal });
    }
    const currentTotalValue = currentPieData.reduce(
      (sum, d) => sum + d.value,
      0
    );

    return { pieData: currentPieData, totalValue: currentTotalValue };
  }, [allAccounts, portfolioId]);

  // Sort pieData by value descending (largest first)
  const sortedPieData = [...pieData].sort((a, b) => b.value - a.value);

  // Custom label renderer that spreads labels out and draws a line
  const renderCustomLabel = ({
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
    if (percent < 0.02) return null; // Don't show labels for very small slices

    const RADIAN = Math.PI / 180;
    const lineStartRadius = outerRadius + 8;
    const lineMidRadius = outerRadius + 35;
    const labelOffset = 20;

    const angle = -midAngle;
    const sin = Math.sin(angle * RADIAN);
    const cos = Math.cos(angle * RADIAN);

    const sx = cx + lineStartRadius * cos;
    const sy = cy + lineStartRadius * sin;
    const mx = cx + lineMidRadius * cos;
    const my = cy + lineMidRadius * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * labelOffset;
    const ey = my;

    const textAnchor = cos >= 0 ? "start" : "end";
    const percentText = `${(percent * 100).toFixed(1)}%`;

    return (
      <g key={`label-${index}`}>
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke="var(--chart-label-text)"
          strokeWidth={1}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill="var(--chart-label-text)" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 5}
          y={ey - 5}
          textAnchor={textAnchor}
          fill="var(--chart-label-text)"
          fontSize={smallApp ? "10px" : "12px"}
          fontWeight="600"
        >
          {name}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 5}
          y={ey + 10}
          textAnchor={textAnchor}
          fill="var(--chart-label-text)"
          fontSize={smallApp ? "9px" : "11px"}
        >
          {percentText}
        </text>
      </g>
    );
  };

  return (
    <Section
      header={
        <SectionHeader
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-md)",
              }}
            >
              <span>
                {portfolioName
                  ? `${portfolioName}'s Allocation`
                  : "Portfolio Allocation"}
              </span>
              <div
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: "var(--font-weight-bold)",
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
            </div>
          }
          right={showPortfolioSelectMenu ? portfolioSelectMenu : null}
        />
      }
      className={accountsStyles.chartSection}
    >
      <div
        className={accountsStyles.chartContainer}
        style={{ height: smallApp ? 275 : 313 }} // Increased height
      >
        {sortedPieData.length > 0 ? (
          <ResponsiveContainer>
            <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <Pie
                data={sortedPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={smallApp ? "40%" : "50%"}
                innerRadius={smallApp ? "20%" : "25%"}
                label={renderCustomLabel}
                labelLine={false}
              >
                {sortedPieData.map((entry, idx) => (
                  <Cell
                    key={`cell-${entry.name}-${idx}`}
                    fill={`var(--chart-color-${(idx % 8) + 1})`}
                  />
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
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={accountsStyles.noChartData}>
            No securities to display for this portfolio.
          </div>
        )}
      </div>
    </Section>
  );
};

export default AllocationTab;
