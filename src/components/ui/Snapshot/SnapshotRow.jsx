import React from "react";
import styles from "./SnapshotRow.module.css";

const SnapshotRow = ({
  items,
  small = false,
  variant = "default", // "default", "compact", "cards"
  columns = "auto", // "auto", 2, 3, 4, 5
}) => {
  const getColumnClass = () => {
    if (columns === "auto") return "";
    return styles[`columns${columns}`];
  };

  const getVariantClass = () => {
    switch (variant) {
      case "compact":
        return styles.compact;
      case "cards":
        return styles.cards;
      default:
        return "";
    }
  };

  return (
    <div
      className={`
        ${styles.snapshotRow} 
        ${small ? styles.snapshotRowSmall : ""} 
        ${getVariantClass()}
        ${getColumnClass()}
      `}
    >
      {items.map((item, idx) => (
        <div
          key={item.label || idx}
          className={`
            ${styles.snapshotItem} 
            ${small ? styles.snapshotItemSmall : ""}
            ${item.highlight ? styles.highlighted : ""}
            ${item.status ? styles[item.status] : ""}
          `}
        >
          {item.icon && <div className={styles.snapshotIcon}>{item.icon}</div>}
          <div className={styles.snapshotContent}>
            <span
              className={`
                ${styles.snapshotLabel} 
                ${small ? styles.snapshotLabelSmall : ""}
              `}
            >
              {item.label}
            </span>
            <div className={styles.snapshotValueWrapper}>
              <span
                className={`
                  ${item.valueClass ? styles[item.valueClass] : ""} 
                  ${small ? styles.valueSmall : styles.value}
                  ${item.emphasized ? styles.emphasized : ""}
                `}
              >
                {item.value}
              </span>
              {item.valueSuffix && (
                <span className={styles.valueSuffix}>{item.valueSuffix}</span>
              )}
            </div>
            {item.subtext && (
              <span className={styles.snapshotSubtext}>{item.subtext}</span>
            )}
          </div>
          {item.trend && (
            <div className={`${styles.trendIndicator} ${styles[item.trend]}`}>
              {item.trend === "up" && "↗"}
              {item.trend === "down" && "↘"}
              {item.trend === "stable" && "→"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SnapshotRow;
