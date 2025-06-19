// client/src/features/Accounts/OverviewTab/OverviewTab.jsx
import React, { useMemo } from "react";
import Section from "../../../components/ui/Section/Section";
import SectionHeader from "../../../components/ui/Section/SectionHeader";
import TwoColumnLayout from "../../../components/ui/TwoColumnLayout/TwoColumnLayout";
import Button from "../../../components/ui/Button/Button";
import { useFinancialData } from "../../../contexts/FinancialDataContext";
import {
  getNetWorth, // Import from financialCalculations
  getTotalCash,
  getTotalAssets,
  getTotalLiabilities,
} from "../../../utils/financialCalculations"; // Correct import path
import styles from "./OverviewTab.module.css";
import sectionStyles from "../../../components/ui/Section/Section.module.css"; // For general section styles
import tableStyles from "../../../components/ui/Table/Table.module.css"; // Assuming you have this or will create it

// Pie Chart Imports (assuming these are what you're using for charts)
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// No longer defining getNetWorth here, it's imported.

// Use CSS variables for chart colors
const CHART_COLORS = [
  "var(--chart-color-1)",
  "var(--chart-color-2)",
  "var(--chart-color-3)",
  "var(--chart-color-4)",
  "var(--chart-color-5)",
  "var(--chart-color-6)",
  "var(--chart-color-7)",
  "var(--chart-color-8)",
];

// Recharts Custom Label (adjusting font size using CSS variable)
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  value,
}) => {
  // Only show label if slice is large enough
  if (percent < 0.05) return null; // Hide labels for very small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--chart-label-text)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className={sectionStyles.chartLabelText}
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const OverviewTab = ({ smallApp }) => {
  const { data: financialData } = useFinancialData();
  const accounts = financialData.accounts;

  // Memoize calculations for performance
  const calculatedFinancials = useMemo(() => {
    const netWorth = getNetWorth(accounts);
    const totalCash = getTotalCash(accounts);
    const totalAssets = getTotalAssets(accounts);
    const totalLiabilities = getTotalLiabilities(accounts);

    // Prepare data for Asset Allocation Chart
    const assetAllocationData = accounts
      .filter((acc) => acc.category !== "Debt" && acc.value > 0) // Only assets with positive value
      .reduce((acc, current) => {
        const existing = acc.find((item) => item.name === current.category);
        if (existing) {
          existing.value += current.value;
        } else {
          acc.push({ name: current.category, value: current.value });
        }
        return acc;
      }, []);

    // Prepare data for Liability Breakdown Chart
    const liabilityBreakdownData = accounts
      .filter((acc) => acc.category === "Debt" && acc.value > 0) // Only liabilities with positive value
      .reduce((acc, current) => {
        // For liabilities, maybe group by type of debt or just show account name
        // For simplicity, let's group by a generic 'Debt' category or specific debt types if available
        const categoryName = current.name || "Other Debt"; // Use account name for more detail
        const existing = acc.find((item) => item.name === categoryName);
        if (existing) {
          existing.value += current.value;
        } else {
          acc.push({ name: categoryName, value: current.value });
        }
        return acc;
      }, []);

    return {
      netWorth,
      totalCash,
      totalAssets,
      totalLiabilities,
      assetAllocationData,
      liabilityBreakdownData,
    };
  }, [accounts]);

  const {
    netWorth,
    totalCash,
    totalAssets,
    totalLiabilities,
    assetAllocationData,
    liabilityBreakdownData,
  } = calculatedFinancials;

  // console.log("OverviewTab rendered with smallApp:", smallApp); // Keep for now, remove later

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const SummarySection = (
    <Section title="Financial Snapshot">
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Net Worth</span>
          <span className={styles.summaryValue}>
            {formatCurrency(netWorth)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Cash</span>
          <span className={styles.summaryValue}>
            {formatCurrency(totalCash)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Assets</span>
          <span className={styles.summaryValue}>
            {formatCurrency(totalAssets)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Liabilities</span>
          <span className={styles.summaryValue}>
            {formatCurrency(totalLiabilities)}
          </span>
        </div>
      </div>
    </Section>
  );

  const YourAccountsSection = (
    <Section
      header={
        <SectionHeader
          title="Your Accounts"
          right={<Button variant="secondary">Add Account</Button>}
        />
      }
      className={smallApp ? sectionStyles.compactSection : ""}
    >
      <div
        className={`${styles.tableContainer} ${
          smallApp ? styles.smallAppTable : ""
        }`}
      >
        {accounts.length > 0 ? (
          <table className={tableStyles.table}>
            {" "}
            {/* Using tableStyles.table here */}
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th className={tableStyles.alignRight}>Value</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>{acc.name}</td>
                  <td>{acc.category}</td>
                  <td className={tableStyles.alignRight}>
                    {formatCurrency(acc.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={sectionStyles.noChartData}>No accounts added yet.</p>
        )}
      </div>
    </Section>
  );

  const InvestmentsSection = (
    <Section
      header={
        <SectionHeader
          title="Investments"
          right={<Button variant="secondary">View Details</Button>}
        />
      }
      className={smallApp ? sectionStyles.compactSection : ""}
    >
      <div
        className={`${styles.tableContainer} ${
          smallApp ? styles.smallAppTable : ""
        }`}
      >
        {accounts.filter((acc) => acc.category === "Investments").length > 0 ? (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th className={tableStyles.alignRight}>Value</th>
              </tr>
            </thead>
            <tbody>
              {accounts
                .filter((acc) => acc.category === "Investments")
                .map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.name}</td>
                    <td>{inv.type || "N/A"}</td>
                    <td className={tableStyles.alignRight}>
                      {formatCurrency(inv.value)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className={sectionStyles.noChartData}>No investments added yet.</p>
        )}
      </div>
    </Section>
  );

  const AssetAllocationChart = (
    <Section className={sectionStyles.chartSection}>
      <h4 className={sectionStyles.chartHeader}>Asset Allocation</h4>
      <div className={sectionStyles.chartContainerCompact}>
        {assetAllocationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assetAllocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={smallApp ? 50 : 65} // Smaller radius for smallApp
                fill="#8884d8"
                dataKey="value"
              >
                {assetAllocationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-grid)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "var(--space-xxs)",
                }}
                itemStyle={{ color: "var(--chart-tooltip-text)" }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className={sectionStyles.noChartData}>No asset data to display.</p>
        )}
      </div>
    </Section>
  );

  const LiabilityBreakdownChart = (
    <Section className={sectionStyles.chartSection}>
      <h4 className={sectionStyles.chartHeader}>Liability Breakdown</h4>
      <div className={sectionStyles.chartContainerCompact}>
        {liabilityBreakdownData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={liabilityBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={smallApp ? 50 : 65} // Smaller radius for smallApp
                fill="#8884d8"
                dataKey="value"
              >
                {liabilityBreakdownData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-grid)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "var(--space-xxs)",
                }}
                itemStyle={{ color: "var(--chart-tooltip-text)" }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className={sectionStyles.noChartData}>
            No liability data to display.
          </p>
        )}
      </div>
    </Section>
  );

  return (
    <TwoColumnLayout
      left={
        <>
          {SummarySection}
          {YourAccountsSection}
        </>
      }
      right={
        <>
          {AssetAllocationChart}
          {LiabilityBreakdownChart}
          {InvestmentsSection}
        </>
      }
      smallApp={smallApp}
    />
  );
};

export default OverviewTab;
