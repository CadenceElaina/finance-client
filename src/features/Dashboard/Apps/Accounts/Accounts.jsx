import React, { useState, useMemo } from "react";
import { useAppSize } from "../../../../contexts/AppSizeContext";
import { useAppSizeRef } from "../../../../hooks/useAppSizeRegistration";
import { getAppSizeClasses } from "../../../../utils/getAppSize";
import Tabs from "../../../../components/ui/Tabs/Tabs";
import OverviewTab from "./Overview/OverviewTab";
import PortfoliosWrapper from "./PortfoliosWrapper";
import DebtTab from "./Debt/DebtTab";
import TransactionsTab from "./Transactions/TransactionsTab";
import accountsStyles from "./Accounts.module.css";

const Accounts = React.memo(() => {
  const appId = "accounts";
  const containerRef = useAppSizeRef(appId);
  const appSize = useAppSize(appId);
  const [activeTabId, setActiveTabId] = useState("overview");
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Memoize size-dependent values
  const sizeClasses = useMemo(() => getAppSizeClasses(appSize), [appSize]);
  const { smallApp, largeApp } = sizeClasses;

  // Memoize container classes
  const containerClassName = useMemo(
    () =>
      `
    ${accountsStyles.accountsAppContainer}
    ${smallApp ? "smallApp" : ""}
    ${largeApp ? "largeApp" : ""}
  `.trim(),
    [smallApp, largeApp]
  );

  const tabsClassName = useMemo(
    () =>
      `
    ${accountsStyles.accountsTabs}
    ${smallApp ? "smallApp" : ""}
    ${largeApp ? "largeApp" : ""}
  `.trim(),
    [smallApp, largeApp]
  );

  // Memoize tabs configuration
  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        component: ({ smallApp: flexTabsSmallApp }) => (
          <OverviewTab
            smallApp={flexTabsSmallApp}
            onAccountClick={(accountId) => {
              setSelectedAccountId(accountId);
              setActiveTabId("transactions");
            }}
          />
        ),
      },
      {
        id: "debt",
        label: "Debt",
        innerTabs: [
          { id: "overviewBalance", label: "Overview" },
          { id: "balances", label: "Balances" },
          { id: "debtPriorities", label: "Debt Priorities" },
          { id: "payoffTimeline", label: "Payoff Timeline" },
          { id: "amortization", label: "Amortization" },
        ],
        component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
          <DebtTab
            smallApp={flexTabsSmallApp}
            activeInnerTabId={activeInnerTabId}
          />
        ),
      },
      {
        id: "portfolios",
        label: "Portfolios",
        innerTabs: [
          { id: "investments", label: "Investments", component: () => null },
          { id: "allocation", label: "Allocation", component: () => null },
          { id: "performance", label: "Performance", component: () => null },
        ],
        component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
          <PortfoliosWrapper
            smallApp={flexTabsSmallApp}
            activeInnerTabId={activeInnerTabId}
          />
        ),
      },
      {
        id: "transactions",
        label: "Transactions",
        component: ({ smallApp: flexTabsSmallApp }) => (
          <TransactionsTab
            smallApp={flexTabsSmallApp}
            accountId={selectedAccountId}
          />
        ),
      },
    ],
    [selectedAccountId]
  );

  return (
    <div ref={containerRef} className={containerClassName}>
      <Tabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        smallApp={smallApp}
        largeApp={largeApp}
        className={tabsClassName}
        contentClassName={accountsStyles.accountsTabContent}
        alwaysShowInnerTabsAsRow={true}
      />
    </div>
  );
});

Accounts.displayName = "Accounts";

export default Accounts;
