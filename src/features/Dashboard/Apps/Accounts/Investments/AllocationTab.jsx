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
      if (typeof acc.cashBalance === "number" && acc.cashBalance > 0) {
        cashTotal += acc.cashBalance;
      }
      if (Array.isArray(acc.securities)) {
        securitiesInPortfolio.push(...acc.securities);
      }
    });

    const aggregatedSecurities = securitiesInPortfolio.reduce((acc, curr) => {
      const key = curr.ticker || curr.name;
      if (!acc[key]) {
        acc[key] = { name: key, value: 0 };
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

  // --- Label with percentage ---
  const renderLabel = ({ name, value }) => {
    const percent = totalValue ? ((value / totalValue) * 100).toFixed(1) : 0;
    return `${name} (${percent}%)`;
  };

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
    if (!totalValue) return null; // Always show, even for small percentages

    const RADIAN = Math.PI / 180;
    // Start at the outer edge of the pie
    const lineStartRadius = outerRadius + 6;
    const lineMidRadius = outerRadius + 28; // How far out the "elbow" is
    const labelOffset = 18; // Horizontal offset for label from elbow

    // Calculate the angle and direction
    const angle = -midAngle;
    const sin = Math.sin(angle * RADIAN);
    const cos = Math.cos(angle * RADIAN);

    // Start point (pie edge)
    const sx = cx + lineStartRadius * cos;
    const sy = cy + lineStartRadius * sin;

    // Elbow point (straight out from pie)
    const mx = cx + lineMidRadius * cos;
    const my = cy + lineMidRadius * sin;

    // End point (horizontal, left or right)
    const ex = mx + (cos >= 0 ? labelOffset : -labelOffset);
    const ey = my;

    // Label position (a bit past the end of the line)
    const lx = ex + (cos >= 0 ? 4 : -4);
    const ly = ey;

    const percentDisplay = ((value / totalValue) * 100).toFixed(1);

    return (
      <g>
        {/* Draw the elbow line: pie edge -> elbow -> horizontal to label */}
        <polyline
          points={`${sx},${sy} ${mx},${my} ${ex},${ey}`}
          stroke="var(--chart-label-text)"
          strokeWidth={1}
          fill="none"
        />
        <text
          x={lx}
          y={ly}
          fill="var(--chart-label-text)"
          textAnchor={cos >= 0 ? "start" : "end"}
          dominantBaseline="central"
          fontSize="var(--font-size-xxs)" // <-- Use your CSS variable here
          style={{ fontWeight: 500, pointerEvents: "none" }}
        >
          {`${name} (${percentDisplay}%)`}
        </text>
      </g>
    );
  };

  return (
    <Section
      header={
        <SectionHeader
          title={
            portfolioName
              ? `${portfolioName}'s Allocation`
              : "Portfolio Allocation"
          }
          right={showPortfolioSelectMenu ? portfolioSelectMenu : null}
        />
      }
      className={accountsStyles.chartSection}
    >
      <div
        className={accountsStyles.chartContainer}
        style={{ height: smallApp ? 250 : 327 }}
      >
        {sortedPieData.length > 0 ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={sortedPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                innerRadius="45%"
                label={renderCustomLabel}
                labelLine={true} // Enable label lines
              >
                {sortedPieData.map((entry, idx) => (
                  <Cell
                    key={`cell-${entry.name}-${idx}`}
                    fill={`var(--chart-color-${(idx % 8) + 1})`}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const percentage = totalValue
                    ? ((value / totalValue) * 100).toFixed(2)
                    : 0;
                  return [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })} (${percentage}%)`,
                    name,
                  ];
                }}
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--border-light)",
                  color: "var(--chart-tooltip-text)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: "var(--font-size-xs)",
                }}
                itemStyle={{
                  color: "var(--chart-tooltip-text)",
                  fontSize: "var(--font-size-xs)",
                }}
              />
              <Legend
                align="center"
                verticalAlign="bottom"
                layout="horizontal"
                iconSize={10}
                wrapperStyle={{
                  fontSize: smallApp ? "0.65rem" : "0.75rem",
                  color: "var(--chart-label-text)",
                  paddingTop: smallApp ? "5px" : "10px",
                  lineHeight: "1.5",
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
