import React, { useState, useMemo, useEffect } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import Section from "../../../../../components/ui/Section/Section";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import DebtCard from "./components/DebtCard";
import PayoffTimeline from "./components/PayoffTimeline";
import {
  calculatePayoffTimeline,
  calculateDebtUrgency,
  calculateDebtToIncomeRatio,
} from "./utils/debtCalculations";
import {
  formatCurrency,
  formatPercentage,
  formatMonthsToYears,
} from "./utils/formatting";
import styles from "./DebtTab.module.css";

const DebtTab = ({ activeInnerTabId = "overviewBalance" }) => {
  const { data } = useFinancialData();
  const [timelineSelectedDebtId, setTimelineSelectedDebtId] = useState(null);
  const [sortBy, setSortBy] = useState("urgency");

  // Fixed compounding frequency - most debts compound monthly
  const compoundingFrequency = 12;

  // Memoize accounts and income to prevent unnecessary re-renders
  const accounts = useMemo(() => data?.accounts || [], [data?.accounts]);
  const budget = useMemo(() => data?.budget || {}, [data?.budget]);

  // Filter debt accounts
  const debtAccounts = useMemo(() => {
    return accounts.filter(
      (account) =>
        account.category === "Debt" &&
        Math.abs(account.value) > 0 && // Use absolute value since debt can be negative
        account.monthlyPayment > 0
    );
  }, [accounts]);

  // Enrich debt accounts with calculations
  const enrichedDebts = useMemo(() => {
    return debtAccounts
      .map((debt, index) => {
        const balance = Math.abs(debt.value); // Convert negative debt to positive balance
        const timeline = calculatePayoffTimeline(
          balance,
          debt.interestRate || 0,
          debt.monthlyPayment,
          compoundingFrequency
        );

        const urgencyScore = calculateDebtUrgency({
          ...debt,
          value: balance, // Pass positive balance to urgency calculation
        });

        return {
          ...debt,
          value: balance, // Store as positive balance for display
          timeline,
          urgencyScore,
          // Create a stable, unique key for rendering that doesn't rely on a potentially non-unique ID
          uniqueRenderKey: `${debt.id}-${index}`,
        };
      })
      .filter((debt) => debt.timeline); // Only include debts with valid timelines
  }, [debtAccounts]);

  // Calculate total metrics
  const totalMetrics = useMemo(() => {
    const totalBalance = enrichedDebts.reduce(
      (sum, debt) => sum + debt.value,
      0
    );
    const totalMonthlyPayments = enrichedDebts.reduce(
      (sum, debt) => sum + debt.monthlyPayment,
      0
    );
    const totalInterest = enrichedDebts.reduce(
      (sum, debt) => sum + (debt.timeline ? debt.timeline.totalInterest : 0),
      0
    );

    // Estimate overall payoff time (when last debt is paid off)
    const payoffMonths =
      enrichedDebts.length > 0
        ? Math.max(
            ...enrichedDebts.map((debt) =>
              debt.timeline ? debt.timeline.months : 0
            ),
            0
          )
        : 0;

    // Get monthly income from budget
    const monthlyIncome = budget?.income?.monthlyAfterTax || 0;
    const debtToIncomeRatio = calculateDebtToIncomeRatio(
      totalMonthlyPayments,
      monthlyIncome
    );

    return {
      totalBalance,
      totalMonthlyPayments,
      totalInterest,
      payoffMonths,
      payoffYears: Math.round((payoffMonths / 12) * 10) / 10,
      debtToIncomeRatio,
    };
  }, [enrichedDebts, budget]);

  // Sort debts based on selected strategy
  const sortedDebts = useMemo(() => {
    const debtsCopy = [...enrichedDebts];

    switch (sortBy) {
      case "urgency":
        return debtsCopy.sort((a, b) => b.urgencyScore - a.urgencyScore);
      case "avalanche":
        return debtsCopy.sort((a, b) => b.interestRate - a.interestRate);
      case "snowball":
        return debtsCopy.sort((a, b) => a.value - b.value);
      case "balance":
        return debtsCopy.sort((a, b) => b.value - a.value);
      case "payment":
        return debtsCopy.sort((a, b) => b.monthlyPayment - a.monthlyPayment);
      default:
        return debtsCopy;
    }
  }, [enrichedDebts, sortBy]);

  // Get the selected debt object for timeline tab
  const timelineSelectedDebt = useMemo(
    () =>
      enrichedDebts.find(
        (debt) => debt.uniqueRenderKey === timelineSelectedDebtId
      ) || null,
    [timelineSelectedDebtId, enrichedDebts]
  );

  // **IMPORTANT: Timeline selection logic**

  useEffect(() => {
    // Initialize timeline selection when debts first load
    if (enrichedDebts.length > 0 && timelineSelectedDebtId === null) {
      setTimelineSelectedDebtId(enrichedDebts[0].uniqueRenderKey);
    }
    // If selected debt no longer exists, fallback to first debt
    else if (enrichedDebts.length > 0 && timelineSelectedDebtId) {
      const selectionStillExists = enrichedDebts.some(
        (d) => d.uniqueRenderKey === timelineSelectedDebtId
      );
      if (!selectionStillExists) {
        setTimelineSelectedDebtId(enrichedDebts[0].uniqueRenderKey);
      }
    }
    // If no debts exist, clear the selection
    else if (enrichedDebts.length === 0 && timelineSelectedDebtId !== null) {
      setTimelineSelectedDebtId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedDebts]); // Intentionally omitting timelineSelectedDebtId to prevent infinite loops

  // Create snapshot items for debt overview
  const debtSnapshotItems = useMemo(() => {
    const getDebtRatioStatus = (ratio) => {
      if (ratio > 40) return "critical";
      if (ratio > 28) return "warning";
      if (ratio > 20) return "caution";
      return "good";
    };

    const ratioStatus = getDebtRatioStatus(totalMetrics.debtToIncomeRatio);

    return [
      {
        label: "Total Debt Balance",
        value: formatCurrency(totalMetrics.totalBalance),
        valueClass: "negative",
        subtext: `Across ${enrichedDebts.length} debt account${
          enrichedDebts.length !== 1 ? "s" : ""
        }`,
      },
      {
        label: "Monthly Payments",
        value: formatCurrency(totalMetrics.totalMonthlyPayments),
        valueClass: "neutral",
        subtext: "Combined minimum payments",
      },
      {
        label: "Total Interest Cost",
        value: formatCurrency(totalMetrics.totalInterest),
        valueClass: "warning",
        subtext: "If paid as scheduled",
      },
      {
        label: "Debt-Free Timeline",
        value: formatMonthsToYears(totalMetrics.payoffMonths),
        valueClass: "neutral",
        subtext: "Last debt payoff date",
      },
      {
        label: "Debt-to-Income Ratio",
        value: formatPercentage(totalMetrics.debtToIncomeRatio, 1),
        valueClass:
          ratioStatus === "good"
            ? "positive"
            : ratioStatus === "caution"
            ? "warning"
            : "negative",
        subtext:
          ratioStatus === "good"
            ? "Healthy ratio"
            : ratioStatus === "caution"
            ? "Monitor closely"
            : ratioStatus === "warning"
            ? "Consider reduction"
            : "Immediate attention needed",
      },
    ];
  }, [totalMetrics, enrichedDebts.length]);

  // Safety check for data - moved after all hooks
  if (!data) {
    return (
      <div className={styles.emptyState}>
        <h3>Loading...</h3>
        <p>Please wait while we load your financial data.</p>
      </div>
    );
  }

  // Handle no debt accounts scenario
  if (debtAccounts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No Debt Accounts Found</h3>
        <p>
          Add debt accounts in the Overview tab to start tracking your debt
          payoff journey.
        </p>
        <p>
          Make sure to set the category to "Debt" and include monthly payment
          amounts.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.debtTab}>
      {/* Always show snapshot row above content */}
      <SnapshotRow items={debtSnapshotItems} small={true} columns={5} />

      {/* Overview tab */}
      <div
        className={styles.tabContent}
        style={{
          display: activeInnerTabId === "overviewBalance" ? "block" : "none",
        }}
      >
        <Section
          key="overviewSection" // STATIC and UNIQUE key
          header={
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Your Debts</h3>
              <div className={styles.sortControls}>
                <label htmlFor="debt-sort" className={styles.sortLabel}>
                  Sort by:
                </label>
                <select
                  id="debt-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="urgency">Urgency Score</option>
                  <option value="avalanche">Interest Rate (Highest)</option>
                  <option value="snowball">Balance (Lowest)</option>
                  <option value="balance">Balance (Highest)</option>
                  <option value="payment">Monthly Payment</option>
                </select>
              </div>
            </div>
          }
        >
          <div className={styles.debtGrid}>
            {/* The DebtCard has its own unique key prop: debt.id */}
            {sortedDebts.map((debt, index) => (
              <DebtCard
                key={debt.uniqueRenderKey}
                debt={debt}
                compoundingFrequency={compoundingFrequency}
                rank={index + 1}
                sortBy={sortBy}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* Payoff Timeline Tab */}
      <div
        className={styles.tabContent}
        style={{
          display: activeInnerTabId === "payoffTimeline" ? "block" : "none",
        }}
      >
        <Section
          key="payoffTimelineSection" // STATIC and UNIQUE key
          header={
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Payoff Timeline</h3>
              <div className={styles.selectWrapper}>
                <label
                  htmlFor="timeline-debt-select"
                  className={styles.selectLabel}
                >
                  Select Debt:
                </label>
                <select
                  id="timeline-debt-select"
                  value={timelineSelectedDebtId || ""}
                  onChange={(e) => {
                    setTimelineSelectedDebtId(e.target.value);
                  }}
                  className={styles.debtSelect}
                >
                  {enrichedDebts.map((debt) => (
                    <option
                      key={debt.uniqueRenderKey}
                      value={debt.uniqueRenderKey}
                    >
                      {debt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        >
          {timelineSelectedDebt ? (
            <PayoffTimeline
              key={timelineSelectedDebt.uniqueRenderKey}
              debt={timelineSelectedDebt}
              compoundingFrequency={compoundingFrequency}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>Please select a debt to view the payoff timeline.</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default DebtTab;
