import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Section from "../../../../components/ui/Section/Section";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import accountsStyles from "./Accounts.module.css";
import { renderPieLabel } from "./utils/pieChartLabelUtil";

const AccountsBreakdownCharts = ({
  assetsPieData,
  liabilitiesPieData,
  smallApp,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: smallApp ? "column" : "row",
      gap: smallApp ? 8 : 24,
      marginBottom: 16,
      width: "100%",
    }}
  >
    <Section
      className={accountsStyles.chartSection}
      style={{ flex: 1, minWidth: 0 }}
    >
      <div className={sectionStyles.sectionHeaderTitle}>Assets Breakdown</div>
      <div className={accountsStyles.chartContainer}>
        {assetsPieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={smallApp ? 120 : 140}>
            <PieChart>
              <Pie
                data={assetsPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={smallApp ? 40 : 45}
                labelLine={false}
                label={(props) => renderPieLabel({ ...props, smallApp })}
              >
                {assetsPieData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={`var(--chart-color-${(idx % 8) + 1})`}
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
                wrapperStyle={{
                  color: "var(--chart-label-text)",
                  fontSize: smallApp ? "0.65rem" : "var(--font-size-xs)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={accountsStyles.noChartData}>
            No assets to display.
          </div>
        )}
      </div>
    </Section>
    <Section
      className={accountsStyles.chartSection}
      style={{ flex: 1, minWidth: 0 }}
    >
      <div className={sectionStyles.sectionHeaderTitle}>
        Liabilities Breakdown
      </div>
      <div className={accountsStyles.chartContainer}>
        {liabilitiesPieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={smallApp ? 120 : 140}>
            <PieChart>
              <Pie
                data={liabilitiesPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={smallApp ? 40 : 45}
                labelLine={false}
                label={(props) => renderPieLabel({ ...props, smallApp })}
              >
                {liabilitiesPieData.map((entry, idx) => (
                  <Cell
                    key={`cell-liab-${idx}`}
                    fill={`var(--chart-color-${((idx + 2) % 8) + 1})`}
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
                wrapperStyle={{
                  color: "var(--chart-label-text)",
                  fontSize: smallApp ? "0.65rem" : "var(--font-size-xs)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={accountsStyles.noChartData}>
            No liabilities to display.
          </div>
        )}
      </div>
    </Section>
  </div>
);

export default AccountsBreakdownCharts;
