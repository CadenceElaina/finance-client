import React, { useMemo } from "react";
import { formatCurrency, formatMonthsToYears } from "../utils/formatting";
import { calculatePayoffTimeline } from "../utils/debtCalculations";
import styles from "./PayoffTimeline.module.css";

const PayoffTimeline = ({ debt, compoundingFrequency }) => {
  const timeline = useMemo(() => {
    return calculatePayoffTimeline(
      debt.value,
      debt.interestRate || 0,
      debt.monthlyPayment,
      compoundingFrequency
    );
  }, [
    debt.value,
    debt.interestRate,
    debt.monthlyPayment,
    compoundingFrequency,
  ]);

  // Generate milestone data points for visualization
  const milestones = useMemo(() => {
    if (!timeline) return [];

    const points = [];
    const totalMonths = timeline.months;
    const milestoneCount = Math.min(
      10,
      Math.max(5, Math.floor(totalMonths / 6))
    );

    for (let i = 0; i <= milestoneCount; i++) {
      const monthIndex = Math.floor((i / milestoneCount) * totalMonths);
      const payment = timeline.paymentHistory[monthIndex];

      if (payment) {
        points.push({
          month: payment.month,
          balance: payment.balance,
          principal: payment.principal,
          interest: payment.interest,
          percentage: ((debt.value - payment.balance) / debt.value) * 100,
        });
      }
    }

    return points;
  }, [timeline, debt.value]);

  if (!timeline) {
    return (
      <div className={styles.error}>
        <p>
          Unable to calculate payoff timeline. Please check that the monthly
          payment covers the interest.
        </p>
      </div>
    );
  }

  const progressPercentage = 0; // Since this is for future projections

  return (
    <div className={styles.payoffTimeline}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {formatMonthsToYears(timeline.months)}
            </div>
            <div className={styles.summaryLabel}>Time to Payoff</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {formatCurrency(timeline.totalInterest)}
            </div>
            <div className={styles.summaryLabel}>Total Interest</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {formatCurrency(timeline.totalPaid)}
            </div>
            <div className={styles.summaryLabel}>Total Paid</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {formatCurrency(debt.monthlyPayment)}
            </div>
            <div className={styles.summaryLabel}>Monthly Payment</div>
          </div>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <h4>Payoff Progress Visualization</h4>
          <span className={styles.progressPercentage}>
            {progressPercentage.toFixed(1)}% Complete
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progress}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className={styles.progressLabels}>
          <span>Start: {formatCurrency(debt.value)}</span>
          <span>Goal: $0</span>
        </div>
      </div>

      <div className={styles.milestonesSection}>
        <h4>Payment Milestones</h4>
        <div className={styles.milestonesGrid}>
          {milestones.map((milestone, index) => (
            <div key={index} className={styles.milestone}>
              <div className={styles.milestoneMonth}>
                Month {milestone.month}
              </div>
              <div className={styles.milestoneBalance}>
                {formatCurrency(milestone.balance)}
              </div>
              <div className={styles.milestoneProgress}>
                {milestone.percentage.toFixed(1)}% paid off
              </div>
              <div className={styles.milestoneBreakdown}>
                <span>Principal: {formatCurrency(milestone.principal)}</span>
                <span>Interest: {formatCurrency(milestone.interest)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chartSection}>
        <h4>Balance Over Time</h4>
        <div className={styles.chartContainer}>
          <div className={styles.chart}>
            {milestones.map((milestone, index) => {
              const height = (milestone.balance / debt.value) * 100;
              return (
                <div key={index} className={styles.chartBar}>
                  <div
                    className={styles.bar}
                    style={{ height: `${height}%` }}
                    title={`Month ${milestone.month}: ${formatCurrency(
                      milestone.balance
                    )}`}
                  />
                  <div className={styles.chartLabel}>{milestone.month}m</div>
                </div>
              );
            })}
          </div>
          <div className={styles.chartAxis}>
            <span>{formatCurrency(debt.value)}</span>
            <span>$0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoffTimeline;
