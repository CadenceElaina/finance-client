import React, { useRef, useState, useEffect } from "react";
import BudgetOverviewWrapper from "./BudgetOverviewWrapper";
import budgetStyles from "./budget.module.css";
import { getAppSize } from "../../../../utils/getAppSize";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";

const Budget = () => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

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

  // For small apps, we can still use the inner tab selection for different views
  const [activeInnerTabId, setActiveInnerTabId] = useState("showAll");

  return (
    <div
      ref={containerRef}
      className={`
        ${budgetStyles.budgetAppContainer}
        ${smallApp ? "smallApp" : ""}
        ${largeApp ? "largeApp" : ""}
      `}
    >
      {smallApp ? (
        // Small app: Show simple button navigation for different views
        <div className={budgetStyles.budgetAppContent}>
          <div className={budgetStyles.smallAppNav}>
            <button
              className={`${budgetStyles.navButton} ${
                activeInnerTabId === "showAll" ? budgetStyles.active : ""
              }`}
              onClick={() => setActiveInnerTabId("showAll")}
            >
              All
            </button>
            <button
              className={`${budgetStyles.navButton} ${
                activeInnerTabId === "income" ? budgetStyles.active : ""
              }`}
              onClick={() => setActiveInnerTabId("income")}
            >
              Income
            </button>
            <button
              className={`${budgetStyles.navButton} ${
                activeInnerTabId === "expenses" ? budgetStyles.active : ""
              }`}
              onClick={() => setActiveInnerTabId("expenses")}
            >
              Expenses
            </button>
            <button
              className={`${budgetStyles.navButton} ${
                activeInnerTabId === "summary" ? budgetStyles.active : ""
              }`}
              onClick={() => setActiveInnerTabId("summary")}
            >
              Chart
            </button>
          </div>
          <div className={budgetStyles.budgetTabContent}>
            <BudgetOverviewWrapper
              smallApp={smallApp}
              activeInnerTabId={activeInnerTabId}
            />
          </div>
        </div>
      ) : (
        // Medium/Large app: Show all sections directly
        <div className={budgetStyles.budgetTabContent}>
          <BudgetOverviewWrapper
            smallApp={smallApp}
            activeInnerTabId="showAll"
          />
        </div>
      )}
    </div>
  );
};

export default Budget;
