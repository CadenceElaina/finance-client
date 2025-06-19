// src/features/Dashboard/Apps/Accounts/OverviewTab.jsx
import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Section from "../../../../components/ui/Section/Section";
import Table from "../../../../components/ui/Table/Table";
import TwoColumnLayout from "../../../../components/ui/Section/TwoColumnLayout";
import accountsStyles from "./Accounts.module.css";
import tableStyles from "../../../../components/ui/Table/Table.module.css";
import { DEMO_ACCOUNTS } from "../../../../utils/constants";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { renderPieLabel } from "./utils/pieChartLabelUtil";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import {
  getNetWorth,
  getTotalCash,
  getTotalAssets,
  getTotalLiabilities,
  getTotalInvestments,
} from "../../../../utils/calculations/financialCalculations";
import { CHART_COLORS } from "../../../../utils/chartColors";

const OverviewTab = ({ smallApp }) => {
  const {
    data: { accounts },
  } = useFinancialData();
  //console.log('OverviewTab rendered with smallApp:', smallApp);
  const [accountCategoryFilter, setAccountCategoryFilter] = useState("all");

  const cashAccounts = accounts.filter((acc) => acc.category === "Cash");
  const investmentAccounts = accounts.filter(
    (acc) => acc.category === "Investments"
  );
  const debtAccounts = accounts.filter((acc) => acc.category === "Debt");

  const filteredAccountsForTable = useMemo(() => {
    if (accountCategoryFilter === "all") return accounts;
    if (accountCategoryFilter === "Cash") return cashAccounts;
    if (accountCategoryFilter === "Investments") return investmentAccounts;
    if (accountCategoryFilter === "Debt") return debtAccounts;
    return accounts;
  }, [
    accounts,
    accountCategoryFilter,
    cashAccounts,
    investmentAccounts,
    debtAccounts,
  ]);

  const netWorth = getNetWorth(accounts);
  const totalCash = getTotalCash(accounts);
  const totalInvestments = getTotalInvestments(accounts);
  const totalDebt = getTotalLiabilities(accounts);
  const totalAssets = getTotalAssets(accounts);

  const assetsPieData = [
    { name: "Cash", value: totalCash },
    { name: "Investments", value: totalInvestments },
  ].filter((d) => d.value > 0);

  const liabilitiesPieData = debtAccounts
    .map((acc) => ({
      name: acc.name,
      value: Math.abs(acc.value || 0),
    }))
    .filter((d) => d.value > 0);

  const accountsHeader = (
    <SectionHeader
      title="Your Accounts"
      right={
        <div>
          <label
            htmlFor="accountCategoryFilter"
            className={tableStyles.filterLabel}
          >
            Show:
          </label>
          <select
            id="accountCategoryFilter"
            value={accountCategoryFilter}
            onChange={(e) => setAccountCategoryFilter(e.target.value)}
            className={tableStyles.select}
          >
            <option value="all">All Accounts</option>
            <option value="Cash">Cash Accounts</option>
            <option value="Investments">Investment Accounts</option>
            <option value="Debt">Liability Accounts</option>
          </select>
        </div>
      }
    />
  );

  const ChartsColumnContent = (
    <>
      <Section
        className={` ${accountsStyles.chartSection} ${
          smallApp ? accountsStyles.sectionSmall : ""
        }`}
      >
        <div className={sectionStyles.sectionHeaderTitle}>Assets Breakdown</div>
        <div className={accountsStyles.chartContainer}>
          {assetsPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={smallApp ? 120 : 140}>
              {" "}
              {/* Adjust height for small app */}
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
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
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
        className={`${accountsStyles.chartSectionCompact} ${
          accountsStyles.chartSectionNoBorder
        } ${smallApp ? accountsStyles.sectionCompactOverride : ""}`}
      >
        <div className={sectionStyles.sectionHeaderTitle}>
          Liabilities Breakdown
        </div>
        <div className={accountsStyles.chartContainerCompact}>
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
                      fill={CHART_COLORS[(idx + 2) % CHART_COLORS.length]}
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
    </>
  );

  const TableColumnContent = (
    <>
      <Section
        header={accountsHeader}
        className={`${tableStyles.tableSection} ${smallApp ? "" : ""}`}
      >
        <Table
          className={tableStyles.table}
          columns={[
            { key: "name", label: "Account" },
            { key: "accountProvider", label: "Institution" },
            { key: "category", label: "Category" },
            { key: "subType", label: "Type" },
            {
              key: "value",
              label: "Value",
              render: (val) => (
                <span
                  className={
                    val >= 0 ? accountsStyles.positive : accountsStyles.negative
                  }
                >
                  $
                  {Math.abs(val).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ),
            },
            { key: "taxStatus", label: "Tax Status" },
          ]}
          data={filteredAccountsForTable}
          smallApp={smallApp}
        />
      </Section>
    </>
  );

  return (
    <div>
      <TwoColumnLayout
        className={sectionStyles.columns70_30}
        left={
          <div className={smallApp ? "" : accountsStyles.tableColumn}>
            {TableColumnContent}
          </div>
        }
        right={
          <div className={smallApp ? "" : accountsStyles.chartsColumn}>
            {ChartsColumnContent}
          </div>
        }
        smallApp={smallApp}
      />
    </div>
  );
};

export default OverviewTab;
