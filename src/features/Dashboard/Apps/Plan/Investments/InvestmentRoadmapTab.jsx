// src/features/Dashboard/Apps/Plan/Investments/InvestmentTab.jsx
import React, { useState, useMemo } from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import Button from "../../../../../components/ui/Button/Button";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import planStyles from "../plan.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import {
  ChevronRight,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Shield,
  CreditCard,
  Building,
  Target,
} from "lucide-react";

const InvestmentRoadmapTab = ({ smallApp }) => {
  const { data } = useFinancialData();
  const { accounts, budget, goals } = data;

  // User settings
  const [settings, setSettings] = useState({
    inflationRate: 2.5, // Default inflation rate
    expectedReturn: 7.0, // Default market return
    debtThreshold: 6.0, // Interest rate threshold for debt vs investment
  });

  // Calculate investment roadmap logic
  const roadmapAnalysis = useMemo(() => {
    const monthlyExpenses = budget.totalMonthlyExpenses || 0;
    const discretionaryIncome = budget.discretionaryIncome || 0;

    // Get all debts (excluding mortgage for now)
    const debts = accounts.filter(
      (acc) =>
        acc.category === "Debt" && acc.subType !== "Mortgage" && acc.value < 0
    );

    // Calculate emergency fund status
    const emergencyFundTarget = monthlyExpenses * 6;
    const currentEmergencyFund = accounts
      .filter((acc) => acc.category === "Cash")
      .reduce((sum, acc) => sum + (acc.value || 0), 0);

    // Get current investment balances
    const currentRetirementSavings = accounts
      .filter(
        (acc) =>
          acc.category === "Investments" &&
          (acc.subType === "401(k)" ||
            acc.subType === "403(b)" ||
            acc.subType === "TSP")
      )
      .reduce((sum, acc) => sum + (acc.value || 0), 0);

    const currentIRASavings = accounts
      .filter(
        (acc) =>
          acc.category === "Investments" &&
          (acc.subType === "Roth IRA" || acc.subType === "Traditional IRA")
      )
      .reduce((sum, acc) => sum + (acc.value || 0), 0);

    const currentTaxableSavings = accounts
      .filter(
        (acc) =>
          acc.category === "Investments" && acc.subType === "Taxable Brokerage"
      )
      .reduce((sum, acc) => sum + (acc.value || 0), 0);

    // Calculate real rates
    const realInvestmentReturn =
      settings.expectedReturn - settings.inflationRate;

    // Analyze debt prioritization
    const highInterestDebts = debts.filter(
      (debt) => (debt.interestRate || 0) > settings.debtThreshold
    );

    const mediumInterestDebts = debts.filter((debt) => {
      const rate = debt.interestRate || 0;
      return rate > 4 && rate <= settings.debtThreshold;
    });

    const lowInterestDebts = debts.filter(
      (debt) => (debt.interestRate || 0) <= 4
    );

    return {
      monthlyExpenses,
      discretionaryIncome,
      emergencyFundTarget,
      currentEmergencyFund,
      emergencyFundProgress:
        emergencyFundTarget > 0
          ? (currentEmergencyFund / emergencyFundTarget) * 100
          : 100,
      debts: {
        high: highInterestDebts,
        medium: mediumInterestDebts,
        low: lowInterestDebts,
        total: debts.reduce((sum, debt) => sum + Math.abs(debt.value || 0), 0),
      },
      investments: {
        retirement: currentRetirementSavings,
        ira: currentIRASavings,
        taxable: currentTaxableSavings,
      },
      realInvestmentReturn,
    };
  }, [accounts, budget, settings]);

  // Generate roadmap steps
  const roadmapSteps = useMemo(() => {
    const steps = [];
    let remainingDiscretionary = roadmapAnalysis.discretionaryIncome;

    // Step 1: High-Interest Debt
    if (roadmapAnalysis.debts.high.length > 0) {
      const totalHighDebt = roadmapAnalysis.debts.high.reduce(
        (sum, debt) => sum + Math.abs(debt.value || 0),
        0
      );
      const highestDebt = roadmapAnalysis.debts.high.reduce((prev, current) =>
        (prev.interestRate || 0) > (current.interestRate || 0) ? prev : current
      );

      steps.push({
        id: "high-debt",
        title: "Eliminate High-Interest Debt",
        subtitle: `Focus on debt above ${settings.debtThreshold}%`,
        status: "action-required",
        priority: 1,
        icon: CreditCard,
        progress: 0,
        amount: totalHighDebt,
        action: `Pay off ${highestDebt.name} (${highestDebt.interestRate}% APR)`,
        explanation: `Paying off debt with ${highestDebt.interestRate}% interest gives you a guaranteed return that beats most investments.`,
        allocation: Math.min(remainingDiscretionary * 0.8, totalHighDebt / 12), // 80% of discretionary or what's needed
      });
      remainingDiscretionary -= Math.min(
        remainingDiscretionary * 0.8,
        totalHighDebt / 12
      );
    }

    // Step 2: Emergency Fund
    const emergencyShortfall = Math.max(
      0,
      roadmapAnalysis.emergencyFundTarget - roadmapAnalysis.currentEmergencyFund
    );
    if (emergencyShortfall > 0) {
      steps.push({
        id: "emergency-fund",
        title: "Build Emergency Fund",
        subtitle: "6 months of living expenses",
        status:
          roadmapAnalysis.emergencyFundProgress >= 100
            ? "complete"
            : "in-progress",
        priority: 2,
        icon: Shield,
        progress: roadmapAnalysis.emergencyFundProgress,
        amount: emergencyShortfall,
        action: `Save $${emergencyShortfall.toLocaleString()} more`,
        explanation:
          "Emergency fund provides financial security and prevents debt accumulation during unexpected events.",
        allocation: Math.min(
          remainingDiscretionary * 0.3,
          emergencyShortfall / 12
        ),
      });
      remainingDiscretionary -= Math.min(
        remainingDiscretionary * 0.3,
        emergencyShortfall / 12
      );
    } else {
      steps.push({
        id: "emergency-fund",
        title: "Emergency Fund Complete",
        subtitle: "6 months of expenses saved ✓",
        status: "complete",
        priority: 2,
        icon: Shield,
        progress: 100,
        amount: 0,
        action: "Maintain current balance",
        explanation: "Your emergency fund is fully funded!",
        allocation: 0,
      });
    }

    // Step 3: Employer Match (informational)
    steps.push({
      id: "employer-match",
      title: "Maximize Employer 401k Match",
      subtitle: "Free money from your employer",
      status: "info",
      priority: 3,
      icon: Building,
      progress: null,
      amount: null,
      action: "Update in Income section if not already maxed",
      explanation:
        "Employer matching is an immediate 100% return on investment. Update your income if you're not contributing enough.",
      allocation: 0,
    });

    // Step 4: Medium Interest Debt Decision
    if (roadmapAnalysis.debts.medium.length > 0) {
      const totalMediumDebt = roadmapAnalysis.debts.medium.reduce(
        (sum, debt) => sum + Math.abs(debt.value || 0),
        0
      );

      steps.push({
        id: "medium-debt",
        title: "Medium-Interest Debt Strategy",
        subtitle: `Debt between 4-${settings.debtThreshold}%: Balanced approach`,
        status: "strategy",
        priority: 4,
        icon: TrendingUp,
        progress: null,
        amount: totalMediumDebt,
        action: "Split strategy: 50% extra payments, 50% investing",
        explanation: `With moderate interest rates, a balanced approach of extra payments and investing often works well.`,
        allocation: Math.min(
          remainingDiscretionary * 0.5,
          totalMediumDebt / 24
        ), // 50% for 2 years
      });
      remainingDiscretionary -= Math.min(
        remainingDiscretionary * 0.5,
        totalMediumDebt / 24
      );
    }

    // Step 5: IRA Maximization
    const iraLimit = 7000; // 2024 limit + catch-up for age 50+
    const currentIRAContributions = 0; // This should come from user input or be tracked
    const iraShortfall = iraLimit - currentIRAContributions;

    if (iraShortfall > 0 && remainingDiscretionary > 0) {
      steps.push({
        id: "ira-max",
        title: "Maximize IRA Contributions",
        subtitle: "Roth or Traditional IRA",
        status: "recommended",
        priority: 5,
        icon: Target,
        progress: (currentIRAContributions / iraLimit) * 100,
        amount: iraShortfall,
        action: `Contribute $${Math.min(
          iraShortfall,
          remainingDiscretionary * 12
        ).toLocaleString()} annually`,
        explanation:
          "IRAs offer tax advantages for retirement savings. Choose Roth for tax-free growth or Traditional for current tax deduction.",
        allocation: Math.min(remainingDiscretionary, iraShortfall / 12),
      });
      remainingDiscretionary -= Math.min(
        remainingDiscretionary,
        iraShortfall / 12
      );
    }

    // Step 6: Surplus Investment
    if (remainingDiscretionary > 100) {
      // Only show if meaningful amount
      steps.push({
        id: "surplus-investment",
        title: "Invest Surplus Income",
        subtitle: "Taxable brokerage or additional goals",
        status: "opportunity",
        priority: 6,
        icon: DollarSign,
        progress: null,
        amount: remainingDiscretionary * 12,
        action: `Invest $${remainingDiscretionary.toLocaleString()}/month in taxable accounts`,
        explanation:
          "After completing the essential steps, invest remaining funds for long-term growth or specific goals.",
        allocation: remainingDiscretionary,
      });
    }

    return steps;
  }, [roadmapAnalysis, settings]);

  const getStatusColor = (status) => {
    switch (status) {
      case "complete":
        return "var(--status-success)";
      case "action-required":
        return "var(--status-danger)";
      case "in-progress":
        return "var(--status-warning)";
      case "recommended":
        return "var(--color-primary)";
      case "strategy":
        return "var(--color-secondary)";
      case "opportunity":
        return "var(--text-secondary)";
      case "info":
        return "var(--status-info)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "complete":
        return CheckCircle;
      case "action-required":
        return AlertCircle;
      case "in-progress":
        return TrendingUp;
      default:
        return ChevronRight;
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
        {/* Settings Section */}
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

        {/* Roadmap Steps */}
        <div className={planStyles.roadmapContainer}>
          <div className={planStyles.roadmapTimeline}>
            {roadmapSteps.map((step, index) => {
              const StatusIcon = getStatusIcon(step.status);
              const StepIcon = step.icon;

              return (
                <div key={step.id} className={planStyles.roadmapStep}>
                  <div className={planStyles.stepConnector}>
                    {index < roadmapSteps.length - 1 && (
                      <div className={planStyles.connectorLine} />
                    )}
                  </div>

                  <div
                    className={planStyles.stepCard}
                    style={{ borderLeftColor: getStatusColor(step.status) }}
                  >
                    <div className={planStyles.stepHeader}>
                      <div className={planStyles.stepIconGroup}>
                        <StepIcon
                          size={24}
                          color={getStatusColor(step.status)}
                          className={planStyles.stepIcon}
                        />
                        <StatusIcon
                          size={16}
                          color={getStatusColor(step.status)}
                          className={planStyles.statusIcon}
                        />
                      </div>
                      <div className={planStyles.stepInfo}>
                        <h4 className={planStyles.stepTitle}>{step.title}</h4>
                        <p className={planStyles.stepSubtitle}>
                          {step.subtitle}
                        </p>
                      </div>
                      <div className={planStyles.stepPriority}>
                        #{step.priority}
                      </div>
                    </div>

                    {step.progress !== null && (
                      <div className={planStyles.stepProgress}>
                        <div className={planStyles.progressBar}>
                          <div
                            className={planStyles.progressFill}
                            style={{
                              width: `${Math.min(step.progress, 100)}%`,
                              backgroundColor: getStatusColor(step.status),
                            }}
                          />
                        </div>
                        <span className={planStyles.progressText}>
                          {step.progress.toFixed(1)}% Complete
                        </span>
                      </div>
                    )}

                    <div className={planStyles.stepDetails}>
                      <div className={planStyles.stepAction}>
                        <strong>Action: </strong>
                        {step.action}
                      </div>

                      {step.amount !== null && step.amount > 0 && (
                        <div className={planStyles.stepAmount}>
                          <strong>Amount: </strong>$
                          {step.amount.toLocaleString()}
                        </div>
                      )}

                      {step.allocation > 0 && (
                        <div className={planStyles.stepAllocation}>
                          <strong>Suggested Monthly Allocation: </strong>$
                          {step.allocation.toLocaleString()}
                        </div>
                      )}

                      <div className={planStyles.stepExplanation}>
                        {step.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
