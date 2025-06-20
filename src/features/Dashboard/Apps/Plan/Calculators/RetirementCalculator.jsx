// src/features/Dashboard/Apps/Plan/Calculators/RetirementCalculator.jsx
// Update the header section to match other calculators

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Section from "../../../../../components/ui/Section/Section";
import SectionHeader from "../../../../../components/ui/Section/SectionHeader";
import Button from "../../../../../components/ui/Button/Button";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import planStyles from "../plan.module.css";

const RetirementCalculator = ({ smallApp }) => {
  const { data } = useFinancialData();
  const accounts = data.accounts || [];

  const currentRetirementSavings = accounts
    .filter((acc) => acc.category === "Investments")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

  const [inputs, setInputs] = useState({
    currentAge: 30,
    retirementAge: 65,
    currentSavings: currentRetirementSavings,
    monthlyContribution: 1000,
    annualReturn: 7,
    inflationRate: 2.5,
    desiredAnnualIncome: 60000,
    retirementDuration: 25,
  });

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const { results, chartData } = useMemo(() => {
    const {
      currentAge,
      retirementAge,
      currentSavings,
      monthlyContribution,
      annualReturn,
      inflationRate,
      desiredAnnualIncome,
      retirementDuration,
    } = inputs;

    if (retirementAge <= currentAge) {
      return { results: {}, chartData: [] };
    }

    const yearsToRetirement = retirementAge - currentAge;
    const monthlyReturnRate = annualReturn / 100 / 12;
    const data = [];

    // Calculate accumulation phase (working years)
    let currentBalance = currentSavings;

    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;

      if (year === 0) {
        // Starting point
        data.push({
          age,
          year,
          balance: currentBalance,
          phase: "Accumulation",
          isRetirementStart: false,
        });
      } else {
        // Apply monthly contributions and growth for the year
        for (let month = 0; month < 12; month++) {
          currentBalance += monthlyContribution;
          currentBalance *= 1 + monthlyReturnRate;
        }

        data.push({
          age,
          year,
          balance: currentBalance,
          phase: "Accumulation",
          isRetirementStart: age === retirementAge,
        });
      }
    }

    const retirementBalance = currentBalance;

    // Calculate withdrawal phase (retirement years)
    // Adjust desired income for inflation
    const realAnnualIncome =
      desiredAnnualIncome *
      Math.pow(1 + inflationRate / 100, yearsToRetirement);

    for (let year = 1; year <= retirementDuration; year++) {
      const age = retirementAge + year;

      // Apply annual growth
      currentBalance *= 1 + annualReturn / 100;

      // Subtract annual income (adjusted for ongoing inflation)
      const currentYearIncome =
        realAnnualIncome * Math.pow(1 + inflationRate / 100, year - 1);
      currentBalance -= currentYearIncome;

      data.push({
        age,
        year: yearsToRetirement + year,
        balance: Math.max(0, currentBalance), // Don't go below 0 for display
        phase: "Withdrawal",
        isRetirementStart: false,
        yearlyWithdrawal: currentYearIncome,
      });

      // If balance hits zero, note when money runs out
      if (currentBalance <= 0) {
        break;
      }
    }

    // Find when money runs out
    const moneyRunsOutYear = data.find(
      (d) => d.phase === "Withdrawal" && d.balance <= 0
    );
    const yearsMoneyLasts = moneyRunsOutYear
      ? moneyRunsOutYear.year - yearsToRetirement
      : retirementDuration;

    // Calculate if savings are sufficient
    const finalBalance = data[data.length - 1]?.balance || 0;
    const isSufficient = finalBalance > 0;

    // Calculate required monthly contribution for success
    let requiredMonthlyContribution = monthlyContribution;
    if (!isSufficient) {
      // Simple estimation - you could make this more sophisticated
      const shortfall = Math.abs(finalBalance);
      const monthsToRetirement = yearsToRetirement * 12;
      requiredMonthlyContribution =
        monthlyContribution + shortfall / monthsToRetirement;
    }

    return {
      results: {
        retirementBalance,
        finalBalance,
        isSufficient,
        yearsMoneyLasts,
        requiredMonthlyContribution,
        realAnnualIncome,
      },
      chartData: data,
    };
  }, [inputs]);

  const resetCalculator = () => {
    setInputs({
      currentAge: 30,
      retirementAge: 65,
      currentSavings: currentRetirementSavings,
      monthlyContribution: 1000,
      annualReturn: 7,
      inflationRate: 2.5,
      desiredAnnualIncome: 60000,
      retirementDuration: 25,
    });
  };

  return (
    <Section
      header={<SectionHeader title="Retirement Calculator" />}
      className={planStyles.calculatorContainer}
    >
      <div className={planStyles.calculatorContent}>
        {/* Keep existing form and results structure but standardize the title */}
        <div className={planStyles.calculatorForm}>
          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Current Age</label>
              <input
                type="number"
                value={inputs.currentAge}
                onChange={(e) =>
                  handleInputChange("currentAge", e.target.value)
                }
                className={planStyles.formInput}
                min="18"
                max="80"
              />
            </div>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Retirement Age</label>
              <input
                type="number"
                value={inputs.retirementAge}
                onChange={(e) =>
                  handleInputChange("retirementAge", e.target.value)
                }
                className={planStyles.formInput}
                min="50"
                max="80"
              />
            </div>
          </div>

          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Current Retirement Savings ($)
              </label>
              <input
                type="number"
                value={inputs.currentSavings}
                onChange={(e) =>
                  handleInputChange("currentSavings", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="1000"
              />
            </div>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Monthly Contribution ($)
              </label>
              <input
                type="number"
                value={inputs.monthlyContribution}
                onChange={(e) =>
                  handleInputChange("monthlyContribution", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Expected Annual Return (%)
              </label>
              <input
                type="number"
                value={inputs.annualReturn}
                onChange={(e) =>
                  handleInputChange("annualReturn", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                max="15"
                step="0.1"
              />
            </div>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Inflation Rate (%)</label>
              <input
                type="number"
                value={inputs.inflationRate}
                onChange={(e) =>
                  handleInputChange("inflationRate", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                max="10"
                step="0.1"
              />
            </div>
          </div>

          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Desired Annual Income($)
              </label>
              <input
                type="number"
                value={inputs.desiredAnnualIncome}
                onChange={(e) =>
                  handleInputChange("desiredAnnualIncome", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="1000"
              />
            </div>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Retirement Duration (years)
              </label>
              <input
                type="number"
                value={inputs.retirementDuration}
                onChange={(e) =>
                  handleInputChange("retirementDuration", e.target.value)
                }
                className={planStyles.formInput}
                min="5"
                max="50"
              />
            </div>
          </div>

          <div className={planStyles.formActions}>
            <Button onClick={resetCalculator} variant="secondary">
              Reset
            </Button>
          </div>
        </div>

        <div className={planStyles.calculatorResults}>
          {/* Add a centered header like other calculators */}
          <h4 style={{ textAlign: "center", marginBottom: "var(--space-sm)" }}>
            Retirement Projection Results
          </h4>

          <div className={planStyles.resultItem}>
            <span className={planStyles.resultLabel}>
              Balance at Retirement:
            </span>
            <span
              className={`${planStyles.resultValue} ${planStyles.positive}`}
            >
              $
              {results.retirementBalance?.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              }) || 0}
            </span>
          </div>

          <div className={planStyles.resultItem}>
            <span className={planStyles.resultLabel}>Money Lasts:</span>
            <span
              className={`${planStyles.resultValue} ${
                results.isSufficient ? planStyles.positive : planStyles.negative
              }`}
            >
              {results.yearsMoneyLasts} year
              {results.yearsMoneyLasts !== 1 ? "s" : ""}
              {results.isSufficient ? " (Full duration)" : " (Insufficient)"}
            </span>
          </div>

          <div className={planStyles.resultItem}>
            <span className={planStyles.resultLabel}>
              Inflation-Adjusted Income:
            </span>
            <span className={planStyles.resultValue}>
              $
              {results.realAnnualIncome?.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              }) || 0}
              /year
            </span>
          </div>

          {!results.isSufficient && (
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>
                Required Monthly Contribution:
              </span>
              <span
                className={`${planStyles.resultValue} ${planStyles.negative}`}
              >
                $
                {results.requiredMonthlyContribution?.toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                ) || 0}
              </span>
            </div>
          )}
        </div>

        <div
          className={planStyles.calculatorChart}
          style={{ marginTop: "var(--space-md)" }}
        >
          <ResponsiveContainer width="100%" height={smallApp ? 250 : 350}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 45,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-light)"
              />
              <XAxis
                dataKey="age"
                tick={{
                  fill: "var(--chart-label-text)",
                  fontSize: smallApp ? 10 : 12,
                }}
                label={{
                  value: "Age",
                  position: "insideBottom",
                  offset: -15,
                  style: {
                    textAnchor: "middle",
                    fill: "var(--chart-label-text)",
                  },
                }}
              />
              <YAxis
                tick={{
                  fill: "var(--chart-label-text)",
                  fontSize: smallApp ? 10 : 12,
                }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />

              {/* Reference line at retirement age */}
              <ReferenceLine
                x={inputs.retirementAge}
                stroke="var(--chart-color-3)"
                strokeDasharray="8 8"
                strokeWidth={2}
                label={{
                  value: "Retirement",
                  position: "topLeft",
                  fill: "var(--chart-label-text)",
                  fontSize: smallApp ? 10 : 12,
                }}
              />

              {/* Reference line at zero balance if money runs out */}
              {!results.isSufficient && (
                <ReferenceLine
                  y={0}
                  stroke="var(--status-danger)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              <Tooltip
                formatter={(value, name) => [
                  `$${value.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`,
                  name,
                ]}
                labelFormatter={(age) => `Age ${age}`}
                contentStyle={{
                  background: "var(--surface-light)", // Fixed: use proper CSS variable
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-primary)", // Fixed: ensure text color is set
                }}
                itemStyle={{
                  color: "var(--text-primary)", // Fixed: ensure item text color
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: smallApp ? "0.65rem" : "0.75rem",
                  color: "var(--chart-label-text)",
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--chart-color-1)"
                strokeWidth={3}
                name="Retirement Balance"
                dot={{ r: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Section>
  );
};

export default RetirementCalculator;
