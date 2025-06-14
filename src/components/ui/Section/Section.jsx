// src/components/ui/Section/Section.jsx s
import React from 'react';
import styles from './Section.module.css';

const Section = ({ title, header, children, className = '', ...props }) => (
    <section className={`${styles.section} ${className}`} {...props}>
        {(title || header) && (
            <div className={styles.sectionHeader}>
                {header || <h3>{title}</h3>}
            </div>
        )}
        <div className={styles.sectionContent}>
            {children}
        </div>
    </section>
);

export default Section; 