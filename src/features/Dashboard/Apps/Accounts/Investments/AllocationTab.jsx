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
      style={{ minHeight: 0, height: "100%" }}
    >
      <div
        className={accountsStyles.chartContainer}
        style={{ height: smallApp ? 140 : 220 }}
      >
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                innerRadius="45%"
                label={renderLabel}
                labelLine={false}
              >
                {pieData.map((entry, idx) => (
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
