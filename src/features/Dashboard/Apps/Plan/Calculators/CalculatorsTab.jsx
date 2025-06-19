// src/features/Dashboard/Apps/Plan/Calculators/CalculatorsTab.jsx
import React from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import planStyles from "../plan.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";

const CalculatorsTab = ({ smallApp, activeInnerTabId }) => {
  return (
    <div className={planStyles.planContentWrapper}>
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Financial Calculators"
              editMode={false}
              editable={false}
            />
          </div>
        }
      >
        <div className={planStyles.calculatorsGrid}>
          <div className={planStyles.calculatorCard}>
            <div className={planStyles.calculatorHeader}>
              <h3 className={planStyles.calculatorTitle}>
                Compound Interest Calculator
              </h3>
              <p className={planStyles.calculatorDescription}>
                Calculate how your investments will grow over time with compound
                interest.
              </p>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-xl)",
                color: "var(--text-secondary)",
              }}
            >
              Coming soon...
            </div>
          </div>

          <div className={planStyles.calculatorCard}>
            <div className={planStyles.calculatorHeader}>
              <h3 className={planStyles.calculatorTitle}>
                Retirement Calculator
              </h3>
              <p className={planStyles.calculatorDescription}>
                Plan for your retirement and see if you're saving enough.
              </p>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-xl)",
                color: "var(--text-secondary)",
              }}
            >
              Coming soon...
            </div>
          </div>

          <div className={planStyles.calculatorCard}>
            <div className={planStyles.calculatorHeader}>
              <h3 className={planStyles.calculatorTitle}>Loan Calculator</h3>
              <p className={planStyles.calculatorDescription}>
                Calculate loan payments and compare different loan scenarios.
              </p>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-xl)",
                color: "var(--text-secondary)",
              }}
            >
              Coming soon...
            </div>
          </div>

          <div className={planStyles.calculatorCard}>
            <div className={planStyles.calculatorHeader}>
              <h3 className={planStyles.calculatorTitle}>
                Savings Goal Calculator
              </h3>
              <p className={planStyles.calculatorDescription}>
                Determine how much to save monthly to reach your financial
                goals.
              </p>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-xl)",
                color: "var(--text-secondary)",
              }}
            >
              Coming soon...
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default CalculatorsTab;
