import React, { useMemo } from "react";
import Table from "../../../../../components/ui/Table/Table";
import Section from "../../../../../components/ui/Section/Section";
import SectionHeader from "../../../../../components/ui/Section/SectionHeader";
import tableStyles from "../../../../../components/ui/Table/Table.module.css";
import accountsStyles from "../Accounts.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const HoldingsTab = ({
  portfolioId,
  smallApp,
  portfolios = [],
  setSelectedPortfolioId,
  selectedPortfolioId,
  holdingsHeaderTitle = "All Investments",
  showPortfolioSelectMenu = false,
  portfolioSelectMenu, // passed from PortfoliosWrapper
}) => {
  const { data } = useFinancialData();
  const allAccounts = data.accounts || [];

  const holdings = useMemo(() => {
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

    let rows = [];
    relevantAccounts.forEach((acc) => {
      if (Array.isArray(acc.securities)) {
        acc.securities.forEach((sec) => {
          rows.push({
            id: `${acc.id}-${sec.ticker || sec.name}`,
            accountName: acc.name,
            accountProvider: acc.accountProvider,
            portfolioName:
              data.portfolios?.find((p) => p.id === acc.portfolioId)?.name ||
              "N/A",
            ...sec,
          });
        });
      }
    });
    return rows;
  }, [allAccounts, portfolioId, data.portfolios]);

  const baseColumns = [
    { key: "accountName", label: "Account" },
    { key: "accountProvider", label: "Broker" },
    { key: "name", label: "Security Name" },
    { key: "ticker", label: "Ticker" },
    { key: "quantity", label: "Qty", render: (v) => v?.toLocaleString() },
    {
      key: "value",
      label: "Value",
      render: (v) =>
        `$${v?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: "purchasePrice",
      label: "Avg. Cost",
      render: (v) =>
        v
          ? `$${v.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "-",
    },
    {
      key: "datePurchased",
      label: "Last Purchased",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
    },
  ];

  const columns = useMemo(() => {
    return [...baseColumns];
  }, [portfolioId]);

  return (
    <Section
      header={
        <SectionHeader
          title={holdingsHeaderTitle}
          right={showPortfolioSelectMenu ? portfolioSelectMenu : null}
        />
      }
      className={tableStyles.tableSection}
    >
      <div className={tableStyles.tableContainer}>
        <Table
          columns={columns}
          data={holdings}
          className={tableStyles.compactTable}
          smallApp={smallApp}
        />
      </div>
    </Section>
  );
};

export default HoldingsTab;
