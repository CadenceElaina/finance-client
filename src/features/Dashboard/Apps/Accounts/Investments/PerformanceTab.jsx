import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Section from "../../../../../components/ui/Section/Section";
import SectionHeader from "../../../../../components/ui/Section/SectionHeader";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import accountsStyles from "../Accounts.module.css";
import { getPerformanceDataForPortfolio } from "../../../../../utils/calculations/portfolioCalculations";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const PerformanceTab = ({
  smallApp,
  portfolioId,
  showPortfolioSelectMenu = false,
  portfolioSelectMenu,
}) => {
  const { data: financialData } = useFinancialData();
  const accounts = financialData.accounts || [];

  // Use centralized performance calculation
  const performanceChartData = useMemo(() => {
    return getPerformanceDataForPortfolio(accounts, portfolioId);
  }, [accounts, portfolioId]);

  // Memoize chart content
  const chartContent = useMemo(() => {
    if (performanceChartData.length <= 1) {
      return (
        <div className={accountsStyles.noChartData}>
          No performance data available. Add some securities with purchase dates
          to see the chart.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={smallApp ? 295 : 317}>
        <LineChart
          data={performanceChartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            fontSize={smallApp ? 9 : 11}
            tick={{ fill: "var(--chart-label-text)" }}
            animationDuration={0}
          />
          <YAxis
            fontSize={smallApp ? 9 : 11}
            tick={{ fill: "var(--chart-label-text)" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            animationDuration={0}
          />
          <Tooltip
            formatter={(value, name) => [
              `$${value.toLocaleString()}`,
              name === "Portfolio Value" ? "Current Value" : "Cost Basis",
            ]}
            labelFormatter={(label) =>
              label === "Now" ? "Current" : `Date: ${label}`
            }
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--border-radius-md)",
              fontSize: "var(--font-size-xs)",
            }}
            animationDuration={0}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Portfolio Value"
            stroke="var(--chart-color-1)"
            strokeWidth={2}
            dot={{ r: 3 }}
            animationBegin={0}
            animationDuration={0}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Cost Basis"
            stroke="var(--chart-color-2)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 2 }}
            animationBegin={0}
            animationDuration={0}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, [performanceChartData, smallApp]);

  return (
    <Section
      header={
        <SectionHeader
          title="Portfolio Performance"
          right={showPortfolioSelectMenu ? portfolioSelectMenu : null}
        />
      }
      className={`${accountsStyles.chartSection} ${
        smallApp ? accountsStyles.sectionSmall : ""
      }`}
    >
      <div className={sectionStyles.chartHeader}></div>
      <div
        className={accountsStyles.chartContainer}
        style={{ contain: "layout style paint" }}
      >
        {chartContent}
      </div>
    </Section>
  );
};

export default PerformanceTab;
