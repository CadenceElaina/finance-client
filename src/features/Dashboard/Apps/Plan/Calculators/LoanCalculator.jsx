// src/features/Dashboard/Apps/Plan/Calculators/LoanCalculator.jsx
import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Button from "../../../../../components/ui/Button/Button";
import planStyles from "../plan.module.css";

const LoanCalculator = ({ smallApp }) => {
  const [inputs, setInputs] = useState({
    loanAmount: 250000,
    annualInterestRate: 3.5,
    loanTermYears: 30,
    extraMonthlyPayment: 0,
  });

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const { results, chartData } = useMemo(() => {
    const {
      loanAmount,
      annualInterestRate,
      loanTermYears,
      extraMonthlyPayment,
    } = inputs;

    if (loanAmount <= 0 || annualInterestRate < 0 || loanTermYears <= 0)
      return { results: null, chartData: [] };

    const monthlyRate = annualInterestRate / 100 / 12;
    const totalMonths = loanTermYears * 12;

    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyPayment = loanAmount / totalMonths;
    }

    const totalMonthlyPayment = monthlyPayment + extraMonthlyPayment;

    // Calculate detailed amortization for chart
    let balance = loanAmount;
    let monthsPaid = 0;
    let totalInterestPaid = 0;
    let totalPaid = 0;
    const yearlyData = [];

    while (balance > 0.01 && monthsPaid < totalMonths * 2) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(
        totalMonthlyPayment - interestPayment,
        balance
      );

      balance -= principalPayment;
      totalInterestPaid += interestPayment;
      totalPaid += interestPayment + principalPayment;
      monthsPaid++;

      // Add yearly snapshots for chart
      if (monthsPaid % 12 === 0 || balance <= 0.01) {
        yearlyData.push({
          year: Math.floor(monthsPaid / 12),
          "Principal Balance": Math.round(balance),
          "Cumulative Interest": Math.round(totalInterestPaid),
          "Total Paid": Math.round(totalPaid),
        });
      }

      if (principalPayment <= 0) break;
    }

    const totalPaymentWithoutExtra = monthlyPayment * totalMonths;
    const totalInterestWithoutExtra = totalPaymentWithoutExtra - loanAmount;
    const interestSaved = totalInterestWithoutExtra - totalInterestPaid;
    const timeSaved = totalMonths - monthsPaid;

    const calculatedResults = {
      monthlyPayment,
      totalMonthlyPayment,
      totalInterestPaid,
      totalPaid,
      monthsPaid,
      yearsToPayoff: monthsPaid / 12,
      interestSaved,
      timeSavedMonths: timeSaved,
      timeSavedYears: timeSaved / 12,
      totalInterestWithoutExtra,
    };

    return { results: calculatedResults, chartData: yearlyData };
  }, [inputs]);

  const resetCalculator = () => {
    setInputs({
      loanAmount: 250000,
      annualInterestRate: 3.5,
      loanTermYears: 30,
      extraMonthlyPayment: 0,
    });
  };

  return (
    <div className={planStyles.calculatorContainer}>
      <h3 className={planStyles.calculatorTitle}>Loan Calculator</h3>

      <div className={planStyles.calculatorContent}>
        <div className={planStyles.calculatorForm}>
          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Loan Amount</label>
              <input
                type="number"
                value={inputs.loanAmount}
                onChange={(e) =>
                  handleInputChange("loanAmount", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="1000"
              />
            </div>

            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Interest Rate (%)</label>
              <input
                type="number"
                value={inputs.annualInterestRate}
                onChange={(e) =>
                  handleInputChange("annualInterestRate", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                max="20"
                step="0.1"
              />
            </div>
          </div>

          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Loan Term (Years)</label>
              <input
                type="number"
                value={inputs.loanTermYears}
                onChange={(e) =>
                  handleInputChange("loanTermYears", e.target.value)
                }
                className={planStyles.formInput}
                min="1"
                max="50"
              />
            </div>

            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Extra Monthly Payment
              </label>
              <input
                type="number"
                value={inputs.extraMonthlyPayment}
                onChange={(e) =>
                  handleInputChange("extraMonthlyPayment", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="50"
              />
            </div>
          </div>

          <div className={planStyles.formActions}>
            <Button onClick={resetCalculator} variant="secondary">
              Reset
            </Button>
          </div>
        </div>

        {results && (
          <div className={planStyles.calculatorResults}>
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Monthly Payment</span>
              <span className={planStyles.resultValue}>
                $
                {results.monthlyPayment.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Time to Pay Off</span>
              <span className={planStyles.resultValue}>
                {results.yearsToPayoff.toFixed(1)} years
              </span>
            </div>

            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Total Interest</span>
              <span className={planStyles.resultValue}>
                $
                {results.totalInterestPaid.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {inputs.extraMonthlyPayment > 0 && (
              <div className={planStyles.resultItem}>
                <span className={planStyles.resultLabel}>Interest Saved</span>
                <span
                  className={`${planStyles.resultValue} ${planStyles.positive}`}
                >
                  $
                  {results.interestSaved.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className={planStyles.calculatorChart}>
          <ResponsiveContainer width="100%" height={smallApp ? 200 : 280}>
            <AreaChart data={chartData}>
              <XAxis
                dataKey="year"
                fontSize={smallApp ? 10 : 12}
                tick={{ fill: "var(--chart-label-text)" }}
              />
              <YAxis
                fontSize={smallApp ? 10 : 12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fill: "var(--chart-label-text)" }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `$${value.toLocaleString()}`,
                  name,
                ]}
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--border-light)",
                  color: "var(--chart-tooltip-text)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: "var(--font-size-xs)",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: smallApp ? "0.65rem" : "0.75rem",
                  color: "var(--chart-label-text)",
                }}
              />
              <Area
                type="monotone"
                dataKey="Principal Balance"
                stackId="1"
                stroke="var(--chart-color-1)"
                fill="var(--chart-color-1)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Cumulative Interest"
                stackId="2"
                stroke="var(--chart-color-2)"
                fill="var(--chart-color-2)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;
