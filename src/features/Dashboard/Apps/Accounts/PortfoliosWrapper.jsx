// src/features/Dashboard/Apps/Accounts/PortfoliosWrapper.jsx
import React, { useState } from "react";
import { useAccountsSection } from "../../../../hooks/useAccountsSection";
import InvestmentsTab from "./Investments/InvestmentsTab";
import AllocationTab from "./Investments/AllocationTab";
import PerformanceTab from "./Investments/PerformanceTab";
import SnapshotRow from "../../../../components/ui/Snapshot/SnapshotRow";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import accountsStyles from "./Accounts.module.css";

const PortfoliosWrapper = ({ smallApp, activeInnerTabId }) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("all");

  const {
    allAccounts,
    portfolios,
    portfoliosWithSecurities,
    portfolioMetrics,
  } = useAccountsSection("all", selectedPortfolioId);

  const selectedPortfolioName =
    selectedPortfolioId === "all"
      ? "All Portfolios"
      : portfolios.find((p) => p.id === selectedPortfolioId)?.name || "";

  const portfolioSelectMenu = (
    <div className={sectionStyles.selectGroup}>
      <label htmlFor="portfolio-select" className={sectionStyles.selectLabel}>
        Portfolio:
      </label>
      <select
        id="portfolio-select"
        value={selectedPortfolioId}
        onChange={(e) => setSelectedPortfolioId(e.target.value)}
        className={sectionStyles.baseSelect}
      >
        <option value="all">All Portfolios</option>
        {portfoliosWithSecurities.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );

  const snapshotItems = [
    {
      label: "Value",
      value: `$${(
        portfolioMetrics.totalValue + portfolioMetrics.cashBalance
      ).toLocaleString()}`,
      valueClass: "positive",
    },
    {
      label: "Gain/Loss",
      value: `$${portfolioMetrics.gainLoss.toLocaleString()}`,
      valueClass: portfolioMetrics.gainLoss >= 0 ? "positive" : "negative",
      suffix: ` (${portfolioMetrics.gainLossPercent.toFixed(1)}%)`,
    },
    {
      label: "Securities",
      value: portfolioMetrics.securitiesCount.toString(),
      valueClass: "neutral",
    },
    {
      label: "Cash",
      value: `$${portfolioMetrics.cashBalance.toLocaleString()}`,
      valueClass: "neutral",
    },
  ];

  const commonTabProps = {
    smallApp,
    portfolioId: selectedPortfolioId,
    portfolioName: selectedPortfolioName,
    portfolios,
    setSelectedPortfolioId,
    selectedPortfolioId,
    portfolioSelectMenu,
    showPortfolioSelectMenu: true,
  };

  const investmentsHeaderTitle =
    selectedPortfolioId === "all"
      ? "All Investments"
      : `${selectedPortfolioName}'s Investments`;

  const showInvestments =
    !activeInnerTabId || activeInnerTabId === "investments";
  const showAllocation = activeInnerTabId === "allocation";
  const showPerformance = activeInnerTabId === "performance";

  return (
    <div className={accountsStyles.portfoliosContentContainer}>
      {/* Always render snapshot row */}
      <SnapshotRow items={snapshotItems} small={smallApp} />

      {/* Use visibility instead of conditional rendering to prevent chart re-creation */}
      <div style={{ display: showInvestments ? "block" : "none" }}>
        <InvestmentsTab
          {...commonTabProps}
          investmentsHeaderTitle={investmentsHeaderTitle}
        />
      </div>

      <div style={{ display: showAllocation ? "block" : "none" }}>
        <AllocationTab {...commonTabProps} />
      </div>

      <div style={{ display: showPerformance ? "block" : "none" }}>
        <PerformanceTab {...commonTabProps} />
      </div>
    </div>
  );
};

export default PortfoliosWrapper;
