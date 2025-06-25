import React, { useState, useMemo } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import Section from "../../../../../components/ui/Section/Section";
import Button from "../../../../../components/ui/Button/Button";
import DebtCard from "./components/DebtCard";
import PayoffTimeline from "./components/PayoffTimeline";
import PaymentScenarios from "./components/PaymentScenarios";
import DebtMetrics from "./components/DebtMetrics";
import AmortizationTable from "./components/AmortizationTable";
import DebtUrgencyRanking from "./components/DebtUrgencyRanking";
import {
  calculatePayoffTimeline,
  calculateDebtUrgency,
  calculatePayoffStrategies,
  calculateDebtToIncomeRatio,
} from "./utils/debtCalculations";
import styles from "./DebtTab.module.css";

const DebtTab = ({ activeInnerTabId = "overviewBalance" }) => {
  const { data } = useFinancialData();
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [compoundingFrequency, setCompoundingFrequency] = useState(12);
  const [showAmortization, setShowAmortization] = useState(false);

  // Memoize accounts and income to prevent unnecessary re-renders
  const accounts = useMemo(() => data?.accounts || [], [data?.accounts]);
  const budget = useMemo(() => data?.budget || {}, [data?.budget]);

  // Filter debt accounts
  const debtAccounts = useMemo(() => {
    return accounts.filter(
      (account) =>
        account.category === "Debt" &&
        Math.abs(account.value) > 0 && // Use absolute value since debt can be negative
        account.monthlyPayment > 0
    );
  }, [accounts]);

  // Enrich debt accounts with calculations
  const enrichedDebts = useMemo(() => {
    return debtAccounts
      .map((debt) => {
        const balance = Math.abs(debt.value); // Convert negative debt to positive balance
        const timeline = calculatePayoffTimeline(
          balance,
          debt.interestRate || 0,
          debt.monthlyPayment,
          compoundingFrequency
        );

        const urgencyScore = calculateDebtUrgency({
          ...debt,
          value: balance, // Pass positive balance to urgency calculation
        });

        return {
          ...debt,
          value: balance, // Store as positive balance for display
          timeline,
          urgencyScore,
        };
      })
      .filter((debt) => debt.timeline); // Only include debts with valid timelines
  }, [debtAccounts, compoundingFrequency]);

  // Calculate total metrics
  const totalMetrics = useMemo(() => {
    const totalBalance = enrichedDebts.reduce(
      (sum, debt) => sum + debt.value,
      0
    );
    const totalMonthlyPayments = enrichedDebts.reduce(
      (sum, debt) => sum + debt.monthlyPayment,
      0
    );
    const totalInterest = enrichedDebts.reduce(
      (sum, debt) => sum + (debt.timeline ? debt.timeline.totalInterest : 0),
      0
    );

    // Estimate overall payoff time (when last debt is paid off)
    const payoffMonths =
      enrichedDebts.length > 0
        ? Math.max(
            ...enrichedDebts.map((debt) =>
              debt.timeline ? debt.timeline.months : 0
            ),
            0
          )
        : 0;

    // Get monthly income from budget
    const monthlyIncome = budget?.income?.monthlyAfterTax || 0;
    const debtToIncomeRatio = calculateDebtToIncomeRatio(
      totalMonthlyPayments,
      monthlyIncome
    );

    return {
      totalBalance,
      totalMonthlyPayments,
      totalInterest,
      payoffMonths,
      payoffYears: Math.round((payoffMonths / 12) * 10) / 10,
      debtToIncomeRatio,
    };
  }, [enrichedDebts, budget]);

  // Calculate payoff strategies
  const payoffStrategies = useMemo(() => {
    return calculatePayoffStrategies(enrichedDebts);
  }, [enrichedDebts]);

  // Safety check for data - moved after all hooks
  if (!data) {
    return (
      <div className={styles.emptyState}>
        <h3>Loading...</h3>
        <p>Please wait while we load your financial data.</p>
      </div>
    );
  }

  const handleDebtSelect = (debt) => {
    setSelectedDebt(debt);
    setShowAmortization(false);
  };

  const handleShowAmortization = () => {
    setShowAmortization(true);
  };

  // --- UI rendering based on inner tab ---
  if (debtAccounts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No Debt Accounts Found</h3>
        <p>
          Add debt accounts in the Overview tab to start tracking your debt
          payoff journey.
        </p>
        <p>
          Make sure to set the category to "Debt" and include monthly payment
          amounts.
        </p>
      </div>
    );
  }

  // Default to first debt if none selected and needed for timeline/amortization
  const currentDebt = selectedDebt || enrichedDebts[0];

  return (
    <div className={styles.debtTab}>
      {/* Overview tab: Only show Debt Overview metrics */}
      {activeInnerTabId === "overviewBalance" && (
        <Section title="Debt Overview" className={styles.overviewSection}>
          <DebtMetrics
            metrics={totalMetrics}
            debtCount={enrichedDebts.length}
            compoundingFrequency={compoundingFrequency}
            onCompoundingChange={setCompoundingFrequency}
          />
        </Section>
      )}

      {/* Balances tab: Show debts grid only, no click/select */}
      {activeInnerTabId === "balances" && (
        <Section title="Your Debts" className={styles.debtsSection}>
          <div className={styles.debtGrid}>
            {enrichedDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                isSelected={false}
                onSelect={undefined}
                compoundingFrequency={compoundingFrequency}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Debt Priorities Tab: Only show priority ranking */}
      {activeInnerTabId === "debtPriorities" && (
        <Section
          title="Debt Priority Ranking"
          className={styles.urgencySection}
        >
          <DebtUrgencyRanking
            debts={enrichedDebts}
            strategies={payoffStrategies}
          />
        </Section>
      )}

      {/* Payoff Timeline Tab: Only show timeline for selected debt, allow switching */}
      {activeInnerTabId === "payoffTimeline" && currentDebt && (
        <Section title="Payoff Timeline" className={styles.timelineSection}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="timeline-debt-select">Select Debt: </label>
            <select
              id="timeline-debt-select"
              value={currentDebt.id}
              onChange={(e) => {
                const debt = enrichedDebts.find((d) => d.id === e.target.value);
                setSelectedDebt(debt);
              }}
            >
              {enrichedDebts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.name}
                </option>
              ))}
            </select>
          </div>
          <PayoffTimeline
            debt={currentDebt}
            compoundingFrequency={compoundingFrequency}
          />
        </Section>
      )}

      {/* Amortization Tab: Only show amortization for selected debt, allow switching */}
      {activeInnerTabId === "amortization" && currentDebt && (
        <Section
          title="Amortization Schedule"
          className={styles.amortizationSection}
        >
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="amortization-debt-select">Select Debt: </label>
            <select
              id="amortization-debt-select"
              value={currentDebt.id}
              onChange={(e) => {
                const debt = enrichedDebts.find((d) => d.id === e.target.value);
                setSelectedDebt(debt);
              }}
            >
              {enrichedDebts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.name}
                </option>
              ))}
            </select>
          </div>
          <AmortizationTable
            debt={currentDebt}
            compoundingFrequency={compoundingFrequency}
            onClose={() => {}}
          />
        </Section>
      )}
    </div>
  );
};

export default DebtTab;
