import React from "react";
import styles from "./PayoffTimeline.module.css";
import { formatCurrency } from "../utils/formatting";

const Tooltip = ({ data, position }) => {
  if (!data) return null;

  return (
    <div
      className={`${styles.tooltip} ${data ? styles.visible : ""}`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className={styles.tooltipTitle}>Month {data.month}</div>
      <div className={styles.tooltipItem}>
        <span>Balance:</span>
        <span>{formatCurrency(data.balance)}</span>
      </div>
      <div className={styles.tooltipSeparator} />
      <div className={styles.tooltipItem}>
        <span>Principal Paid (Month):</span>
        <span>{formatCurrency(data.principal)}</span>
      </div>
      <div className={styles.tooltipItem}>
        <span>Interest Paid (Month):</span>
        <span>{formatCurrency(data.interest)}</span>
      </div>
      <div className={styles.tooltipSeparator} />
      <div className={styles.tooltipItem}>
        <span>Cumulative Principal:</span>
        <span>{formatCurrency(data.cumulativePrincipal)}</span>
      </div>
      <div className={styles.tooltipItem}>
        <span>Cumulative Interest:</span>
        <span>{formatCurrency(data.cumulativeInterest)}</span>
      </div>
    </div>
  );
};

export default Tooltip;
