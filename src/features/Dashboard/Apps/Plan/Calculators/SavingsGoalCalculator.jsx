// src/features/Dashboard/Apps/Plan/Calculators/SavingsGoalCalculator.jsx
import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import Button from "../../../../../components/ui/Button/Button";
import planStyles from "../plan.module.css";

const SavingsGoalCalculator = ({ smallApp }) => {
  const [inputs, setInputs] = useState({
    goalAmount: 10000,
    currentSavings: 0,
    interestRate: 2.5, // Changed from annualReturnRate
    monthlyContribution: 500,
    timeFrameMonths: 24,
    calculationType: "minimumContribution", // "minimumContribution", "timeToGoal", "shortfallSurplus"
  });

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: field === "calculationType" ? value : parseFloat(value) || 0,
    }));
  };

  const { results, chartData } = useMemo(() => {
    const {
      goalAmount,
      currentSavings,
      interestRate,
      monthlyContribution,
      timeFrameMonths,
      calculationType,
    } = inputs;

    if (goalAmount <= currentSavings) {
      return {
        results: {
          goalMet: true,
          surplus: currentSavings - goalAmount,
        },
        chartData: [],
      };
    }

    const monthlyRate = interestRate / 100 / 12;
    const amountNeeded = goalAmount - currentSavings;

    let calculatedResults;
    let projectionData = [];

    if (calculationType === "minimumContribution") {
      // Calculate minimum monthly contribution needed to reach goal in timeframe
      let requiredMonthlyContribution = 0;

      if (monthlyRate > 0 && timeFrameMonths > 0) {
        // Future value of current savings after timeframe
        const futureCurrentSavings =
          currentSavings * Math.pow(1 + monthlyRate, timeFrameMonths);
        const remainingNeeded = goalAmount - futureCurrentSavings;

        if (remainingNeeded > 0) {
          // Calculate required monthly payment using future value of annuity formula
          requiredMonthlyContribution =
            (remainingNeeded * monthlyRate) /
            (Math.pow(1 + monthlyRate, timeFrameMonths) - 1);
        }
      } else {
        // No interest
        requiredMonthlyContribution = amountNeeded / timeFrameMonths;
      }

      const totalContributions = requiredMonthlyContribution * timeFrameMonths;
      const interestEarned = goalAmount - currentSavings - totalContributions;

      calculatedResults = {
        requiredMonthlyContribution,
        totalContributions,
        interestEarned: Math.max(0, interestEarned),
        timeFrame: timeFrameMonths,
        goalMet: false,
      };

      // Generate chart data showing progress
      let balance = currentSavings;
      for (let month = 0; month <= timeFrameMonths; month++) {
        projectionData.push({
          month,
          "Savings Balance": Math.round(balance),
          "Goal Amount": goalAmount,
        });
        if (month < timeFrameMonths) {
          balance = balance * (1 + monthlyRate) + requiredMonthlyContribution;
        }
      }
    } else if (calculationType === "timeToGoal") {
      // Calculate time needed with fixed monthly contribution
      let balance = currentSavings;
      let monthsNeeded = 0;

      if (monthlyContribution <= 0) {
        calculatedResults = {
          monthsNeeded: Infinity,
          yearsNeeded: Infinity,
          totalContributions: 0,
          interestEarned: 0,
          goalMet: false,
          error: "Monthly contribution must be greater than 0",
        };
      } else {
        while (balance < goalAmount && monthsNeeded < 1200) {
          balance = balance * (1 + monthlyRate) + monthlyContribution;
          monthsNeeded++;

          // Add to chart data for first 60 months (5 years)
          if (monthsNeeded <= 60) {
            projectionData.push({
              month: monthsNeeded,
              "Savings Balance": Math.round(balance),
              "Goal Amount": goalAmount,
            });
          }
        }

        const totalContributions = monthlyContribution * monthsNeeded;
        const interestEarned = goalAmount - currentSavings - totalContributions;

        calculatedResults = {
          monthsNeeded,
          yearsNeeded: monthsNeeded / 12,
          totalContributions,
          interestEarned: Math.max(0, interestEarned),
          goalMet: false,
        };
      }
    } else if (calculationType === "shortfallSurplus") {
      // Calculate if current plan meets goal and by how much
      let balance = currentSavings;

      // Calculate balance after timeframe with current monthly contribution
      for (let month = 0; month < timeFrameMonths; month++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }

      const finalBalance = balance;
      const shortfall = goalAmount - finalBalance;
      const surplus = finalBalance - goalAmount;
      const isOnTrack = finalBalance >= goalAmount;

      const totalContributions = monthlyContribution * timeFrameMonths;
      const interestEarned = finalBalance - currentSavings - totalContributions;

      calculatedResults = {
        finalBalance,
        shortfall: shortfall > 0 ? shortfall : 0,
        surplus: surplus > 0 ? surplus : 0,
        isOnTrack,
        totalContributions,
        interestEarned: Math.max(0, interestEarned),
        goalMet: false,
      };

      // Generate chart data
      balance = currentSavings;
      for (let month = 0; month <= timeFrameMonths; month++) {
        projectionData.push({
          month,
          "Savings Balance": Math.round(balance),
          "Goal Amount": goalAmount,
        });
        if (month < timeFrameMonths) {
          balance = balance * (1 + monthlyRate) + monthlyContribution;
        }
      }
    }

    return { results: calculatedResults, chartData: projectionData };
  }, [inputs]);

  const resetCalculator = () => {
    setInputs({
      goalAmount: 10000,
      currentSavings: 0,
      interestRate: 2.5,
      monthlyContribution: 500,
      timeFrameMonths: 24,
      calculationType: "minimumContribution",
    });
  };

  return (
    <div className={planStyles.calculatorContainer}>
      <h3 className={planStyles.calculatorTitle}>Savings Goal Calculator</h3>

      <div className={planStyles.calculatorContent}>
        <div className={planStyles.calculatorForm}>
          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Goal Amount</label>
              <input
                type="number"
                value={inputs.goalAmount}
                onChange={(e) =>
                  handleInputChange("goalAmount", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                step="500"
              />
            </div>

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
                step="100"
              />
            </div>
          </div>

          <div className={planStyles.formRow}>
            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Interest Rate (%)</label>
              <input
                type="number"
                value={inputs.interestRate}
                onChange={(e) =>
                  handleInputChange("interestRate", e.target.value)
                }
                className={planStyles.formInput}
                min="0"
                max="20"
                step="0.1"
              />
            </div>

            <div className={planStyles.formGroup}>
              <label className={planStyles.formLabel}>Calculate</label>
              <select
                value={inputs.calculationType}
                onChange={(e) =>
                  handleInputChange("calculationType", e.target.value)
                }
                className={planStyles.formInput}
              >
                <option value="minimumContribution">
                  Minimum Monthly Needed
                </option>
                <option value="timeToGoal">Time to Reach Goal</option>
                <option value="shortfallSurplus">
                  Shortfall/Surplus Check
                </option>
              </select>
            </div>
          </div>

          {/* Show relevant input fields based on calculation type */}
          {inputs.calculationType === "minimumContribution" && (
            <div className={planStyles.formRow}>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>
                  Target Timeframe (Months)
                </label>
                <input
                  type="number"
                  value={inputs.timeFrameMonths}
                  onChange={(e) =>
                    handleInputChange("timeFrameMonths", e.target.value)
                  }
                  className={planStyles.formInput}
                  min="1"
                  max="600"
                />
              </div>
              <div className={planStyles.formGroup}>
                <Button onClick={resetCalculator} variant="secondary">
                  Reset
                </Button>
              </div>
            </div>
          )}

          {inputs.calculationType === "timeToGoal" && (
            <div className={planStyles.formRow}>
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
              <div className={planStyles.formGroup}>
                <Button onClick={resetCalculator} variant="secondary">
                  Reset
                </Button>
              </div>
            </div>
          )}

          {inputs.calculationType === "shortfallSurplus" && (
            <div className={planStyles.formRow}>
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
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>
                  Timeframe (Months)
                </label>
                <input
                  type="number"
                  value={inputs.timeFrameMonths}
                  onChange={(e) =>
                    handleInputChange("timeFrameMonths", e.target.value)
                  }
                  className={planStyles.formInput}
                  min="1"
                  max="600"
                />
              </div>
            </div>
          )}

          {inputs.calculationType === "shortfallSurplus" && (
            <div className={planStyles.formActions}>
              <Button onClick={resetCalculator} variant="secondary">
                Reset
              </Button>
            </div>
          )}
        </div>

        {results && (
          <div className={planStyles.calculatorResults}>
            {results.goalMet ? (
              <>
                <div className={planStyles.resultItem}>
                  <span className={planStyles.resultLabel}>Status</span>
                  <span
                    className={`${planStyles.resultValue} ${planStyles.positive}`}
                  >
                    Goal Already Met!
                  </span>
                </div>
                <div className={planStyles.resultItem}>
                  <span className={planStyles.resultLabel}>Surplus</span>
                  <span
                    className={`${planStyles.resultValue} ${planStyles.positive}`}
                  >
                    $
                    {results.surplus.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </>
            ) : (
              <>
                {inputs.calculationType === "minimumContribution" && (
                  <>
                    <div className={planStyles.resultItem}>
                      <span className={planStyles.resultLabel}>
                        Required Monthly Contribution
                      </span>
                      <span className={planStyles.resultValue}>
                        $
                        {results.requiredMonthlyContribution.toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>

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

                    <div className={planStyles.resultItem}>
                      <span className={planStyles.resultLabel}>
                        Interest Earned
                      </span>
                      <span
                        className={`${planStyles.resultValue} ${planStyles.positive}`}
                      >
                        $
                        {results.interestEarned.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </>
                )}

                {inputs.calculationType === "timeToGoal" && !results.error && (
                  <>
                    <div className={planStyles.resultItem}>
                      <span className={planStyles.resultLabel}>
                        Time to Goal
                      </span>
                      <span className={planStyles.resultValue}>
                        {results.monthsNeeded < 1200
                          ? `${
                              results.monthsNeeded
                            } months (${results.yearsNeeded.toFixed(1)} years)`
                          : "Goal not reachable with current contribution"}
                      </span>
                    </div>

                    {results.monthsNeeded < 1200 && (
                      <>
                        <div className={planStyles.resultItem}>
                          <span className={planStyles.resultLabel}>
                            Total Contributions
                          </span>
                          <span className={planStyles.resultValue}>
                            $
                            {results.totalContributions.toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 }
                            )}
                          </span>
                        </div>

                        <div className={planStyles.resultItem}>
                          <span className={planStyles.resultLabel}>
                            Interest Earned
                          </span>
                          <span
                            className={`${planStyles.resultValue} ${planStyles.positive}`}
                          >
                            $
                            {results.interestEarned.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {inputs.calculationType === "timeToGoal" && results.error && (
                  <div className={planStyles.resultItem}>
                    <span className={planStyles.resultLabel}>Error</span>
                    <span
                      className={`${planStyles.resultValue} ${planStyles.negative}`}
                    >
                      {results.error}
                    </span>
                  </div>
                )}

                {inputs.calculationType === "shortfallSurplus" && (
                  <>
                    <div className={planStyles.resultItem}>
                      <span className={planStyles.resultLabel}>
                        Projected Balance
                      </span>
                      <span className={planStyles.resultValue}>
                        $
                        {results.finalBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className={planStyles.resultItem}>
                      <span className={planStyles.resultLabel}>Status</span>
                      <span
                        className={`${planStyles.resultValue} ${
                          results.isOnTrack
                            ? planStyles.positive
                            : planStyles.negative
                        }`}
                      >
                        {results.isOnTrack ? "On Track!" : "Behind Goal"}
                      </span>
                    </div>

                    {results.shortfall > 0 && (
                      <div className={planStyles.resultItem}>
                        <span className={planStyles.resultLabel}>
                          Shortfall
                        </span>
                        <span
                          className={`${planStyles.resultValue} ${planStyles.negative}`}
                        >
                          $
                          {results.shortfall.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    {results.surplus > 0 && (
                      <div className={planStyles.resultItem}>
                        <span className={planStyles.resultLabel}>Surplus</span>
                        <span
                          className={`${planStyles.resultValue} ${planStyles.positive}`}
                        >
                          $
                          {results.surplus.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    <div className={planStyles.resultItem}>
                      <span className={planStyles.resultLabel}>
                        Interest Earned
                      </span>
                      <span
                        className={`${planStyles.resultValue} ${planStyles.positive}`}
                      >
                        $
                        {results.interestEarned.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className={planStyles.calculatorChart}>
          <ResponsiveContainer width="100%" height={smallApp ? 200 : 280}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="month"
                fontSize={smallApp ? 10 : 12}
                tick={{ fill: "var(--chart-label-text)" }}
                label={{
                  value: "Months",
                  position: "insideBottom",
                  offset: -5,
                }}
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
                dataKey="Savings Balance"
                stroke="var(--chart-color-1)"
                strokeWidth={2}
                dot={false}
              />
              <ReferenceLine
                y={inputs.goalAmount}
                stroke="var(--chart-color-2)"
                strokeDasharray="8 8"
                strokeWidth={2}
                label={{
                  value: "Goal",
                  position: "topRight",
                  style: { fill: "var(--chart-label-text)" },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SavingsGoalCalculator;
