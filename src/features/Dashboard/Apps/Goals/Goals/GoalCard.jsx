// src/features/Dashboard/Apps/Plan/Goals/GoalCard.jsx
import React, { useMemo } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext"; // FIXED: Add missing import
import { Edit, Trash2, Play, Pause } from "lucide-react";
import { calculateProgress, calculateTimeToGoal } from "../../Plan/utils/calculationUtils";
import goalsStyles from "../goals.module.css";

const GoalCard = ({
  goal,
  onEdit,
  onRemove,
  onStatusToggle,
}) => {
  const { data } = useFinancialData();
  const accounts = data.accounts || [];
  
  const hasTarget = goal.targetAmount && goal.targetAmount > 0;
  const hasTargetDate = !!goal.targetDate;

  // Calculate current amount from linked accounts only
  const currentAmount = useMemo(() => {
    let amount = 0;
    
    // Add from linked accounts
    if (goal.linkedAccounts && Array.isArray(goal.linkedAccounts)) {
      goal.linkedAccounts.forEach(linkedAcc => {
        amount += parseFloat(linkedAcc.allocatedAmount) || 0;
      });
    }
    
    return amount;
  }, [goal, accounts]);

  const progress = hasTarget
    ? Math.min((currentAmount / goal.targetAmount) * 100, 100)
    : null;

  const isCompleted =
    goal.status === "completed" || (progress !== null && progress >= 100);
  const canToggleStatus = !isCompleted;

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "var(--status-success)";
      case "paused":
        return "var(--status-warning)";
      case "active":
      default:
        return "var(--color-primary)";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "paused":
        return "Paused";
      case "active":
      default:
        return "Active";
    }
  };

  // Show linked accounts information
  const getLinkedAccountsInfo = () => {
    if (!goal.linkedAccounts || goal.linkedAccounts.length === 0) {
      return "No accounts linked";
    }
    
    if (goal.linkedAccounts.length === 1) {
      const linkedAcc = goal.linkedAccounts[0];
      const account = accounts.find(acc => acc.id === linkedAcc.accountId);
      if (account) {
        return `${account.name}: $${(parseFloat(linkedAcc.allocatedAmount) || 0).toLocaleString()}`;
      }
    }
    
    return `${goal.linkedAccounts.length} accounts linked`;
  };

  const linkedAccountsInfo = getLinkedAccountsInfo();

  return (
    <div className={goalsStyles.goalCard}>
      <div className={goalsStyles.goalHeader}>
        <h4 className={goalsStyles.goalTitle}>{goal.name}</h4>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <span className={goalsStyles.goalType}>{goal.type}</span>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: getStatusColor(goal.status),
              title: getStatusLabel(goal.status),
            }}
          />
        </div>
      </div>

      <div className={goalsStyles.goalProgress}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
            Progress
          </span>
          <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)" }}>
            {progress !== null ? `${Math.round(progress)}%` : "N/A"}
          </span>
        </div>
        <div className={goalsStyles.progressBar}>
          <div 
            className={goalsStyles.progressFill} 
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-xs)" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
            ${currentAmount.toLocaleString()}
          </span>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
            ${goal.targetAmount?.toLocaleString() || "N/A"}
          </span>
        </div>
      </div>

      <div className={goalsStyles.goalStats}>
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Funding</span>
          <span className={goalsStyles.statValue}>{linkedAccountsInfo}</span>
        </div>
        
        <div className={goalsStyles.goalStat}>
          <span className={goalsStyles.statLabel}>Type</span>
          <span className={goalsStyles.statValue}>
            {goal.type?.charAt(0).toUpperCase() + goal.type?.slice(1) || "Savings"}
          </span>
        </div>
        
        {hasTargetDate && (
          <div className={goalsStyles.goalStat}>
            <span className={goalsStyles.statLabel}>Target Date</span>
            <span className={goalsStyles.statValue}>
              {new Date(goal.targetDate).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {goal.linkedToBudget && (
          <div className={goalsStyles.goalStat}>
            <span className={goalsStyles.statLabel}>Budget</span>
            <span className={goalsStyles.statValue}>
              ${goal.budgetMonthlyAmount?.toLocaleString() || "0"}/mo
            </span>
          </div>
        )}
      </div>

      <div className={goalsStyles.goalActions}>
        <button onClick={() => onEdit(goal)} className="btn-secondary">
          Edit
        </button>
        <button onClick={() => onRemove(goal.id)} className="btn-danger">
          Remove
        </button>
        {canToggleStatus && (
          <button
            onClick={() => onStatusToggle(goal.id)}
            className="btn-primary"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
