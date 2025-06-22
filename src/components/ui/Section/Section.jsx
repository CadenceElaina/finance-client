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
  border = "primary",
  noBorderLeft = false,
  smallApp, // Extract this prop so it doesn't get passed to DOM
  ...props
}) => {
  // Map border prop to class
  const borderClass =
    border && !noBorderLeft
      ? styles[`border${border.charAt(0).toUpperCase() + border.slice(1)}`] ||
        ""
      : "";
  const noBorderClass = noBorderLeft ? styles.noBorderLeft : "";

  return (
    <section
      className={`${styles.section} ${borderClass} ${noBorderClass} ${className}`}
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
};

export default Section;
