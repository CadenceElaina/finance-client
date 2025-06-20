// src/features/Dashboard/Apps/Plan/Goals/GoalsTab.jsx
import React, { useState, useEffect } from "react";
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
  linkedAccountAmount: "",
  useEntireAccount: false,
  priority: 1,
  status: "active",
  linkedToBudget: false,
};

const GoalsTab = ({ smallApp, activeInnerTabId }) => {
  const { data, saveData, removeGoal } = useFinancialData();
  const goals = data.goals || [];
  const accounts = data.accounts || [];
  const budget = data.budget || {};

  // Calculate available discretionary income
  const monthlyDiscretionary = budget.discretionaryIncome || 0;
  const allocatedToGoals = goals
    .filter((g) => g.linkedToBudget && g.status === "active")
    .reduce((sum, g) => sum + (parseFloat(g.monthlyContribution) || 0), 0);
  const availableDiscretionary = monthlyDiscretionary - allocatedToGoals;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [newGoal, setNewGoal] = useState({ ...EMPTY_GOAL });

  const handleNewGoalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewGoal((prev) => {
      const updated = {
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? parseFloat(value) || ""
            : value,
      };

      // If funding account changes, reset linked amount settings
      if (name === "fundingAccountId") {
        updated.linkedAccountAmount = "";
        updated.useEntireAccount = false;
        updated.currentAmount = 0;
      }

      // If useEntireAccount is checked, update current amount
      if (name === "useEntireAccount" && checked && updated.fundingAccountId) {
        const account = accounts.find(
          (acc) => acc.id === updated.fundingAccountId
        );
        if (account) {
          updated.currentAmount = account.value || 0;
          updated.linkedAccountAmount = account.value || 0;
        }
      }

      // If linked amount changes, update current amount
      if (
        name === "linkedAccountAmount" &&
        value &&
        !updated.useEntireAccount
      ) {
        updated.currentAmount = parseFloat(value) || 0;
      }

      return updated;
    });
  };

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.targetAmount) {
      const goal = {
        ...newGoal,
        id: editingGoalId || `goal-${Date.now()}`,
        targetAmount: parseFloat(newGoal.targetAmount),
        monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0,
        linkedAccountAmount: newGoal.useEntireAccount
          ? accounts.find((acc) => acc.id === newGoal.fundingAccountId)
              ?.value || 0
          : parseFloat(newGoal.linkedAccountAmount) || 0,
        createdDate: editingGoalId
          ? goals.find((g) => g.id === editingGoalId)?.createdDate ||
            new Date().toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        lastModified: new Date().toISOString().split("T")[0],
      };

      let updatedGoals;
      let updatedBudget = budget;

      if (editingGoalId) {
        // Update existing goal
        updatedGoals = goals.map((g) => (g.id === editingGoalId ? goal : g));

        // Update budget expense if linked
        if (goal.linkedToBudget && goal.monthlyContribution > 0) {
          const expenseId = `savings-${goal.id}`;
          const updatedExpenses = budget.monthlyExpenses.map((exp) =>
            exp.goalId === goal.id
              ? {
                  ...exp,
                  name: `Savings: ${goal.name}`,
                  cost: goal.monthlyContribution,
                }
              : exp
          );

          // Add expense if it doesn't exist
          if (!updatedExpenses.some((exp) => exp.goalId === goal.id)) {
            updatedExpenses.push({
              id: expenseId,
              name: `Savings: ${goal.name}`,
              cost: goal.monthlyContribution,
              category: "required",
              goalId: goal.id,
            });
          }

          updatedBudget = { ...budget, monthlyExpenses: updatedExpenses };
        } else {
          // Remove budget expense if unlinked
          updatedBudget = {
            ...budget,
            monthlyExpenses: budget.monthlyExpenses.filter(
              (exp) => exp.goalId !== goal.id
            ),
          };
        }
      } else {
        // Add new goal
        updatedGoals = [...goals, goal];

        // Add budget expense if linked
        if (goal.linkedToBudget && goal.monthlyContribution > 0) {
          const savingsExpense = {
            id: `savings-${goal.id}`,
            name: `Savings: ${goal.name}`,
            cost: goal.monthlyContribution,
            category: "required",
            goalId: goal.id,
          };

          updatedBudget = {
            ...budget,
            monthlyExpenses: [
              ...(budget.monthlyExpenses || []),
              savingsExpense,
            ],
          };
        }
      }

      const updatedData = {
        ...data,
        goals: updatedGoals,
        budget: updatedBudget,
      };

      saveData(updatedData);
      setNewGoal({ ...EMPTY_GOAL });
      setShowAddForm(false);
      setEditingGoalId(null);
    }
  };

  const handleEditGoal = (goal) => {
    setNewGoal({ ...goal });
    setEditingGoalId(goal.id);
    setShowAddForm(true);
  };

  const handleRemoveGoal = (goalId) => {
    if (window.confirm("Are you sure you want to remove this goal?")) {
      removeGoal(goalId);
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingGoalId(null);
    setNewGoal({ ...EMPTY_GOAL });
  };

  const calculateProgress = (goal) => {
    const progress =
      goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;
    return Math.min(progress, 100); // Cap at 100%
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
              onCancelEdit={handleCancelEdit}
              editable={true}
            />
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-secondary)",
              }}
            >
              Available Budget: ${availableDiscretionary.toLocaleString()}
            </div>
          </div>
        }
      >
        {showAddForm && (
          <div className={planStyles.addGoalForm}>
            <h4
              style={{
                margin: "0 0 var(--space-sm) 0",
                color: "var(--text-primary)",
              }}
            >
              {editingGoalId ? "Edit Goal" : "Add New Goal"}
            </h4>

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
                  max={
                    newGoal.linkedToBudget ? availableDiscretionary : undefined
                  }
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
                  <option value="">No account linked</option>
                  {fundingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ${account.value?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {newGoal.fundingAccountId && (
              <div className={planStyles.formRow}>
                <div className={planStyles.formGroup}>
                  <label className={planStyles.formLabel}>
                    <input
                      type="checkbox"
                      name="useEntireAccount"
                      checked={newGoal.useEntireAccount}
                      onChange={handleNewGoalChange}
                      style={{ marginRight: "var(--space-xs)" }}
                    />
                    Use entire account balance
                  </label>
                </div>
                {!newGoal.useEntireAccount && (
                  <div className={planStyles.formGroup}>
                    <label className={planStyles.formLabel}>
                      Linked Amount
                    </label>
                    <input
                      type="number"
                      name="linkedAccountAmount"
                      value={newGoal.linkedAccountAmount}
                      onChange={handleNewGoalChange}
                      placeholder="5000"
                      min="0"
                      max={
                        accounts.find(
                          (acc) => acc.id === newGoal.fundingAccountId
                        )?.value || undefined
                      }
                      className={planStyles.formInput}
                    />
                  </div>
                )}
              </div>
            )}

            <div className={planStyles.formRow}>
              <div className={planStyles.formGroup}>
                <label className={planStyles.formLabel}>
                  <input
                    type="checkbox"
                    name="linkedToBudget"
                    checked={newGoal.linkedToBudget}
                    onChange={handleNewGoalChange}
                    style={{ marginRight: "var(--space-xs)" }}
                  />
                  Link to Budget (adds expense automatically)
                </label>
              </div>
            </div>

            <div className={planStyles.formActions}>
              <Button onClick={handleCancelEdit} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleAddGoal} variant="primary">
                {editingGoalId ? "Update Goal" : "Add Goal"}
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
                      {goal.linkedToBudget && (
                        <span
                          style={{
                            color: "var(--color-primary)",
                            fontSize: "0.8em",
                          }}
                        >
                          {" "}
                          📊
                        </span>
                      )}
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
                      {fundingAccount ? (
                        <span>
                          {fundingAccount.name}
                          {goal.fundingAccountId && (
                            <span
                              style={{
                                fontSize: "0.9em",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <br />
                              {goal.useEntireAccount
                                ? "🔗 Full balance"
                                : `🔗 $${(
                                    goal.linkedAccountAmount || 0
                                  ).toLocaleString()} / $${
                                    fundingAccount.value?.toLocaleString() || 0
                                  }`}
                            </span>
                          )}
                        </span>
                      ) : (
                        "Not linked"
                      )}
                    </span>
                  </div>
                </div>

                {/* Goal Actions */}
                <div className={planStyles.goalActions}>
                  <Button
                    onClick={() => handleEditGoal(goal)}
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
                    onClick={() => handleRemoveGoal(goal.id)}
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

                {goal.status === "completed" && (
                  <div
                    style={{
                      position: "absolute",
                      top: "var(--space-xs)",
                      right: "var(--space-xs)",
                      background: "var(--status-success)",
                      color: "white",
                      padding: "var(--space-xxs) var(--space-xs)",
                      borderRadius: "var(--border-radius-sm)",
                      fontSize: "var(--font-size-xxs)",
                      fontWeight: "600",
                    }}
                  >
                    ✓ COMPLETED
                  </div>
                )}
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
