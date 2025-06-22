import React, { useMemo, useState } from "react";
import { useAppSize } from "../../../../contexts/AppSizeContext";
import { useAppSizeRef } from "../../../../hooks/useAppSizeRegistration";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import { getAppSizeClasses } from "../../../../utils/getAppSize";
import BudgetOverviewWrapper from "./BudgetOverviewWrapper";
import budgetStyles from "./budget.module.css";

const Budget = React.memo(() => {
  const appId = "budget";
  const containerRef = useAppSizeRef(appId);
  const appSize = useAppSize(appId);
  const [activeInnerTabId, setActiveInnerTabId] = useState("showAll");

  // FIXED: Add financial data check
  const financialDataResult = useFinancialData();

  // FIXED: Handle loading state
  if (!financialDataResult?.data) {
    return (
      <div
        ref={containerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "var(--text-secondary)",
        }}
      >
        <div>Loading budget data...</div>
      </div>
    );
  }

  // Memoize size-dependent values
  const sizeClasses = useMemo(() => getAppSizeClasses(appSize), [appSize]);
  const { smallApp, largeApp } = sizeClasses;

  // Memoize the container class string
  const containerClassName = useMemo(
    () =>
      `
    ${budgetStyles.budgetAppContainer}
    ${smallApp ? "smallApp" : ""}
    ${largeApp ? "largeApp" : ""}
  `.trim(),
    [smallApp, largeApp]
  );

  return (
    <div ref={containerRef} className={containerClassName}>
      {smallApp ? (
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
        <div className={budgetStyles.budgetTabContent}>
          <BudgetOverviewWrapper
            smallApp={smallApp}
            activeInnerTabId="showAll"
          />
        </div>
      )}
    </div>
  );
});

Budget.displayName = "Budget";

export default Budget;
