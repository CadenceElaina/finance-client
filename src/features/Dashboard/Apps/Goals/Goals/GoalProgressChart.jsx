// src/features/Dashboard/Apps/Plan/Goals/GoalProgressChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const GoalProgressChart = ({ goal, smallApp }) => {
  // Generate projection data
  const generateProjectionData = () => {
    if (!goal.monthlyContribution || goal.monthlyContribution <= 0) {
      return [];
    }

    const data = [];
    const monthsToProject = 36; // Project 3 years ahead
    let currentAmount = goal.currentAmount || 0;
    const monthlyContribution = parseFloat(goal.monthlyContribution) || 0;

    // Add current point
    data.push({
      month: 0,
      amount: currentAmount,
      target: goal.targetAmount,
      monthLabel: "Now",
    });

    // Project future months
    for (let month = 1; month <= monthsToProject; month++) {
      currentAmount += monthlyContribution;

      data.push({
        month,
        amount: Math.min(currentAmount, goal.targetAmount),
        target: goal.targetAmount,
        monthLabel: `Month ${month}`,
      });

      // Stop projecting once we reach the goal
      if (currentAmount >= goal.targetAmount) {
        break;
      }
    }

    return data;
  };

  const projectionData = generateProjectionData();

  if (projectionData.length <= 1) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--space-md)",
          color: "var(--text-secondary)",
        }}
      >
        Add a monthly contribution to see progress projection
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: smallApp ? 200 : 300 }}>
      <ResponsiveContainer>
        <LineChart data={projectionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="month"
            tick={{
              fill: "var(--chart-label-text)",
              fontSize: smallApp ? 10 : 12,
            }}
            tickFormatter={(value) => (value === 0 ? "Now" : `${value}m`)}
          />
          <YAxis
            tick={{
              fill: "var(--chart-label-text)",
              fontSize: smallApp ? 10 : 12,
            }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value, name) => [
              `$${value.toLocaleString()}`,
              name === "amount" ? "Projected Amount" : "Target",
            ]}
            labelFormatter={(month) =>
              month === 0 ? "Current" : `Month ${month}`
            }
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--border-radius-md)",
              fontSize: "var(--font-size-xs)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="var(--chart-color-1)"
            strokeWidth={2}
            name="Projected Progress"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="var(--chart-color-2)"
            strokeDasharray="5 5"
            strokeWidth={1}
            name="Target Amount"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GoalProgressChart;
