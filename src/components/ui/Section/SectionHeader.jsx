import React from 'react';
import styles from './Section.module.css';

const SectionHeader = ({ left, title, right }) => (
    <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeaderLeft}>{left}</div>
        <h3 className={styles.sectionHeaderTitle}>{title}</h3>
        <div className={styles.sectionHeaderRight}>{right}</div>
    </div>
);

export default SectionHeader;