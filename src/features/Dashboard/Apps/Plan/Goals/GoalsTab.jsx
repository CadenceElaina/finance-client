// src/features/Dashboard/Apps/Plan/Goals/GoalsTab.jsx
import React, { useState } from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import Button from "../../../../../components/ui/Button/Button";
import planStyles from "../plan.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const GOAL_TYPES = [
  "Emergency Fund",
  "Debt Payoff",
  "Down Payment (House)",
  "Down Payment (Car)",
  "Large Purchase",
  "Investment",
  "Retirement",
  "Other",
];

const EMPTY_GOAL = {
  name: "",
  targetAmount: "",
  targetDate: "",
  type: "Emergency Fund",
  currentAmount: 0,
  monthlyContribution: "",
  fundingAccountId: "",
  priority: 1,
  status: "active",
};

const GoalsTab = ({ smallApp, activeInnerTabId }) => {
  const { data, saveData } = useFinancialData();
  const goals = data.goals || [];
  const accounts = data.accounts || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ ...EMPTY_GOAL });

  const handleNewGoalChange = (e) => {
    const { name, value, type } = e.target;
    setNewGoal((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || "" : value,
    }));
  };

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.targetAmount) {
      const goal = {
        ...newGoal,
        id: `goal-${Date.now()}`,
        targetAmount: parseFloat(newGoal.targetAmount),
        monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0,
        createdDate: new Date().toISOString().split("T")[0],
      };

      const updatedData = {
        ...data,
        goals: [...goals, goal],
      };
      saveData(updatedData);
      setNewGoal({ ...EMPTY_GOAL });
      setShowAddForm(false);
    }
  };

  const calculateProgress = (goal) => {
    return goal.targetAmount > 0
      ? (goal.currentAmount / goal.targetAmount) * 100
      : 0;
  };

  const calculateTimeToGoal = (goal) => {
    if (goal.monthlyContribution <= 0) return "N/A";
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return "Goal Reached!";
    const months = Math.ceil(remaining / goal.monthlyContribution);
    if (months <= 12) return `${months} month${months !== 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}y ${remainingMonths}m`;
  };

  // Filter goals based on active inner tab
  const filteredGoals = goals.filter((goal) => {
    if (!activeInnerTabId || activeInnerTabId === "showAll") return true;
    if (activeInnerTabId === "active") return goal.status === "active";
    if (activeInnerTabId === "completed") return goal.status === "completed";
    return true;
  });

  const fundingAccounts = accounts.filter(
    (acc) => acc.category === "Cash" || acc.category === "Investments"
  );

  return (
    <div className={planStyles.planContentWrapper}>
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Financial Goals"
              editMode={showAddForm}
              onEnterEdit={() => setShowAddForm(true)}
              onCancelEdit={() => {
                setShowAddForm(false);
                setNewGoal({ ...EMPTY_GOAL });
              }}
              editable={true}
            />
          </div>
        }
      >
        {showAddForm && (
          <div className={planStyles.addGoalForm}>
            <div className={planStyles.formRow}>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={newGoal.name}
                  onChange={handleNewGoalChange}
                  placeholder="e.g., Emergency Fund"
                  className={planStyles.formInput}
                />
              </div>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>Goal Type</label>
                <select
                  name="type"
                  value={newGoal.type}
                  onChange={handleNewGoalChange}
                  className={planStyles.formInput}
                >
                  {GOAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={planStyles.formRow}>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>Target Amount</label>
                <input
                  type="number"
                  name="targetAmount"
                  value={newGoal.targetAmount}
                  onChange={handleNewGoalChange}
                  placeholder="10000"
                  min="0"
                  className={planStyles.formInput}
                />
              </div>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  value={newGoal.targetDate}
                  onChange={handleNewGoalChange}
                  className={planStyles.formInput}
                />
              </div>
            </div>

            <div className={planStyles.formRow}>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>
                  Monthly Contribution
                </label>
                <input
                  type="number"
                  name="monthlyContribution"
                  value={newGoal.monthlyContribution}
                  onChange={handleNewGoalChange}
                  placeholder="500"
                  min="0"
                  className={planStyles.formInput}
                />
              </div>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>Funding Account</label>
                <select
                  name="fundingAccountId"
                  value={newGoal.fundingAccountId}
                  onChange={handleNewGoalChange}
                  className={planStyles.formInput}
                >
                  <option value="">Select Account</option>
                  {fundingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ${account.value?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={planStyles.formActions}>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewGoal({ ...EMPTY_GOAL });
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleAddGoal} variant="primary">
                Add Goal
              </Button>
            </div>
          </div>
        )}

        <div className={planStyles.goalsGrid}>
          {filteredGoals.map((goal) => {
            const progress = calculateProgress(goal);
            const timeToGoal = calculateTimeToGoal(goal);
            const fundingAccount = accounts.find(
              (acc) => acc.id === goal.fundingAccountId
            );

            return (
              <div key={goal.id} className={planStyles.goalCard}>
                <div className={planStyles.goalHeader}>
                  <h4 className={planStyles.goalTitle}>{goal.name}</h4>
                  <span className={planStyles.goalType}>{goal.type}</span>
                </div>

                <div className={planStyles.goalProgress}>
                  <div className={planStyles.progressBar}>
                    <div
                      className={planStyles.progressFill}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>${goal.currentAmount.toLocaleString()}</span>
                    <span>{progress.toFixed(1)}%</span>
                    <span>${goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className={planStyles.goalStats}>
                  <div className={planStyles.goalStat}>
                    <span className={planStyles.statLabel}>Monthly</span>
                    <span className={planStyles.statValue}>
                      ${goal.monthlyContribution.toLocaleString()}
                    </span>
                  </div>
                  <div className={planStyles.goalStat}>
                    <span className={planStyles.statLabel}>Time to Goal</span>
                    <span className={planStyles.statValue}>{timeToGoal}</span>
                  </div>
                  <div className={planStyles.goalStat}>
                    <span className={planStyles.statLabel}>Target Date</span>
                    <span className={planStyles.statValue}>
                      {goal.targetDate
                        ? new Date(goal.targetDate).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  <div className={planStyles.goalStat}>
                    <span className={planStyles.statLabel}>
                      Funding Account
                    </span>
                    <span className={planStyles.statValue}>
                      {fundingAccount?.name || "Not selected"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGoals.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-xl)",
              color: "var(--text-secondary)",
            }}
          >
            No goals found. Click the pencil icon to add your first financial
            goal!
          </div>
        )}
      </Section>
    </div>
  );
};

export default GoalsTab;
