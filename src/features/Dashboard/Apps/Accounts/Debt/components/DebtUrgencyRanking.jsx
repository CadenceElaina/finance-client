import React, { useState } from "react";
import {
  formatCurrency,
  formatPercentage,
  formatMonthsToYears,
} from "../utils/formatting";
import Button from "../../../../../../components/ui/Button/Button";
import styles from "./DebtUrgencyRanking.module.css";

const DebtUrgencyRanking = ({ debts, strategies }) => {
  const [activeStrategy, setActiveStrategy] = useState("urgency");

  const getUrgencyLevel = (score) => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const getOrderedDebts = () => {
    switch (activeStrategy) {
      case "avalanche":
        return strategies.avalanche.debts;
      case "snowball":
        return strategies.snowball.debts;
      case "urgency":
      default:
        return [...debts].sort((a, b) => b.urgencyScore - a.urgencyScore);
    }
  };

  const orderedDebts = getOrderedDebts();

  const getStrategyDescription = () => {
    switch (activeStrategy) {
      case "avalanche":
        return "Pay minimums on all debts, then put extra payments toward highest interest rate debt first. Saves the most money.";
      case "snowball":
        return "Pay minimums on all debts, then put extra payments toward smallest balance first. Provides psychological wins.";
      case "urgency":
      default:
        return "Prioritized by urgency score considering interest rate, balance, debt type, and payment ratio.";
    }
  };

  const getStrategyStats = () => {
    if (activeStrategy === "avalanche") {
      return {
        totalInterest: strategies.avalanche.totalInterest,
        totalMonths: strategies.avalanche.totalMonths,
      };
    }
    if (activeStrategy === "snowball") {
      return {
        totalInterest: strategies.snowball.totalInterest,
        totalMonths: strategies.snowball.totalMonths,
      };
    }
    return null;
  };

  const strategyStats = getStrategyStats();

  return (
    <div className={styles.urgencyRanking}>
      <div className={styles.header}>
        <div className={styles.strategyButtons}>
          <Button
            onClick={() => setActiveStrategy("urgency")}
            variant={activeStrategy === "urgency" ? "primary" : "secondary"}
            size="small"
          >
            Priority Score
          </Button>
          <Button
            onClick={() => setActiveStrategy("avalanche")}
            variant={activeStrategy === "avalanche" ? "primary" : "secondary"}
            size="small"
          >
            Avalanche Method
          </Button>
          <Button
            onClick={() => setActiveStrategy("snowball")}
            variant={activeStrategy === "snowball" ? "primary" : "secondary"}
            size="small"
          >
            Snowball Method
          </Button>
        </div>
      </div>

      <div className={styles.strategyInfo}>
        <div className={styles.description}>
          <strong>
            {activeStrategy.charAt(0).toUpperCase() + activeStrategy.slice(1)}{" "}
            Strategy:
          </strong>{" "}
          {getStrategyDescription()}
        </div>
        {strategyStats && (
          <div className={styles.stats}>
            <span>
              Total Interest: {formatCurrency(strategyStats.totalInterest)}
            </span>
            <span>
              Total Time: {formatMonthsToYears(strategyStats.totalMonths)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.debtList}>
        {orderedDebts.map((debt, index) => {
          const urgencyLevel = getUrgencyLevel(debt.urgencyScore);

          return (
            <div
              key={debt.id}
              className={`${styles.debtItem} ${styles[urgencyLevel]}`}
            >
              <div className={styles.rank}>
                <span className={styles.rankNumber}>#{index + 1}</span>
                {activeStrategy === "urgency" && (
                  <span className={styles.score}>
                    {Math.round(debt.urgencyScore)}
                  </span>
                )}
              </div>

              <div className={styles.debtInfo}>
                <div className={styles.debtName}>
                  <strong>{debt.name}</strong>
                  <span className={styles.debtType}>{debt.subType}</span>
                </div>

                <div className={styles.debtDetails}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Balance:</span>
                    <span className={styles.value}>
                      {formatCurrency(debt.value)}
                    </span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Rate:</span>
                    <span className={styles.value}>
                      {formatPercentage(debt.interestRate)}
                    </span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Payment:</span>
                    <span className={styles.value}>
                      {formatCurrency(debt.monthlyPayment)}
                    </span>
                  </div>
                  {debt.timeline && (
                    <div className={styles.detail}>
                      <span className={styles.label}>Payoff:</span>
                      <span className={styles.value}>
                        {formatMonthsToYears(debt.timeline.months)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.priority}>
                {activeStrategy === "urgency" && (
                  <div
                    className={`${styles.priorityBadge} ${styles[urgencyLevel]}`}
                  >
                    {urgencyLevel.toUpperCase()}
                  </div>
                )}
                {activeStrategy === "avalanche" && (
                  <div className={styles.avalancheInfo}>
                    <span>Highest Rate</span>
                  </div>
                )}
                {activeStrategy === "snowball" && (
                  <div className={styles.snowballInfo}>
                    <span>Smallest Balance</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebtUrgencyRanking;
