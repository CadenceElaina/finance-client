import React from "react";
import { formatCurrency, formatPercentage } from "../utils/formatting";
import styles from "./DebtCard.module.css";

const DebtCard = ({ debt, isSelected, onSelect }) => {
  const {
    name,
    subType,
    value: balance,
    interestRate,
    monthlyPayment,
    timeline,
    urgencyScore,
  } = debt;

  const getUrgencyLevel = (score) => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const urgencyLevel = getUrgencyLevel(urgencyScore);

  const progressPercentage = timeline
    ? Math.max(
        0,
        Math.min(
          100,
          ((timeline.months - timeline.months) / timeline.months) * 100
        )
      )
    : 0;

  return (
    <div
      className={`${styles.debtCard} ${isSelected ? styles.selected : ""} ${
        styles[urgencyLevel]
      }`}
      onClick={onSelect}
    >
      <div className={styles.header}>
        <div className={styles.nameSection}>
          <h3 className={styles.debtName}>{name}</h3>
          <span className={styles.debtType}>{subType}</span>
        </div>
        <div className={styles.urgencyBadge}>
          <span className={styles.urgencyScore}>
            {Math.round(urgencyScore)}
          </span>
          <span className={styles.urgencyLabel}>Priority</span>
        </div>
      </div>

      <div className={styles.balanceSection}>
        <div className={styles.currentBalance}>
          <span className={styles.label}>Current Balance</span>
          <span className={styles.amount}>{formatCurrency(balance)}</span>
        </div>
        <div className={styles.interestRate}>
          <span className={styles.label}>Interest Rate</span>
          <span className={styles.rate}>{formatPercentage(interestRate)}</span>
        </div>
      </div>

      <div className={styles.paymentSection}>
        <div className={styles.monthlyPayment}>
          <span className={styles.label}>Monthly Payment</span>
          <span className={styles.payment}>
            {formatCurrency(monthlyPayment)}
          </span>
        </div>
      </div>

      {timeline && (
        <div className={styles.timelineSection}>
          <div className={styles.payoffInfo}>
            <div className={styles.timeToPayoff}>
              <span className={styles.label}>Payoff Time</span>
              <span className={styles.time}>
                {timeline.years} years ({timeline.months} months)
              </span>
            </div>
            <div className={styles.totalInterest}>
              <span className={styles.label}>Total Interest</span>
              <span className={styles.interest}>
                {formatCurrency(timeline.totalInterest)}
              </span>
            </div>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.clickHint}>Click for detailed analysis</span>
      </div>
    </div>
  );
};

export default DebtCard;
