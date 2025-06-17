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
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const getPerformanceDataForPortfolio = (accounts, portfolioId) => {
  let relevantAccounts = [];
  if (portfolioId === "all") {
    relevantAccounts = accounts.filter(
      (acc) => acc.category === "Investments" && acc.hasSecurities
    );
  } else {
    relevantAccounts = accounts.filter(
      (acc) =>
        acc.category === "Investments" &&
        acc.hasSecurities &&
        acc.portfolioId === portfolioId
    );
  }

  let events = [];
  let currentPortfolioValue = 0;
  relevantAccounts.forEach((acc) => {
    currentPortfolioValue += acc.value || 0;
    if (Array.isArray(acc.securities)) {
      acc.securities.forEach((sec) => {
        if (sec.datePurchased) {
          events.push({
            date: sec.datePurchased.slice(0, 10),
            valueChange:
              (sec.value || 0) - (sec.purchasePrice || 0) * (sec.quantity || 1),
            cost: (sec.purchasePrice || 0) * (sec.quantity || 1),
          });
        }
      });
    }
  });

  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = [];
  let cumulativeValue = 0;
  let cumulativeCost = 0;

  const earliestDate =
    events.length > 0 ? events[0].date : new Date().toISOString().slice(0, 10);

  if (events.length > 0) {
    const dayBeforeFirstPurchase = new Date(events[0].date);
    dayBeforeFirstPurchase.setDate(dayBeforeFirstPurchase.getDate() - 1);
    data.push({
      date: dayBeforeFirstPurchase.toISOString().slice(0, 10),
      "Portfolio Value": 0,
      "Cost Basis": 0,
    });
  }

  const aggregatedEvents = events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || {
      date: event.date,
      valueChange: 0,
      cost: 0,
    };
    acc[event.date].valueChange += event.valueChange;
    acc[event.date].cost += event.cost;
    return acc;
  }, {});

  const sortedDates = Object.keys(aggregatedEvents).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  sortedDates.forEach((date) => {
    cumulativeCost += aggregatedEvents[date].cost;
    cumulativeValue +=
      aggregatedEvents[date].cost + aggregatedEvents[date].valueChange;
    data.push({
      date: date,
      "Portfolio Value": cumulativeValue,
      "Cost Basis": cumulativeCost,
    });
  });

  if (data.length > 0) {
    const finalCostBasis = data[data.length - 1]["Cost Basis"];
    data.push({
      date: "Now",
      "Portfolio Value": relevantAccounts.reduce(
        (sum, acc) => sum + (acc.value || 0),
        0
      ),
      "Cost Basis": finalCostBasis,
    });
  } else if (relevantAccounts.length > 0) {
    data.push({
      date: "Now",
      "Portfolio Value": relevantAccounts.reduce(
        (sum, acc) => sum + (acc.value || 0),
        0
      ),
      "Cost Basis": 0,
    });
  }

  return data.filter(
    (item, index, self) => index === self.findIndex((t) => t.date === item.date)
  );
};

const PerformanceTab = ({
  smallApp,
  portfolioId,
  showPortfolioSelectMenu = false,
  portfolioSelectMenu,
}) => {
  const { data: financialData } = useFinancialData();
  const accounts = financialData.accounts || [];

  const performanceChartData = useMemo(() => {
    return getPerformanceDataForPortfolio(accounts, portfolioId);
  }, [accounts, portfolioId]);

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
      <div className={accountsStyles.chartContainer}>
        {performanceChartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={smallApp ? 180 : 265}>
            <LineChart data={performanceChartData}>
              <XAxis
                dataKey="date"
                fontSize={smallApp ? 9 : 11}
                tick={{ fill: "var(--chart-label-text)" }}
              />
              <YAxis
                fontSize={smallApp ? 9 : 11}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tick={{ fill: "var(--chart-label-text)" }}
              />
              <Tooltip
                formatter={(value) => `$${value.toLocaleString()}`}
                contentStyle={{
                  background: "var(--surface-light)",
                  border: "1px solid var(--border-light)",
                  color: "var(--chart-tooltip-text)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: "var(--font-size-xs)",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: smallApp ? "0.65rem" : "0.75rem",
                  color: "var(--chart-label-text)",
                }}
              />
              <Line
                type="monotone"
                dataKey="Portfolio Value"
                stroke="var(--chart-color-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Cost Basis"
                stroke="var(--chart-color-2)"
                strokeDasharray="5 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={accountsStyles.noChartData}>
            Not enough data for performance chart.
          </div>
        )}
      </div>
    </Section>
  );
};

export default PerformanceTab;
