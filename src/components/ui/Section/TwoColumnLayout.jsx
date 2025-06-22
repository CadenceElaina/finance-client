import React from "react";
import styles from "./Section.module.css";

const TwoColumnLayout = ({ left, right, smallApp, className = "" }) => (
  <div
    className={`${smallApp ? styles.oneColumn : styles.twoColumn} ${className}`}
  >
    <div className={styles.column}>{left}</div>
    <div className={styles.column}>{right}</div>
  </div>
);

export default TwoColumnLayout;
