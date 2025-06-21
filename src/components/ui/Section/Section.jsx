// src/components/ui/Section/Section.jsx s
import React from "react";
import styles from "./Section.module.css";

const Section = ({
  title,
  header,
  children,
  className = "",
  style,
  contentStyle,
  smallApp, // Extract smallApp to prevent it from being spread to DOM
  ...props
}) => (
  <section
    className={`${styles.section} ${className}`}
    style={style}
    {...props}
  >
    {(title || header) && (
      <div className={styles.sectionHeader}>{header || <h3>{title}</h3>}</div>
    )}
    <div className={styles.sectionContent} style={contentStyle}>
      {children}
    </div>
  </section>
);

export default Section;
