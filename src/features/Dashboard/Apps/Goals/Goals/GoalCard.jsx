// src/features/Dashboard/Apps/Plan/Goals/GoalCard.jsx
import React, { useMemo } from "react";
import { Edit, Trash2, Play, Pause } from "lucide-react";
import goalsStyles from "../goals.module.css";
import {
  calculateProgress,
  calculateTimeToGoal,
} from "../../Plan/utils/calculationUtils";

const GoalCard = ({
  goal,
  fundingAccount,
  onEdit,
  onRemove,
  onStatusToggle,
}) => {
  // FIXED: Always recalculate progress based on current data
  const hasTarget = goal.targetAmount && goal.targetAmount > 0;
  const hasTargetDate = !!goal.targetDate;

  // FIXED: Calculate current amount more robustly
  const currentAmount = useMemo(() => {
    let amount = 0;

    // Add linked account amount (if using entire account)
    if (goal.useEntireAccount && fundingAccount) {
      amount += fundingAccount.value || 0;
    } else if (goal.linkedAccountAmount) {
      amount += goal.linkedAccountAmount || 0;
    }

    // Add manual contributions
    amount += goal.manualContributions || 0;

    return amount;
  }, [goal, fundingAccount]);

  // FIXED: Calculate progress based on recalculated current amount
  const progress = hasTarget
    ? Math.min((currentAmount / goal.targetAmount) * 100, 100)
    : null;

  const timeToGoal =
    hasTarget && hasTargetDate && goal.monthlyContribution > 0
      ? calculateTimeToGoal({
          ...goal,
          currentAmount, // Use recalculated amount
        })
      : null;

  const isCompleted =
    goal.status === "completed" || (progress !== null && progress >= 100);
  const canToggleStatus = !isCompleted;

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "var(--status-success)";
      case "paused":
        return "var(--status-warning)";
      case "completed":
        return "var(--color-primary)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  // FIXED: Show breakdown of current amount if there's a linked account
  const getFundingTypeLabel = () => {
    const labels = [];

    if (
      goal.fundingAccountId &&
      fundingAccount &&
      goal.linkedAccountAmount > 0
    ) {
      labels.push(
        `${fundingAccount.name}: $${goal.linkedAccountAmount.toLocaleString()}`
      );
    }

    if (goal.linkedToBudget && goal.budgetMonthlyAmount > 0) {
      labels.push(
        `Budget: $${goal.budgetMonthlyAmount.toLocaleString()}/month`
      );
    }

    if (labels.length === 0) {
      return "Manual Contributions";
    }

    return labels.join(" • ");
  };

  // FIXED: Calculate manual contributions properly
  const manualContributions = Math.max(
    0,
    (goal.currentAmount || 0) - (goal.linkedAccountAmount || 0)
  );

  return (
    <div className={goalsStyles.goalCard}>
      <div className={goalsStyles.goalHeader}>
        <h4 className={goalsStyles.goalTitle}>{goal.name}</h4>
        <span className={goalsStyles.goalType}>{goal.type}</span>
      </div>

      <div className={goalsStyles.goalProgress}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "var(--space-xs)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-secondary)",
            }}
          >
            Progress
          </span>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            {progress !== null ? `${Math.round(progress)}%` : "N/A"}
          </span>
        </div>
        <div className={goalsStyles.progressBar}>
          <div
            className={goalsStyles.progressFill}
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "var(--space-xs)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-secondary)",
            }}
          >
            ${currentAmount.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-secondary)",
            }}
          >
            ${goal.targetAmount?.toLocaleString() || "N/A"}
          </span>
        </div>
      </div>

      <div className={goalsStyles.goalStats}>
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Current Total</span>
          <span className={goalsStyles.statValue}>
            ${(goal.currentAmount || 0).toLocaleString()}
          </span>
          {/* FIXED: Show breakdown if there's a linked account */}
          {goal.linkedAccountAmount > 0 && (
            <div
              style={{
                fontSize: "var(--font-size-xxxs)",
                color: "var(--text-secondary)",
                marginTop: "var(--space-xxs)",
              }}
            >
              Linked: ${goal.linkedAccountAmount.toLocaleString()}
              {manualContributions > 0 && (
                <span> • Manual: ${manualContributions.toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Target</span>
          <span className={goalsStyles.statValue}>
            {hasTarget ? `$${goal.targetAmount.toLocaleString()}` : "Not set"}
          </span>
        </div>
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Monthly</span>
          <span className={goalsStyles.statValue}>
            ${(goal.monthlyContribution || 0).toLocaleString()}
          </span>
        </div>
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Time to Goal</span>
          <span className={goalsStyles.statValue}>
            {timeToGoal ||
              (!hasTargetDate
                ? "Set target date"
                : !goal.monthlyContribution
                ? "Set contribution"
                : "N/A")}
          </span>
        </div>
      </div>

      <div
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-secondary)",
          marginTop: "var(--space-xs)",
          padding: "var(--space-xs)",
          background: "var(--surface-dark)",
          borderRadius: "var(--border-radius-sm)",
        }}
      >
        {getFundingTypeLabel()}
      </div>

      <div className={goalsStyles.goalActions}>
        <button
          onClick={() => onEdit(goal)}
          className="btn-secondary-sm"
          title="Edit goal"
        >
          <Edit size={14} />
        </button>

        {canToggleStatus && (
          <button
            onClick={() => onStatusToggle(goal.id)}
            className="btn-secondary-sm"
            title={goal.status === "active" ? "Pause goal" : "Resume goal"}
          >
            {goal.status === "active" ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>
        )}

        <button
          onClick={() => onRemove(goal.id)}
          className="btn-danger-sm"
          title="Remove goal"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default GoalCard;
