import React, { useMemo, useState } from "react";
import { formatCurrency, formatMonthsToYears } from "../utils/formatting";
import { calculatePayoffTimeline } from "../utils/debtCalculations";
import styles from "./PayoffTimeline.module.css";
import Tooltip from "./Tooltip";

const PayoffTimeline = ({ debt, compoundingFrequency = 12 }) => {
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeline = useMemo(() => {
    if (!debt || !debt.value || !debt.monthlyPayment) return null;
    return calculatePayoffTimeline(
      debt.value,
      debt.interestRate || 0,
      debt.monthlyPayment,
      compoundingFrequency
    );
  }, [debt, compoundingFrequency]);

  // Generate milestone data points for visualization
  const milestones = useMemo(() => {
    if (!timeline || !debt) return [];

    const points = [];
    const totalMonths = timeline.months;

    // Add key milestone points based on timeline length (exclude start and finish)
    const milestoneMonths = [];
    if (totalMonths <= 12) {
      // For debts paid off within a year, show every 3 months (but not start or finish)
      milestoneMonths.push(...[3, 6, 9].filter((m) => m < totalMonths));
    } else if (totalMonths <= 36) {
      // For debts paid off within 3 years, show every 6 months (but not start or finish)
      milestoneMonths.push(
        ...[6, 12, 18, 24, 30].filter((m) => m < totalMonths)
      );
    } else {
      // For longer debts, show yearly milestones (but not start or finish)
      for (let year = 1; year < Math.ceil(totalMonths / 12); year++) {
        const month = year * 12;
        if (month < totalMonths) milestoneMonths.push(month);
      }
    }

    // Add the milestones
    milestoneMonths.forEach((month) => {
      const payment = timeline.paymentHistory[month - 1];
      if (payment) {
        const cumulativePrincipal = timeline.paymentHistory
          .slice(0, month)
          .reduce((sum, p) => sum + p.principal, 0);
        const cumulativeInterest = timeline.paymentHistory
          .slice(0, month)
          .reduce((sum, p) => sum + p.interest, 0);

        points.push({
          month: payment.month,
          balance: payment.balance,
          principal: payment.principal,
          interest: payment.interest,
          percentage: ((debt.value - payment.balance) / debt.value) * 100,
          cumulativePrincipal,
          cumulativeInterest,
        });
      }
    });

    return points;
  }, [timeline, debt]);

  // Generate monthly chart data for the chart (separate from milestones)
  const chartData = useMemo(() => {
    if (!timeline || !debt) return [];

    const points = [];
    const maxDisplayMonths = timeline.months; // Show all months up to payoff

    // Add monthly points for chart
    for (let month = 1; month <= maxDisplayMonths; month++) {
      const payment = timeline.paymentHistory[month - 1];
      if (payment) {
        const cumulativePrincipal = timeline.paymentHistory
          .slice(0, month)
          .reduce((sum, p) => sum + p.principal, 0);
        const cumulativeInterest = timeline.paymentHistory
          .slice(0, month)
          .reduce((sum, p) => sum + p.interest, 0);

        points.push({
          month: payment.month,
          ...payment,
          cumulativePrincipal,
          cumulativeInterest,
        });
      }
    }

    return points;
  }, [timeline, debt]);

  // Calculate interest ratio for visual emphasis
  const interestRatio = useMemo(() => {
    if (!timeline || timeline.totalPaid === 0) return 0;
    return (timeline.totalInterest / timeline.totalPaid) * 100;
  }, [timeline]);

  if (!debt) {
    return (
      <div className={styles.error}>
        <p>No debt selected. Please select a debt from the dropdown above.</p>
      </div>
    );
  }

  if (!debt.value || debt.value <= 0) {
    return (
      <div className={styles.error}>
        <p>Invalid debt amount. Please check the debt details.</p>
      </div>
    );
  }

  if (!debt.monthlyPayment || debt.monthlyPayment <= 0) {
    return (
      <div className={styles.error}>
        <p>
          No monthly payment specified. Please set a monthly payment amount.
        </p>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className={styles.error}>
        <p>
          Unable to calculate payoff timeline. The monthly payment may be too
          low to cover interest charges.
        </p>
        <p>
          <small>
            Minimum payment needed: ~
            {formatCurrency((debt.value * (debt.interestRate || 0)) / 1200)}
          </small>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.payoffTimeline}>
      {/* Consolidated Summary & Key Insights */}
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

        <div className={styles.insightsGrid}>
          <div className={styles.compactInsight}>
            <span className={styles.insightIcon}>💰</span>
            <div className={styles.insightText}>
              <strong>Interest Impact:</strong> You'll pay{" "}
              {formatCurrency(timeline.totalInterest)} in interest, which is{" "}
              {interestRatio.toFixed(1)}% of your total payments.
            </div>
          </div>
          <div className={styles.compactInsight}>
            <span className={styles.insightIcon}>⏱️</span>
            <div className={styles.insightText}>
              <strong>Payoff Timeline:</strong> At{" "}
              {formatCurrency(debt.monthlyPayment)} per month, this debt will be
              fully paid off in {formatMonthsToYears(timeline.months)}.
            </div>
          </div>
          <div className={styles.compactInsight}>
            <span className={styles.insightIcon}>📊</span>
            <div className={styles.insightText}>
              <strong>Early Progress:</strong> The first year will reduce your
              balance by approximately{" "}
              {formatCurrency(
                Math.min(12 * debt.monthlyPayment * 0.7, debt.value * 0.3)
              )}
              .
            </div>
          </div>
        </div>
      </div>

      {/* Key Milestones */}
      {milestones.length > 0 && (
        <div className={styles.milestonesSection}>
          <h4>Payment Milestones</h4>
          <div className={styles.milestonesGrid}>
            {milestones.map((milestone, index) => (
              <div key={`milestone-${index}`} className={styles.milestone}>
                <div className={styles.milestoneHeader}>
                  <div className={styles.milestoneMonth}>
                    Month {milestone.month}
                  </div>
                  <div className={styles.milestoneProgress}>
                    {milestone.percentage.toFixed(1)}% complete
                  </div>
                </div>
                <div className={styles.milestoneBalance}>
                  Balance: {formatCurrency(milestone.balance)}
                </div>
                <div className={styles.milestoneBreakdown}>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>
                      Cumulative Principal:
                    </span>
                    <span className={styles.breakdownValue}>
                      {formatCurrency(milestone.cumulativePrincipal)}
                    </span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>
                      Cumulative Interest:
                    </span>
                    <span className={styles.breakdownValue}>
                      {formatCurrency(milestone.cumulativeInterest)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Chart - Monthly Balance Reduction */}
      <div className={styles.chartSection}>
        <h4>Debt Payoff Progress</h4>
        <div className={styles.chartContainer}>
          <div className={styles.chart}>
            <div className={styles.chartYAxis}>
              <span>{formatCurrency(debt.value)}</span>
              <span>{formatCurrency(debt.value * 0.75)}</span>
              <span>{formatCurrency(debt.value * 0.5)}</span>
              <span>{formatCurrency(debt.value * 0.25)}</span>
              <span>$0</span>
            </div>
            <div className={styles.chartBars}>
              {chartData.map((dataPoint, index) => {
                // Calculate height as percentage of remaining balance (decreasing bar)
                const balanceHeight = Math.max(
                  0,
                  (dataPoint.balance / debt.value) * 100
                );
                const isEnd = dataPoint.balance <= 0;

                // Color intensity: changes as balance gets closer to zero
                // Color intensity: changes as balance gets closer to zero, from red to green
                const balanceIntensity = Math.max(
                  0,
                  dataPoint.balance / debt.value
                ); // 1 (full) to 0 (empty)
                const hue = 120 * (1 - balanceIntensity); // 0 (red) -> 60 (yellow) -> 120 (green)
                const saturation = 85;
                const lightness = 50;

                const handleMouseMove = (e) => {
                  setTooltipData(dataPoint);
                  setTooltipPosition({ x: e.clientX + 15, y: e.clientY - 80 });
                };

                const handleMouseLeave = () => {
                  setTooltipData(null);
                };

                return (
                  <div key={`bar-${index}`} className={styles.chartBar}>
                    <div
                      className={`${styles.barSingle} ${
                        isEnd ? styles.barComplete : ""
                      }`}
                      style={{
                        height: `${balanceHeight}%`,
                        backgroundColor: isEnd
                          ? "var(--success-color)"
                          : `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                    <div className={styles.chartLabel}>
                      {(dataPoint.month === 1 ||
                        (dataPoint.month - 1) % 4 === 0) &&
                      dataPoint.month < timeline.months
                        ? dataPoint.month
                        : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Tooltip data={tooltipData} position={tooltipPosition} />
        </div>
      </div>
    </div>
  );
};

export default PayoffTimeline;
