import React from "react";
import HoldingsTab from "./HoldingsTab";
import AllocationTab from "./AllocationTab";
import PerformanceTab from "./PerformanceTab";

// This component is now responsible for rendering the content of a single 'inner tab'.
// The 'smallApp' prop is no longer needed here, as the parent (InvestmentsWrapper)
// handles whether to render one or multiple of these based on app size.
const PortfoliosTab = ({ tab }) => {
  if (tab === "holdings") {
    return <HoldingsTab />;
  }
  if (tab === "allocation") {
    return <AllocationTab />;
  }
  if (tab === "performance") {
    return <PerformanceTab />;
  }
  // Default to holdings if tab is not recognized (or null/undefined)
  return <HoldingsTab />;
};

const tabs = [
  {
    id: "overview",
    label: "Overview",
    component: ({ smallApp: flexTabsSmallApp }) => (
      <OverviewTab smallApp={flexTabsSmallApp} />
    ),
  },
  { id: "assets", label: "Assets", component: () => <AssetsTab /> },
  {
    id: "liabilities",
    label: "Liabilities",
    component: () => <LiabilitiesTab />,
  },
  {
    id: "portfolios", // changed from 'investments'
    label: "Portfolios", // changed from 'Investments'
    innerTabs: [
      { id: "showAll", label: "All", component: () => null },
      { id: "holdings", label: "Investments", component: () => null }, // changed label
      { id: "allocation", label: "Allocation", component: () => null },
      { id: "performance", label: "Performance", component: () => null },
    ],
    component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
      <InvestmentsWrapper
        smallApp={flexTabsSmallApp}
        activeInnerTabId={activeInnerTabId}
      />
    ),
  },
];

export default PortfoliosTab;
