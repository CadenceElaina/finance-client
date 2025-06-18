import InvestmentsTab from "./InvestmentsTab";
import AllocationTab from "./AllocationTab";
import PerformanceTab from "./PerformanceTab";

// This component is now responsible for rendering the content of a single 'inner tab'.
// handles whether to render one or multiple of these based on app size.
const PortfoliosTab = ({ tab }) => {
  if (tab === "investments") {
    return <InvestmentsTab />;
  }
  if (tab === "allocation") {
    return <AllocationTab />;
  }
  if (tab === "performance") {
    return <PerformanceTab />;
  }
  // Default to InvestmentsTab if tab is not recognized (or null/undefined)
  return <InvestmentsTab />;
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
    id: "portfolios",
    label: "Portfolios",
    innerTabs: [
      { id: "showAll", label: "All", component: () => null },
      { id: "investments", label: "Investments", component: () => null },
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
