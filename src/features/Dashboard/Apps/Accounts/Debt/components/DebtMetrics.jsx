import React from "react";
import {
  formatCurrency,
  formatPercentage,
  formatMonthsToYears,
} from "../utils/formatting";
import { getCompoundingFrequencies } from "../utils/debtCalculations";
import styles from "./DebtMetrics.module.css";

const DebtMetrics = ({
  metrics,
  debtCount,
  compoundingFrequency,
  onCompoundingChange,
}) => {
  const {
    totalBalance,
    totalMonthlyPayments,
    totalInterest,
    payoffMonths,
    debtToIncomeRatio,
  } = metrics;

  const compoundingOptions = getCompoundingFrequencies();
  const selectedFrequency = compoundingOptions.find(
    (opt) => opt.value === compoundingFrequency
  );

  const getDebtRatioStatus = (ratio) => {
    if (ratio > 40) return "critical";
    if (ratio > 28) return "warning";
    if (ratio > 20) return "caution";
    return "good";
  };

  const ratioStatus = getDebtRatioStatus(debtToIncomeRatio);

  return (
    <div className={styles.debtMetrics}>
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatCurrency(totalBalance)}
          </div>
          <div className={styles.metricLabel}>Total Debt Balance</div>
          <div className={styles.metricSubtext}>
            Across {debtCount} debt account{debtCount !== 1 ? "s" : ""}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatCurrency(totalMonthlyPayments)}
          </div>
          <div className={styles.metricLabel}>Monthly Payments</div>
          <div className={styles.metricSubtext}>Combined minimum payments</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatCurrency(totalInterest)}
          </div>
          <div className={styles.metricLabel}>Total Interest Cost</div>
          <div className={styles.metricSubtext}>If paid as scheduled</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatMonthsToYears(payoffMonths)}
          </div>
          <div className={styles.metricLabel}>Debt-Free Timeline</div>
          <div className={styles.metricSubtext}>Last debt payoff date</div>
        </div>

        <div className={`${styles.metricCard} ${styles[ratioStatus]}`}>
          <div className={styles.metricValue}>
            {formatPercentage(debtToIncomeRatio, 1)}
          </div>
          <div className={styles.metricLabel}>Debt-to-Income Ratio</div>
          <div className={styles.metricSubtext}>
            {ratioStatus === "good" && "Healthy ratio"}
            {ratioStatus === "caution" && "Monitor closely"}
            {ratioStatus === "warning" && "Consider reduction"}
            {ratioStatus === "critical" && "Immediate attention needed"}
          </div>
        </div>
      </div>{" "}
    </div>
  );
};

export default DebtMetrics;
