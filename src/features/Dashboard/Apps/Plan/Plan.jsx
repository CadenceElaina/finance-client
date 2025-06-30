import React, { useState, useMemo } from "react";
import { useAppSize } from "../../../../contexts/AppSizeContext";
import { useAppSizeRef } from "../../../../hooks/useAppSizeRegistration";
import { getAppSizeClasses } from "../../../../utils/getAppSize";
import FlexibleTabs from "../../../../components/ui/Tabs/Tabs";
import RoadmapsTab from "./Roadmaps/RoadmapsTab";
import CalculatorsTab from "./Calculators/CalculatorsTab";
import ProjectionsTab from "./Projections/ProjectionsTab";
import planStyles from "./plan.module.css";

const Plan = React.memo(() => {
  const appId = "plan";
  const containerRef = useAppSizeRef(appId);
  const appSize = useAppSize(appId);
  const [activeTabId, setActiveTabId] = useState("roadmaps");

  const { smallApp, largeApp } = useMemo(
    () => getAppSizeClasses(appSize),
    [appSize]
  );

  const tabs = [
    {
      id: "roadmaps",
      label: "Roadmaps",
      component: () => <RoadmapsTab />,
    },
    {
      id: "calculators",
      label: "Calculators",
      innerTabs: [
        { id: "showAll", label: "All", component: () => null },
        { id: "compound", label: "Compound", component: () => null },
        { id: "retirement", label: "Retirement", component: () => null },
        { id: "loan", label: "Loan", component: () => null },
        { id: "savings", label: "Savings", component: () => null },
      ],
      component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
        <CalculatorsTab
          smallApp={flexTabsSmallApp}
          activeInnerTabId={activeInnerTabId}
        />
      ),
    },
    {
      id: "projections",
      label: "Projections",
      component: ({ smallApp: flexTabsSmallApp }) => (
        <ProjectionsTab smallApp={flexTabsSmallApp} />
      ),
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`${planStyles.planAppContainer} ${
        smallApp ? "smallApp" : ""
      } ${largeApp ? "largeApp" : ""}`}
    >
      <FlexibleTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        smallApp={smallApp}
        largeApp={largeApp}
        className={planStyles.planTabs}
        contentClassName={planStyles.planTabContent}
        alwaysShowInnerTabsAsRow={true}
      />
    </div>
  );
});

Plan.displayName = "Plan";
export default Plan;
