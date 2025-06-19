// src/features/Dashboard/Apps/Accounts/PortfoliosWrapper.jsx
import React, { useState } from "react";
import InvestmentsTab from "./Investments/InvestmentsTab";
import AllocationTab from "./Investments/AllocationTab";
import PerformanceTab from "./Investments/PerformanceTab";
import accountsStyles from "./Accounts.module.css";
import budgetStyles from "../Budget/budget.module.css";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { DEMO_PORTFOLIOS } from "../../../../utils/constants";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import SnapshotRow from "../../../../components/ui/Snapshot/SnapshotRow";

const PortfoliosWrapper = ({ smallApp, activeInnerTabId }) => {
  const { data } = useFinancialData();
  const allAccounts = data.accounts || [];
  const allPortfolios = data.portfolios || []; // Use actual portfolios from data

  // Filter portfolios that have securities
  const portfolios = allPortfolios.filter((p) => {
    const portfolioAccounts = allAccounts.filter(
      (acc) => acc.portfolioId === p.id && acc.category === "Investments"
    );
    return portfolioAccounts.some(
      (acc) => Array.isArray(acc.securities) && acc.securities.length > 0
    );
  });

  // Portfolio selection state
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("all");
  const selectedPortfolioName =
    selectedPortfolioId === "all"
      ? "All Portfolios"
      : portfolios.find((p) => p.id === selectedPortfolioId)?.name || "";

  // Portfolio select menu (use a class for alignment)
  const portfolioSelectMenu = (
    <div className={accountsStyles.portfolioSelectMenuRow}>
      <label
        htmlFor="portfolio-select"
        className={accountsStyles.portfolioSelectLabel}
      >
        Portfolio:
      </label>
      <select
        id="portfolio-select"
        value={selectedPortfolioId}
        onChange={(e) => setSelectedPortfolioId(e.target.value)}
        className={accountsStyles.portfolioSelectMenu}
      >
        <option value="all">All Portfolios</option>
        {portfolios.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );

  // Calculate snapshot for selected portfolio
  const relevantAccounts =
    selectedPortfolioId === "all"
      ? allAccounts.filter(
          (acc) => acc.category === "Investments" && acc.hasSecurities
        )
      : allAccounts.filter(
          (acc) =>
            acc.category === "Investments" &&
            acc.hasSecurities &&
            acc.portfolioId === selectedPortfolioId
        );

  // Calculate cash balance for the selected portfolio
  const cashBalance =
    selectedPortfolioId === "all"
      ? allAccounts
          .filter(
            (acc) =>
              acc.category === "Investments" &&
              typeof acc.cashBalance === "number"
          )
          .reduce((sum, acc) => sum + acc.cashBalance, 0)
      : allAccounts
          .filter(
            (acc) =>
              acc.category === "Investments" &&
              acc.portfolioId === selectedPortfolioId &&
              typeof acc.cashBalance === "number"
          )
          .reduce((sum, acc) => sum + acc.cashBalance, 0);

  // Calculate value for selected portfolio
  const value = relevantAccounts.reduce(
    (sum, acc) => sum + (acc.value || 0),
    0
  );

  // Calculate cost basis for investments (sum of purchasePrice * quantity for all securities)
  let totalCostBasis = 0;
  relevantAccounts.forEach((acc) => {
    if (Array.isArray(acc.securities)) {
      acc.securities.forEach((sec) => {
        totalCostBasis += (sec.purchasePrice || 0) * (sec.quantity || 0);
      });
    }
  });

  const gainLoss = value - totalCostBasis;
  const gainLossPercent =
    totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

  const snapshotItems = [
    {
      label: "Value",
      value: `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Cash Balance",
      value: `$${cashBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Performance",
      value: `${gainLoss >= 0 ? "+" : "-"}$${Math.abs(gainLoss).toLocaleString(
        undefined,
        { minimumFractionDigits: 2 }
      )}`,
      valueClass: gainLoss >= 0 ? "positive" : "negative",
      valueSuffix:
        totalCostBasis > 0
          ? `(${gainLossPercent >= 0 ? "+" : "-"}${Math.abs(
              gainLossPercent
            ).toFixed(2)}%)`
          : null,
    },
  ];

  const tabProps = {
    smallApp,
    portfolioId: selectedPortfolioId,
    portfolioName: selectedPortfolioName,
    portfolios,
    setSelectedPortfolioId,
    selectedPortfolioId,
    portfolioSelectMenu,
  };

  // Table header for holdings
  const investmentsHeaderTitle =
    selectedPortfolioId === "all"
      ? "All Investments"
      : `${selectedPortfolioName}'s Investments`;

  return (
    <div className={accountsStyles.portfoliosContentContainer}>
      {(!activeInnerTabId || activeInnerTabId === "investments") && (
        <>
          <SnapshotRow items={snapshotItems} small={smallApp} />
          <InvestmentsTab
            {...tabProps}
            investmentsHeaderTitle={investmentsHeaderTitle}
            showPortfolioSelectMenu
          />
        </>
      )}
      {activeInnerTabId === "allocation" && (
        <AllocationTab {...tabProps} showPortfolioSelectMenu />
      )}
      {activeInnerTabId === "performance" && (
        <PerformanceTab {...tabProps} showPortfolioSelectMenu />
      )}
    </div>
  );
};

export default PortfoliosWrapper;
