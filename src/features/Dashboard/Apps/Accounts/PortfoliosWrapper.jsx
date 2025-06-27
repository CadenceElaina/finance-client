// src/features/Dashboard/Apps/Accounts/PortfoliosWrapper.jsx
import React, { useState, useEffect } from "react";
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

  // Reset to "all" if selected portfolio no longer exists
  useEffect(() => {
    if (selectedPortfolioId !== "all") {
      const portfolioExists = portfolios.some(
        (p) => p.id === selectedPortfolioId
      );
      if (!portfolioExists) {
        setSelectedPortfolioId("all");
      }
    }
  }, [portfolios, selectedPortfolioId]);

  const selectedPortfolioName =
    selectedPortfolioId === "all"
      ? "All Portfolios"
      : portfolios.find((p) => p.id === selectedPortfolioId)?.name || "";

  // Show ALL portfolios in dropdown with indicators for empty ones
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
        {portfolios.map((p) => {
          const hasSecurities = portfoliosWithSecurities.some(
            (ps) => ps.id === p.id
          );
          const hasAccounts = allAccounts.some(
            (acc) => acc.portfolioId === p.id && acc.category === "Investments"
          );
          return (
            <option key={p.id} value={p.id}>
              {p.name}
              {!hasAccounts
                ? " (No Accounts)"
                : !hasSecurities
                ? " (No Securities)"
                : ""}
            </option>
          );
        })}
      </select>
    </div>
  );

  // FIXED: Calculate metrics with fallback for empty portfolios
  const displayMetrics = portfolioMetrics || {
    totalValue: 0,
    cashBalance: 0,
    gainLoss: 0,
    gainLossPercent: 0,
    securitiesCount: 0,
  };

  const snapshotItems = [
    {
      label: "Value",
      value: `$${(
        displayMetrics.totalValue + displayMetrics.cashBalance
      ).toLocaleString()}`,
      valueClass: "positive",
    },
    {
      label: "Gain/Loss",
      value: `$${displayMetrics.gainLoss.toLocaleString()}`,
      valueClass: displayMetrics.gainLoss >= 0 ? "positive" : "negative",
      suffix: ` (${displayMetrics.gainLossPercent.toFixed(1)}%)`,
    },
    {
      label: "Securities",
      value: displayMetrics.securitiesCount.toString(),
      valueClass: "neutral",
    },
    {
      label: "Cash",
      value: `$${displayMetrics.cashBalance.toLocaleString()}`,
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

  // FIXED: Updated title logic for investments tab
  const investmentsHeaderTitle =
    selectedPortfolioId === "all"
      ? "All Investments"
      : `${selectedPortfolioName}'s Investments`; // FIXED: Use possessive form

  const showInvestments =
    !activeInnerTabId || activeInnerTabId === "investments";
  const showAllocation = activeInnerTabId === "allocation";
  const showPerformance = activeInnerTabId === "performance";

  return (
    <div className={accountsStyles.portfoliosContentContainer}>
      {/* Always render snapshot row */}
      <SnapshotRow items={snapshotItems} small={smallApp} />

      {/* Use visibility instead of conditional rendering to prevent chart re-creation */}
      {showInvestments && (
        <div>
          <InvestmentsTab
            key={`investments-${allAccounts.length}-${selectedPortfolioId}-${portfolios.length}`}
            {...commonTabProps}
            investmentsHeaderTitle={investmentsHeaderTitle} // FIXED: Pass correct prop name
          />
        </div>
      )}

      {showAllocation && (
        <div>
          <AllocationTab {...commonTabProps} />
        </div>
      )}

      {showPerformance && <PerformanceTab {...commonTabProps} />}
    </div>
  );
};

export default PortfoliosWrapper;
