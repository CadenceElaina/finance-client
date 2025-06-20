// src/features/Dashboard/Apps/Plan/Calculators/CompoundInterestCalculator.jsx
import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Button from "../../../../../components/ui/Button/Button";
import planStyles from "../plan.module.css";
import Section from "../../../../../components/ui/Section/Section";
import SectionHeader from "../../../../../components/ui/Section/SectionHeader";

const CompoundInterestCalculator = ({ smallApp }) => {
  const [inputs, setInputs] = useState({
    initialAmount: 1000,
    monthlyContribution: 500,
    annualReturnRate: 7,
    inflationRate: 2.5,
    years: 30,
  });

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const { results, chartData } = useMemo(() => {
    const {
      initialAmount,
      monthlyContribution,
      annualReturnRate,
      inflationRate,
      years,
    } = inputs;

    if (years <= 0) return { results: null, chartData: [] };

    const monthlyRate = annualReturnRate / 100 / 12;
    const totalMonths = years * 12;
    const totalContributions =
      initialAmount + monthlyContribution * totalMonths;

    // Calculate year-by-year data for chart
    const yearlyData = [];
    let currentValue = initialAmount;
    let cumulativeContributions = initialAmount;

    for (let year = 0; year <= years; year++) {
      const inflationAdjustedValue =
        currentValue / Math.pow(1 + inflationRate / 100, year);

      yearlyData.push({
        year: year,
        "Nominal Value": Math.round(currentValue),
        "Inflation-Adjusted": Math.round(inflationAdjustedValue),
        "Total Contributions": Math.round(cumulativeContributions),
      });

      if (year < years) {
        // Add 12 months of contributions and growth
        for (let month = 0; month < 12; month++) {
          currentValue = currentValue * (1 + monthlyRate) + monthlyContribution;
        }
        cumulativeContributions += monthlyContribution * 12;
      }
    }

    const finalValue = currentValue;
    const totalInterest = finalValue - totalContributions;
    const inflationAdjustedValue =
      finalValue / Math.pow(1 + inflationRate / 100, years);

    // Calculate total return percentage
    const totalReturnPercent =
      totalContributions > 0 ? (totalInterest / totalContributions) * 100 : 0;

    const calculatedResults = {
      futureValue: finalValue,
      totalContributions,
      totalInterest,
      inflationAdjustedValue,
      totalReturnPercent, // Renamed from interestPercentage
    };

    return { results: calculatedResults, chartData: yearlyData };
  }, [inputs]);

  const resetCalculator = () => {
    setInputs({
      initialAmount: 1000,
      monthlyContribution: 500,
      annualReturnRate: 7,
      inflationRate: 2.5,
      years: 30,
    });
  };

  return (
    <Section
      header={<SectionHeader title="Compound Interest Calculator" />}
      className={planStyles.calculatorContainer}
    >
      <div className={planStyles.calculatorContent}>
        <div className={planStyles.calculatorForm}>
          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Initial Investment</label>
              <input
                type="number"
                value={inputs.initialAmount}
                onChange={(e) =>
                  handleInputChange("initialAmount", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="100"
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
                step="50"
              />
            </div>
          </div>

          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>
                Annual Return Rate (%)
              </label>
              <input
                type="number"
                value={inputs.annualReturnRate}
                onChange={(e) =>
                  handleInputChange("annualReturnRate", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                max="50"
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
                Investment Period (Years)
              </label>
              <input
                type="number"
                value={inputs.years}
                onChange={(e) => handleInputChange("years", e.target.value)}
                className={planStyles.formInput}
                min="1"
                max="50"
                step="1"
              />
            </div>
            <div className={planStyles.formGroup}>
              <Button onClick={resetCalculator} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className={planStyles.calculatorResults}>
          <h4 style={{ textAlign: "center", marginBottom: "var(--space-sm)" }}>
            Investment Growth Results
          </h4>

          {results && (
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Final Value</span>
              <span className={planStyles.resultValue}>
                $
                {results.futureValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {results && (
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>
                Total Contributions
              </span>
              <span className={planStyles.resultValue}>
                $
                {results.totalContributions.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {results && (
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Investment Growth</span>
              <span className={planStyles.resultValue}>
                $
                {results.totalInterest.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {results && (
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>Total Return</span>
              <span className={planStyles.resultValue}>
                {results.totalReturnPercent.toFixed(1)}%
              </span>
            </div>
          )}

          {results && (
            <div className={planStyles.resultItem}>
              <span className={planStyles.resultLabel}>
                Inflation-Adjusted Value
              </span>
              <span className={planStyles.resultValue}>
                $
                {results.inflationAdjustedValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>

        {chartData.length > 0 && (
          <div className={planStyles.calculatorChart}>
            <ResponsiveContainer width="100%" height={smallApp ? 200 : 280}>
              <LineChart data={chartData}>
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
                <Line
                  type="monotone"
                  dataKey="Nominal Value"
                  stroke="var(--chart-color-1)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Inflation-Adjusted"
                  stroke="var(--chart-color-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Total Contributions"
                  stroke="var(--chart-color-3)"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Section>
  );
};

export default CompoundInterestCalculator;
