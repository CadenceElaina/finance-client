import React, { useState, useMemo } from "react";
import { formatCurrency, formatMonthsToYears } from "../utils/formatting";
import { calculateInterestSavings } from "../utils/debtCalculations";
import Button from "../../../../../../components/ui/Button/Button";
import styles from "./PaymentScenarios.module.css";

const PaymentScenarios = ({ debt, compoundingFrequency }) => {
  const [customPayment, setCustomPayment] = useState(debt.monthlyPayment + 50);

  // Predefined scenarios
  const scenarios = useMemo(() => {
    const basePayment = debt.monthlyPayment;
    const scenarios = [
      {
        name: "Current Payment",
        payment: basePayment,
        description: "Your current monthly payment",
      },
      {
        name: "Extra $25",
        payment: basePayment + 25,
        description: "Add $25 to monthly payment",
      },
      {
        name: "Extra $50",
        payment: basePayment + 50,
        description: "Add $50 to monthly payment",
      },
      {
        name: "Extra $100",
        payment: basePayment + 100,
        description: "Add $100 to monthly payment",
      },
      {
        name: "Double Payment",
        payment: basePayment * 2,
        description: "Double your monthly payment",
      },
    ];

    return scenarios
      .map((scenario) => {
        const savings = calculateInterestSavings(
          debt.value,
          debt.interestRate || 0,
          basePayment,
          scenario.payment,
          compoundingFrequency
        );

        return {
          ...scenario,
          savings,
        };
      })
      .filter((scenario) => scenario.savings);
  }, [
    debt.value,
    debt.interestRate,
    debt.monthlyPayment,
    compoundingFrequency,
  ]);

  // Custom scenario
  const customScenario = useMemo(() => {
    if (customPayment <= debt.monthlyPayment) return null;

    const savings = calculateInterestSavings(
      debt.value,
      debt.interestRate || 0,
      debt.monthlyPayment,
      customPayment,
      compoundingFrequency
    );

    return {
      name: "Custom Payment",
      payment: customPayment,
      description: `Custom payment of ${formatCurrency(customPayment)}`,
      savings,
    };
  }, [
    debt.value,
    debt.interestRate,
    debt.monthlyPayment,
    customPayment,
    compoundingFrequency,
  ]);

  const getPayoffImpact = (scenario) => {
    if (!scenario.savings) return null;

    const { interestSaved, timeSaved, newPayoff } = scenario.savings;
    const extraMonthly = scenario.payment - debt.monthlyPayment;
    const totalExtra = extraMonthly * newPayoff.months;

    return {
      interestSaved,
      timeSaved,
      totalExtra,
      newPayoffTime: newPayoff.months,
      newTotalPaid: newPayoff.totalPaid,
      roi: totalExtra > 0 ? (interestSaved / totalExtra) * 100 : 0,
    };
  };

  const getBestScenario = () => {
    const validScenarios = scenarios.filter((s) => s.savings);
    if (validScenarios.length === 0) return null;

    return validScenarios.reduce((best, current) => {
      const currentImpact = getPayoffImpact(current);
      const bestImpact = getPayoffImpact(best);

      return currentImpact.roi > bestImpact.roi ? current : best;
    });
  };

  const bestScenario = getBestScenario();

  return (
    <div className={styles.paymentScenarios}>
      <div className={styles.header}>
        <h4>Payment Scenarios</h4>
        <p>See how extra payments can accelerate your debt payoff</p>
      </div>

      <div className={styles.customScenario}>
        <div className={styles.customInput}>
          <label htmlFor="customPayment">Custom Monthly Payment</label>
          <input
            id="customPayment"
            type="number"
            value={customPayment}
            onChange={(e) => setCustomPayment(Number(e.target.value))}
            min={debt.monthlyPayment}
            step={25}
            className={styles.paymentInput}
          />
        </div>
        {customScenario && (
          <div className={styles.scenarioCard}>
            <ScenarioCard
              scenario={customScenario}
              impact={getPayoffImpact(customScenario)}
            />
          </div>
        )}
      </div>

      <div className={styles.predefinedScenarios}>
        <h5>Quick Scenarios</h5>
        <div className={styles.scenariosGrid}>
          {scenarios.map((scenario, index) => {
            const impact = getPayoffImpact(scenario);
            const isBest =
              bestScenario && scenario.payment === bestScenario.payment;

            return (
              <div
                key={index}
                className={`${styles.scenarioCard} ${
                  isBest ? styles.bestScenario : ""
                }`}
              >
                {isBest && <div className={styles.bestBadge}>Best ROI</div>}
                <ScenarioCard scenario={scenario} impact={impact} />
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.insights}>
        <h5>Key Insights</h5>
        <div className={styles.insightsList}>
          {bestScenario && (
            <div className={styles.insight}>
              <strong>Best ROI:</strong> Adding{" "}
              {formatCurrency(bestScenario.payment - debt.monthlyPayment)}
              monthly gives you the highest return on investment.
            </div>
          )}
          <div className={styles.insight}>
            <strong>Tip:</strong> Even small extra payments can significantly
            reduce your total interest cost.
          </div>
          <div className={styles.insight}>
            <strong>Strategy:</strong> Consider using windfalls, tax refunds, or
            bonuses for extra payments.
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioCard = ({ scenario, impact }) => {
  if (!impact) return null;

  const extraPayment =
    scenario.payment - impact.newTotalPaid / impact.newPayoffTime;
  const isCurrentPayment = extraPayment === 0;

  return (
    <div className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <h6>{scenario.name}</h6>
        <div className={styles.payment}>
          {formatCurrency(scenario.payment)}/month
        </div>
      </div>

      <div className={styles.cardDescription}>{scenario.description}</div>

      {!isCurrentPayment && (
        <div className={styles.cardMetrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Interest Saved</span>
            <span className={styles.metricValue}>
              {formatCurrency(impact.interestSaved)}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Time Saved</span>
            <span className={styles.metricValue}>
              {formatMonthsToYears(impact.timeSaved)}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>New Payoff Time</span>
            <span className={styles.metricValue}>
              {formatMonthsToYears(impact.newPayoffTime)}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>ROI</span>
            <span className={styles.metricValue}>{impact.roi.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentScenarios;
