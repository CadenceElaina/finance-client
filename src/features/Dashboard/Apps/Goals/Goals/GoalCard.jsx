// src/features/Dashboard/Apps/Plan/Goals/GoalCard.jsx
import React from "react";
import Button from "../../../../../components/ui/Button/Button";

import goalsStyles from "../goals.module.css";

const GoalCard = ({
  goal,
  fundingAccount,
  onEdit,
  onRemove,
  onStatusToggle,
  onManualContribution,
}) => {
  const progress = calculateProgress(goal);
  const timeToGoal = calculateTimeToGoal(goal);
  const isCompleted = goal.status === "completed" || progress >= 100;
  const canToggleStatus = !isCompleted;

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "var(--status-success)";
      case "paused":
        return "var(--status-warning)";
      case "active":
        return "var(--color-primary)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "✓ Complete";
      case "paused":
        return "⏸ Paused";
      case "active":
        return "▶ Active";
      default:
        return status;
    }
  };

  const getFundingTypeLabel = () => {
    const fundingSources = [];

    if (goal.fundingAccountId && fundingAccount) {
      if (goal.useEntireAccount) {
        fundingSources.push("🔗 Full account balance");
      } else {
        fundingSources.push(
          `🔗 Account (${goal.linkedAccountAmount?.toLocaleString() || 0})`
        );
      }
    }

    if (goal.linkedToBudget && goal.budgetMonthlyAmount > 0) {
      fundingSources.push(
        `📊 Budget ($${goal.budgetMonthlyAmount.toLocaleString()}/month)`
      );
    }

    if (fundingSources.length === 0) {
      return "✋ Manual tracking only";
    }

    return fundingSources.join(" + ");
  };

  const handleManualAdd = () => {
    const amount = prompt("Enter amount to add to this goal:");
    if (amount && !isNaN(parseFloat(amount))) {
      onManualContribution(goal.id, parseFloat(amount));
    }
  };

  return (
    <div className={goalsStyles.goalCard}>
      <div className={goalsStyles.goalHeader}>
        <h4 className={goalsStyles.goalTitle}>{goal.name}</h4>
        <span className={goalsStyles.goalType}>{goal.type}</span>
      </div>

      {/* Progress Section */}
      <div className={goalsStyles.goalProgress}>
        <div className={goalsStyles.progressBar}>
          <div
            className={goalsStyles.progressFill}
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: isCompleted
                ? "var(--status-success)"
                : goal.status === "paused"
                ? "var(--status-warning)"
                : "var(--gradient-primary)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "var(--font-size-xs)",
            color: "var(--text-secondary)",
            marginTop: "var(--space-xxs)",
          }}
        >
          <span>${goal.currentAmount.toLocaleString()}</span>
          <span>{progress.toFixed(1)}%</span>
          <span>${goal.targetAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Goal Stats Grid */}
      <div className={goalsStyles.goalStats}>
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Monthly</span>
          <span className={goalsStyles.statValue}>
            {goal.linkedToBudget && goal.budgetMonthlyAmount > 0 ? (
              <span>
                ${(goal.budgetMonthlyAmount || 0).toLocaleString()}
                <span
                  style={{
                    fontSize: "0.8em",
                    color: "var(--text-secondary)",
                    marginLeft: "var(--space-xxs)",
                  }}
                >
                  {" "}
                  /budget
                </span>
              </span>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>
                No monthly budget
              </span>
            )}
          </span>
        </div>

        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Time to Goal</span>
          <span className={goalsStyles.statValue}>{timeToGoal}</span>
        </div>

        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Target Date</span>
          <span className={goalsStyles.statValue}>
            {goal.targetDate
              ? new Date(goal.targetDate).toLocaleDateString()
              : "Not set"}
          </span>
        </div>

        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Status</span>
          <span className={goalsStyles.statValue}>
            {canToggleStatus ? (
              <button
                onClick={() => onStatusToggle(goal.id)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "var(--space-xxs) var(--space-xs)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-xxs)",
                  color: getStatusColor(goal.status),
                  borderColor: getStatusColor(goal.status),
                }}
              >
                {getStatusLabel(goal.status)}
              </button>
            ) : (
              <span
                style={{
                  color: getStatusColor(goal.status),
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "600",
                }}
              >
                {getStatusLabel(goal.status)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Funding Information */}
      <div className={goalsStyles.goalStats}>
        <div className={goalsStyles.goalStat} style={{ gridColumn: "1 / -1" }}>
          <span className={goalsStyles.statLabel}>Funding Source</span>
          <span
            className={goalsStyles.statValue}
            style={{ fontSize: "var(--font-size-xs)" }}
          >
            {getFundingTypeLabel()}
            {goal.fundingAccountId && fundingAccount && (
              <div
                style={{
                  color: "var(--text-secondary)",
                  marginTop: "var(--space-xxs)",
                }}
              >
                {fundingAccount.name}: $
                {fundingAccount.value?.toLocaleString() || 0}
              </div>
            )}
          </span>
        </div>
      </div>

      {/* Goal Actions */}
      <div className={goalsStyles.goalActions}>
        {!goal.fundingAccountId && !goal.linkedToBudget && (
          <Button
            onClick={handleManualAdd}
            variant="secondary"
            style={{
              fontSize: "var(--font-size-xs)",
              padding: "var(--space-xxs) var(--space-xs)",
              minWidth: "60px",
            }}
          >
            Add $
          </Button>
        )}

        <Button
          onClick={() => onEdit(goal)}
          variant="secondary"
          style={{
            fontSize: "var(--font-size-xs)",
            padding: "var(--space-xxs) var(--space-xs)",
            minWidth: "60px",
          }}
        >
          Edit
        </Button>

        <Button
          onClick={() => onRemove(goal.id)}
          variant="danger"
          style={{
            fontSize: "var(--font-size-xs)",
            padding: "var(--space-xxs) var(--space-xs)",
            minWidth: "70px",
          }}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

export default GoalCard;
