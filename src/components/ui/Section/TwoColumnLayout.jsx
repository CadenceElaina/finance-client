import React from 'react';
import styles from './Section.module.css';

const TwoColumnLayout = ({ left, right, smallApp }) => (
    <div className={smallApp ? styles.oneColumn : styles.twoColumn}>
        <div className={styles.column}>{left}</div>
        <div className={styles.column}>{right}</div>
    </div>
);

export default TwoColumnLayout;