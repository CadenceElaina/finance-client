import React, { useRef, useState, useEffect } from "react";
import BudgetOverviewWrapper from "./BudgetOverviewWrapper";
import IncomeTab from "./IncomeTab";
import FlexibleTabs from "../../../../components/ui/Tabs/Tabs";
import budgetStyles from "./budget.module.css"; // Renamed to budgetStyles for consistency
import { getAppSize } from "../../../../utils/getAppSize";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import BudgetChartsTab from "./BudgetChartsTab";

const Budget = () => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });
  const { data, updateIncome, addExpense, updateExpense, removeExpense } =
    useFinancialData();
  const budget = data.budget;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();

    let resizeObserver = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === containerRef.current) {
            const { width, height } = entry.contentRect;
            setContainerSize({ width, height });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateSize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const appSize = getAppSize(containerSize);
  const smallApp = appSize === "small";
  const largeApp = appSize === "large";

  const [activeMainTabId, setActiveMainTabId] = useState("budget");

  const tabs = [
    {
      id: "budget",
      label: "Overview",
      innerTabs: [
        { id: "showAll", label: "All", component: () => null },
        { id: "summary", label: "Summary", component: () => null },
        { id: "expenses", label: "Expenses", component: () => null },
      ],
      component: ({ smallApp: flexTabsSmallApp, activeInnerTabId }) => (
        <BudgetOverviewWrapper
          smallApp={flexTabsSmallApp}
          activeInnerTabId={activeInnerTabId}
        />
      ),
    },
    {
      id: "charts",
      label: "Charts",
      component: ({ smallApp: flexTabsSmallApp }) => (
        <BudgetChartsTab
          expenses={budget.monthlyExpenses}
          smallApp={flexTabsSmallApp}
        />
      ),
    },
    {
      id: "income",
      label: "Income",
      component: () => <IncomeTab />,
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`
                ${budgetStyles.budgetAppContainer}
                ${smallApp ? "smallApp" : ""}
                ${largeApp ? "largeApp" : ""}
            `}
    >
      <FlexibleTabs
        tabs={tabs}
        activeTabId={activeMainTabId}
        onTabChange={setActiveMainTabId}
        smallApp={smallApp}
        largeApp={largeApp}
        className={`
                    ${budgetStyles.budgetAppContainer}
                    ${smallApp ? "smallApp" : ""}
                    ${largeApp ? "largeApp" : ""}
                `}
        contentClassName={budgetStyles.budgetTabContent}
      />
    </div>
  );
};

export default Budget;
