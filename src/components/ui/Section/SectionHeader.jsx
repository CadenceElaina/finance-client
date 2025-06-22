import React, { memo } from "react";
import styles from "./Section.module.css";

const SectionHeader = memo(({ left, title, right }) => (
  <div className={styles.sectionHeaderRow}>
    <div className={styles.sectionHeaderLeft}>{left}</div>
    <h3 className={styles.sectionHeaderTitle}>{title}</h3>
    <div className={styles.sectionHeaderRight}>{right}</div>
  </div>
));

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;
