// src/features/Dashboard/Apps/Plan/Plan.jsx
import React, { useRef, useState, useEffect } from "react";
import FlexibleTabs from "../../../../components/ui/Tabs/Tabs";
import GoalsTab from "./Goals/GoalsTab";
import CalculatorsTab from "./Calculators/CalculatorsTab";
import ProjectionsTab from "./Projections/ProjectionsTab";
import planStyles from "./plan.module.css";
import { getAppSize } from "../../../../utils/getAppSize";

const Plan = () => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const setInitialSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    setInitialSize();
    const resizeObserver = new window.ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width, height });
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const appSize = getAppSize(containerSize);
  const smallApp = appSize === "small";
  const largeApp = appSize === "large";

  const [activeTabId, setActiveTabId] = useState("goals");

  const tabs = [
    {
      id: "goals",
      label: "Goals",
      innerTabs: [
        { id: "showAll", label: "All", component: () => null },
        { id: "active", label: "Active", component: () => null },
        { id: "completed", label: "Completed", component: () => null },
      ],
      component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
        <GoalsTab
          smallApp={flexTabsSmallApp}
          activeInnerTabId={activeInnerTabId}
        />
      ),
    },
    {
      id: "calculators",
      label: "Calculators",
      innerTabs: [
        { id: "showAll", label: "All", component: () => null },
        { id: "compound", label: "Compound", component: () => null },
        { id: "retirement", label: "Retirement", component: () => null },
        { id: "loan", label: "Loan", component: () => null },
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
      className={`
        ${planStyles.planAppContainer}
        ${smallApp ? "smallApp" : ""}
        ${largeApp ? "largeApp" : ""}
      `}
    >
      <FlexibleTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        smallApp={smallApp}
        largeApp={largeApp}
        className={`
          ${planStyles.planTabs}
          ${smallApp ? "smallApp" : ""}
          ${largeApp ? "largeApp" : ""}
        `}
        contentClassName={planStyles.planTabContent}
        alwaysShowInnerTabsAsRow={true}
      />
    </div>
  );
};

export default Plan;
