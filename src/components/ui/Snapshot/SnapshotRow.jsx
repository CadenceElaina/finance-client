import React from "react";
import styles from "./SnapshotRow.module.css";

// items: [{ label, value, valueClass (optional), valueSuffix (optional) }]
const SnapshotRow = ({ items, small }) => (
  <div
    className={
      small
        ? `${styles.snapshotRow} ${styles.snapshotRowSmall}`
        : styles.snapshotRow
    }
  >
    {items.map((item, idx) => (
      <div
        key={item.label || idx}
        className={
          small
            ? `${styles.snapshotItem} ${styles.snapshotItemSmall}`
            : styles.snapshotItem
        }
      >
        <span
          className={
            small
              ? `${styles.snapshotLabel} ${styles.snapshotLabelSmall}`
              : styles.snapshotLabel
          }
        >
          {item.label}
        </span>
        <span
          className={
            (item.valueClass ? styles[item.valueClass] : "") +
            " " +
            (small ? styles.valueSmall : styles.value)
          }
        >
          {item.value}
          {item.valueSuffix && (
            <span style={{ marginLeft: 6, fontSize: "0.95em" }}>
              {item.valueSuffix}
            </span>
          )}
        </span>
      </div>
    ))}
  </div>
);

export default SnapshotRow;
