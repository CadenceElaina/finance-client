import React from "react";
import styles from "./PayoffTimeline.module.css";
import { formatCurrency } from "../utils/formatting";

const Tooltip = ({ data, position }) => {
  if (!data) return null;

  return (
    <div
      className={styles.tooltip}
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
      <div className={styles.tooltipItem}>
        <span>Principal Paid:</span>
        <span>{formatCurrency(data.principal)}</span>
      </div>
      <div className={styles.tooltipItem}>
        <span>Interest Paid:</span>
        <span>{formatCurrency(data.interest)}</span>
      </div>
    </div>
  );
};

export default Tooltip;
