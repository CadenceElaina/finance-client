// src/features/Dashboard/Apps/Budget/SummarySection.jsx
import React, { useState } from "react";
import Section from "../../../../components/ui/Section/Section";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import styles from "./budget.module.css";
import sectionStyles from "../../../../components/ui/Section/Section.module.css";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import {
  getNetWorth,
  getTotalAssets,
  getTotalCash,
  getTotalLiabilities,
} from "../../../../utils/calculations/financialCalculations";

const PERIOD_OPTIONS = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual" },
  { id: "both", label: "Both" },
];

const TAX_OPTIONS = [
  { id: "after", label: "After-tax" },
  { id: "pre", label: "Pre-tax" },
  { id: "both", label: "Both" },
];

const SummaryTab = () => {
  const { data } = useFinancialData();
  const accounts = data.accounts;
  const budget = data.budget || { income: {}, monthlyExpenses: [] };

  const [tax, setTax] = useState("both");
  const [period, setPeriod] = useState("both");

  // Use calculated fields from budget
  const monthlyExpenses = budget.totalMonthlyExpenses || 0;
  const annualExpenses = monthlyExpenses * 12;

  // Use calculated monthly/annual income (pre-tax and after-tax)
  const monthlyIncomeAT = budget.monthlyAfterTax || 0;
  const annualIncomeAT = budget.annualAfterTax || 0;

  const monthlyIncomePT = budget.monthlyPreTax || 0;
  const annualIncomePT = budget.annualPreTax || 0;

  // Discretionary
  const monthlyDiscretionaryAT = monthlyIncomeAT - monthlyExpenses;
  const annualDiscretionaryAT = annualIncomeAT - annualExpenses;
  const monthlyDiscretionaryPT = monthlyIncomePT - monthlyExpenses;
  const annualDiscretionaryPT = annualIncomePT - annualExpenses;

  const netWorth = getNetWorth(accounts);
  const totalCash = getTotalCash(accounts);
  const totalAssets = getTotalAssets(accounts);
  const totalDebt = getTotalLiabilities(accounts);

  const format = (val) =>
    `$${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const showAfter = tax === "after" || tax === "both";
  const showPre = tax === "pre" || tax === "both";
  const showMonthly = period === "monthly" || period === "both";
  const showAnnual = period === "annual" || period === "both";

  const renderSummaryCard = (
    periodLabel,
    income,
    expenses,
    discretionary,
    taxLabel
  ) => (
    <div className={styles.summaryCard}>
      <div className={styles.summaryCardHeader}>
        <span className={styles.summaryPeriod}>{periodLabel}</span>
        {taxLabel && <span className={styles.summaryTax}>({taxLabel})</span>}
      </div>
      <div className={styles.summaryCardRow}>
        <span>Income</span>
        <span className={styles.summaryIncome}>{format(income)}</span>
      </div>
      <div className={styles.summaryCardRow}>
        <span>Expenses</span>
        <span className={styles.summaryExpenses}>{format(expenses)}</span>
      </div>
      <div className={styles.summaryCardRow}>
        <span>Discretionary</span>
        <span className={discretionary < 0 ? styles.negative : styles.positive}>
          {format(discretionary)}
        </span>
      </div>
    </div>
  );

  const Controls = (
    <div className={styles.summaryFilterControls}>
      {" "}
      {/* NEW CLASS */}
      <div>
        {" "}
        {/* This div wraps label and select for Period */}
        <label htmlFor="period-select" className={sectionStyles.filterLabel}>
          Period:
        </label>
        <select
          id="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={`${sectionStyles.filterSelect} ${styles.budgetSelect}`}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        {" "}
        {/* This div wraps label and select for Tax */}
        <label htmlFor="tax-select" className={sectionStyles.filterLabel}>
          Tax:
        </label>
        <select
          id="tax-select"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
          className={`${sectionStyles.filterSelect} ${styles.budgetSelect}`}
        >
          {TAX_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      <Section header={<SectionHeader title="Summary" right={Controls} />}>
        <div
          className={styles.summaryGrid}
          style={{
            gridTemplateColumns: showMonthly && showAnnual ? "1fr 1fr" : "1fr",
          }}
        >
          {showMonthly && (
            <div>
              {showAfter &&
                renderSummaryCard(
                  "Monthly",
                  monthlyIncomeAT,
                  monthlyExpenses,
                  monthlyDiscretionaryAT,
                  "After-tax"
                )}
              {showPre &&
                renderSummaryCard(
                  "Monthly",
                  monthlyIncomePT,
                  monthlyExpenses,
                  monthlyDiscretionaryPT,
                  "Pre-tax"
                )}
            </div>
          )}
          {showAnnual && (
            <div>
              {showAfter &&
                renderSummaryCard(
                  "Annual",
                  annualIncomeAT,
                  annualExpenses,
                  annualDiscretionaryAT,
                  "After-tax"
                )}
              {showPre &&
                renderSummaryCard(
                  "Annual",
                  annualIncomePT,
                  annualExpenses,
                  annualDiscretionaryPT,
                  "Pre-tax"
                )}
            </div>
          )}
        </div>
      </Section>
    </>
  );
};

export default SummaryTab;
