// src/features/Dashboard/Apps/Plan/Investments/InvestmentTab.jsx
import React, { useState, useMemo } from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import planStyles from "../plan.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const InvestmentRoadmapTab = ({ smallApp }) => {
  // SAFETY CHECK: Add early return if financial data context is not ready
  const financialDataResult = useFinancialData();

  if (!financialDataResult) {
    return (
      <div
        style={{
          padding: "var(--space-md)",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Loading investment data...
      </div>
    );
  }

  const { data } = financialDataResult;

  // SAFETY CHECK: Ensure data exists
  if (!data) {
    return (
      <div
        style={{
          padding: "var(--space-md)",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Initializing investment roadmap...
      </div>
    );
  }

  const { accounts, budget, goals } = data;

  // User settings
  const [settings, setSettings] = useState({
    inflationRate: 2.5, // Default inflation rate
    expectedReturn: 7.0, // Default market return
    debtThreshold: 6.0, // Interest rate threshold for debt vs investment
  });

  // Calculate investment roadmap logic
  const roadmapAnalysis = useMemo(() => {
    // SAFETY CHECK: Ensure budget exists and has required properties
    const safeMonthlyExpenses = budget?.totalMonthlyExpenses || 0;
    const safeDiscretionaryIncome = budget?.discretionaryIncome || 0;
    const safeAccounts = accounts || [];

    // Calculate emergency fund needs (3-6 months of expenses)
    const emergencyFundTarget = safeMonthlyExpenses * 6;
    const currentCash = safeAccounts
      .filter((acc) => acc.category === "Cash")
      .reduce((sum, acc) => sum + (acc.value || 0), 0);

    const emergencyFundGap = Math.max(0, emergencyFundTarget - currentCash);

    // Calculate high-interest debt
    const highInterestDebt = safeAccounts
      .filter(
        (acc) =>
          acc.category === "Debt" &&
          (acc.interestRate || 0) > settings.debtThreshold
      )
      .reduce((sum, acc) => sum + Math.abs(acc.value || 0), 0);

    // Calculate current retirement savings
    const retirementAccounts = safeAccounts.filter(
      (acc) =>
        acc.category === "Investments" &&
        (acc.subType?.includes("401") || acc.subType?.includes("IRA"))
    );
    const currentRetirementSavings = retirementAccounts.reduce(
      (sum, acc) => sum + (acc.value || 0),
      0
    );

    return {
      monthlyExpenses: safeMonthlyExpenses,
      discretionaryIncome: safeDiscretionaryIncome,
      emergencyFundTarget,
      currentCash,
      emergencyFundGap,
      highInterestDebt,
      currentRetirementSavings,
      hasHighInterestDebt: highInterestDebt > 0,
      hasEmergencyFundGap: emergencyFundGap > 0,
    };
  }, [accounts, budget, settings]);

  // Generate roadmap steps
  const roadmapSteps = useMemo(() => {
    const steps = [];
    let remainingIncome = roadmapAnalysis.discretionaryIncome;

    // Step 1: Emergency Fund Starter (if needed)
    if (
      roadmapAnalysis.hasEmergencyFundGap &&
      roadmapAnalysis.currentCash < 1000
    ) {
      const allocation = Math.min(remainingIncome * 0.3, 500);
      steps.push({
        id: 1,
        title: "Emergency Fund Starter",
        subtitle: "Build $1,000 emergency fund",
        priority: "Critical",
        status: "pending",
        action: "Save to high-yield savings",
        allocation: allocation,
        explanation: "Start with a small emergency fund before tackling debt.",
        icon: "🚨",
        progress: Math.min((roadmapAnalysis.currentCash / 1000) * 100, 100),
      });
      remainingIncome -= allocation;
    }

    // Step 2: High-Interest Debt (if any)
    if (roadmapAnalysis.hasHighInterestDebt) {
      const allocation = Math.min(remainingIncome * 0.7, remainingIncome - 200);
      steps.push({
        id: 2,
        title: "Pay Off High-Interest Debt",
        subtitle: `$${roadmapAnalysis.highInterestDebt.toLocaleString()} at >${
          settings.debtThreshold
        }%`,
        priority: "High",
        status: "pending",
        action: "Pay minimums + extra payments",
        allocation: allocation,
        explanation: `Debt above ${settings.debtThreshold}% costs more than expected investment returns.`,
        icon: "💳",
        progress: 0,
      });
      remainingIncome -= allocation;
    }

    // Step 3: Employer 401k Match (if applicable)
    const monthlyMatch = 200; // Estimated - could be calculated from accounts
    if (remainingIncome > 0) {
      const allocation = Math.min(monthlyMatch, remainingIncome);
      steps.push({
        id: 3,
        title: "Employer 401(k) Match",
        subtitle: "Free money from employer",
        priority: "High",
        status: "active",
        action: "Contribute to get full match",
        allocation: allocation,
        explanation: "Employer match is an immediate 100% return.",
        icon: "🎯",
        progress: 75,
      });
      remainingIncome -= allocation;
    }

    // Step 4: Complete Emergency Fund
    if (
      roadmapAnalysis.hasEmergencyFundGap &&
      roadmapAnalysis.currentCash >= 1000
    ) {
      const allocation = Math.min(remainingIncome * 0.5, 500);
      steps.push({
        id: 4,
        title: "Complete Emergency Fund",
        subtitle: `Build ${roadmapAnalysis.emergencyFundTarget.toLocaleString()} (6 months expenses)`,
        priority: "Medium",
        status: "pending",
        action: "Continue saving to high-yield account",
        allocation: allocation,
        explanation: "Full emergency fund protects your investments.",
        icon: "🛡️",
        progress:
          (roadmapAnalysis.currentCash / roadmapAnalysis.emergencyFundTarget) *
          100,
      });
      remainingIncome -= allocation;
    }

    // Step 5: Roth IRA
    if (remainingIncome > 0) {
      const allocation = Math.min(remainingIncome, 500);
      steps.push({
        id: 5,
        title: "Roth IRA",
        subtitle: "Tax-free growth and withdrawals",
        priority: "Medium",
        status: "pending",
        action: "Open and fund Roth IRA",
        allocation: allocation,
        explanation:
          "Tax-free growth with flexibility for early withdrawal of contributions.",
        icon: "📈",
        progress: 25,
      });
      remainingIncome -= allocation;
    }

    // Step 6: Additional 401k or Taxable Investments
    if (remainingIncome > 50) {
      steps.push({
        id: 6,
        title: "Additional Investments",
        subtitle: "Maximize 401(k) or taxable accounts",
        priority: "Low",
        status: "future",
        action: "Increase 401(k) or open brokerage",
        allocation: remainingIncome,
        explanation:
          "Continue building wealth through diversified investments.",
        icon: "🚀",
        progress: 0,
      });
    }

    return steps;
  }, [roadmapAnalysis, settings]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "var(--status-success)";
      case "active":
        return "var(--color-primary)";
      case "pending":
        return "var(--status-warning)";
      case "future":
        return "var(--text-secondary)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "active":
        return "⚡";
      case "pending":
        return "⏳";
      case "future":
        return "💭";
      default:
        return "❓";
    }
  };

  return (
    <div className={planStyles.planContentWrapper}>
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Investment Roadmap"
              editMode={false}
              editable={false}
            />
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-secondary)",
              }}
            >
              Available: ${roadmapAnalysis.discretionaryIncome.toLocaleString()}
              /month
            </div>
          </div>
        }
      >
        {/* Investment Assumptions Settings */}
        <div className={planStyles.roadmapSettings}>
          <h4>Investment Assumptions</h4>
          <div className={planStyles.settingsRow}>
            <div className={planStyles.settingGroup}>
              <label>Expected Annual Return (%)</label>
              <input
                type="number"
                value={settings.expectedReturn}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    expectedReturn: parseFloat(e.target.value) || 7,
                  }))
                }
                className={planStyles.formInput}
                step="0.1"
                min="0"
                max="20"
              />
            </div>
            <div className={planStyles.settingGroup}>
              <label>Inflation Rate (%)</label>
              <input
                type="number"
                value={settings.inflationRate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    inflationRate: parseFloat(e.target.value) || 2.5,
                  }))
                }
                className={planStyles.formInput}
                step="0.1"
                min="0"
                max="10"
              />
            </div>
            <div className={planStyles.settingGroup}>
              <label>Debt Payoff Threshold (%)</label>
              <input
                type="number"
                value={settings.debtThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    debtThreshold: parseFloat(e.target.value) || 6,
                  }))
                }
                className={planStyles.formInput}
                step="0.1"
                min="0"
                max="15"
              />
              <div className={planStyles.helpText}>
                Pay off debt above this rate aggressively
              </div>
            </div>
          </div>
          <div className={planStyles.realReturnInfo}>
            <strong>
              Real Investment Return (after inflation):{" "}
              {(settings.expectedReturn - settings.inflationRate).toFixed(1)}%
            </strong>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className={planStyles.roadmapContainer}>
          <div className={planStyles.roadmapTimeline}>
            {roadmapSteps.map((step, index) => (
              <div key={step.id} className={planStyles.roadmapStep}>
                {index < roadmapSteps.length - 1 && (
                  <div className={planStyles.stepConnector}>
                    <div className={planStyles.connectorLine}></div>
                  </div>
                )}
                <div className={planStyles.stepCard}>
                  <div className={planStyles.stepHeader}>
                    <div className={planStyles.stepIconGroup}>
                      <div
                        className={planStyles.stepIcon}
                        style={{ color: getStatusColor(step.status) }}
                      >
                        {step.icon}
                      </div>
                      <div
                        className={planStyles.statusIcon}
                        style={{ color: getStatusColor(step.status) }}
                      >
                        {getStatusIcon(step.status)}
                      </div>
                    </div>
                    <div className={planStyles.stepInfo}>
                      <div className={planStyles.stepTitle}>{step.title}</div>
                      <div className={planStyles.stepSubtitle}>
                        {step.subtitle}
                      </div>
                      <div
                        className={planStyles.stepPriority}
                        style={{
                          color:
                            step.priority === "Critical"
                              ? "var(--status-danger)"
                              : step.priority === "High"
                              ? "var(--status-warning)"
                              : step.priority === "Medium"
                              ? "var(--color-primary)"
                              : "var(--text-secondary)",
                        }}
                      >
                        {step.priority} Priority
                      </div>
                    </div>
                  </div>

                  <div className={planStyles.stepProgress}>
                    <div className={planStyles.progressBar}>
                      <div
                        className={planStyles.progressFill}
                        style={{
                          width: `${step.progress}%`,
                          background: getStatusColor(step.status),
                        }}
                      ></div>
                    </div>
                    <div className={planStyles.progressText}>
                      {step.progress.toFixed(0)}% Complete
                    </div>
                  </div>

                  <div className={planStyles.stepDetails}>
                    <div className={planStyles.stepAction}>
                      <strong>Action:</strong> {step.action}
                    </div>
                    {step.allocation > 0 && (
                      <div className={planStyles.stepAmount}>
                        <strong>Monthly Allocation:</strong> $
                        {step.allocation.toLocaleString()}
                      </div>
                    )}
                    <div className={planStyles.stepExplanation}>
                      {step.explanation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={planStyles.roadmapSummary}>
          <h4>Monthly Allocation Summary</h4>
          <div className={planStyles.summaryGrid}>
            <div className={planStyles.summaryItem}>
              <span>Total Discretionary Income:</span>
              <span>
                ${roadmapAnalysis.discretionaryIncome.toLocaleString()}
              </span>
            </div>
            <div className={planStyles.summaryItem}>
              <span>Allocated to Plan:</span>
              <span>
                $
                {roadmapSteps
                  .reduce((sum, step) => sum + (step.allocation || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className={planStyles.summaryItem}>
              <span>Remaining Buffer:</span>
              <span>
                $
                {Math.max(
                  0,
                  roadmapAnalysis.discretionaryIncome -
                    roadmapSteps.reduce(
                      (sum, step) => sum + (step.allocation || 0),
                      0
                    )
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default InvestmentRoadmapTab;
