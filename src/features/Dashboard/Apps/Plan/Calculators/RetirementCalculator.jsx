// src/features/Dashboard/Apps/Plan/Calculators/RetirementCalculator.jsx
import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Button from "../../../../../components/ui/Button/Button";
import planStyles from "../plan.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

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

    if (retirementAge <= currentAge) return { results: null, chartData: [] };

    const yearsToRetirement = retirementAge - currentAge;
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = yearsToRetirement * 12;

    const futureCurrentSavings =
      currentSavings * Math.pow(1 + annualReturn / 100, yearsToRetirement);

    let futureContributions = 0;
    if (monthlyRate > 0) {
      futureContributions =
        (monthlyContribution * (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
        monthlyRate;
    } else {
      futureContributions = monthlyContribution * totalMonths;
    }

    const totalRetirementBalance = futureCurrentSavings + futureContributions;
    const inflationAdjustedIncome =
      desiredAnnualIncome *
      Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const requiredRetirementFund = inflationAdjustedIncome * retirementDuration;
    const sustainableAnnualWithdrawal = totalRetirementBalance * 0.04;

    const shortfall = requiredRetirementFund - totalRetirementBalance;
    const surplus = totalRetirementBalance - requiredRetirementFund;

    let additionalMonthlySavingsNeeded = 0;
    if (shortfall > 0) {
      if (monthlyRate > 0) {
        additionalMonthlySavingsNeeded =
          (shortfall * monthlyRate) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);
      } else {
        additionalMonthlySavingsNeeded = shortfall / totalMonths;
      }
    }

    const calculatedResults = {
      totalRetirementBalance,
      requiredRetirementFund,
      shortfall: shortfall > 0 ? shortfall : 0,
      surplus: surplus > 0 ? surplus : 0,
      sustainableAnnualWithdrawal,
      inflationAdjustedIncome,
      additionalMonthlySavingsNeeded,
      isOnTrack: shortfall <= 0,
    };

    // Chart data comparing scenarios
    const barChartData = [
      {
        name: "Current Plan",
        "Projected Balance": Math.round(totalRetirementBalance),
        "Required Amount": Math.round(requiredRetirementFund),
      },
    ];

    return { results: calculatedResults, chartData: barChartData };
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
    <div className={planStyles.calculatorContainer}>
      <h3 className={planStyles.calculatorTitle}>Retirement Calculator</h3>

      <div className={planStyles.calculatorContent}>
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
              <label className={planStyles.formLabel}>Current Savings</label>
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
                Monthly Contribution
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
              <label className={planStyles.formLabel}>Annual Return (%)</label>
              <input
                type="number"
                value={inputs.annualReturn}
                onChange={(e) =>
                  handleInputChange("annualReturn", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                max="20"
                step="0.1"
              />
            </div>

            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Desired Annual Income
              </label>
              <input
                type="number"
                value={inputs.desiredAnnualIncome}
                onChange={(e) =>
                  handleInputChange("desiredAnnualIncome", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="5000"
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
              <span className={planStyles.resultLabel}>Projected Balance</span>
              <span className={planStyles.resultValue}>
                $
                {results.totalRetirementBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Status</span>
              <span
                className={`${planStyles.resultValue} ${
                  results.isOnTrack ? planStyles.positive : planStyles.negative
                }`}
              >
                {results.isOnTrack ? "On Track!" : "Need More Savings"}
              </span>
            </div>

            {results.shortfall > 0 && (
              <div className={planStyles.resultItem}>
                <span className={planStyles.resultLabel}>
                  Additional Monthly Needed
                </span>
                <span
                  className={`${planStyles.resultValue} ${planStyles.negative}`}
                >
                  $
                  {results.additionalMonthlySavingsNeeded.toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className={planStyles.calculatorChart}>
          <ResponsiveContainer width="100%" height={smallApp ? 200 : 250}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
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
              <Bar dataKey="Projected Balance" fill="var(--chart-color-1)" />
              <Bar dataKey="Required Amount" fill="var(--chart-color-2)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RetirementCalculator;
