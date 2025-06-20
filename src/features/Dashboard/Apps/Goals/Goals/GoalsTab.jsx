// src/features/Dashboard/Apps/Plan/Goals/GoalsTab.jsx
import React, { useState, useMemo } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import GoalCard from "./GoalCard";
import GoalForm from "./GoalForm";
import {
  calculateProgress,
  calculateTimeToGoal,
} from "../utils/goalCalculations";
import goalsStyles from "../goals.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";

const GoalsTab = ({ smallApp, activeInnerTabId }) => {
  const { data, saveData, updateGoal, addManualGoalContribution } =
    useFinancialData();
  const { goals, accounts, budget } = data;

  // Calculate available discretionary income
  const monthlyDiscretionary = budget.discretionaryIncome || 0;
  const allocatedToGoals = goals
    .filter((g) => g.linkedToBudget && g.status === "active")
    .reduce((sum, g) => sum + (parseFloat(g.monthlyContribution) || 0), 0);
  const availableDiscretionary = monthlyDiscretionary - allocatedToGoals;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const handleSaveGoal = (goalData) => {
    if (editingGoal) {
      // Update existing goal
      updateGoal(editingGoal.id, goalData);
    } else {
      // Add new goal
      const newGoals = [...goals, goalData];
      saveData({ ...data, goals: newGoals });
    }

    setShowAddForm(false);
    setEditingGoal(null);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  const handleRemoveGoal = (goalId) => {
    if (window.confirm("Are you sure you want to remove this goal?")) {
      const updatedGoals = goals.filter((g) => g.id !== goalId);
      saveData({ ...data, goals: updatedGoals });
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingGoal(null);
  };

  const handleManualContribution = (goalId, amount) => {
    addManualGoalContribution(goalId, amount);
  };

  const handleStatusToggle = (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.status === "completed") return;

    const newStatus = goal.status === "active" ? "paused" : "active";
    updateGoal(goalId, {
      status: newStatus,
      lastModified: new Date().toISOString().split("T")[0],
    });
  };

  // Filter goals based on active inner tab
  const filteredGoals = goals.filter((goal) => {
    if (!activeInnerTabId || activeInnerTabId === "showAll") return true;
    if (activeInnerTabId === "active") return goal.status === "active";
    if (activeInnerTabId === "completed") return goal.status === "completed";
    return true;
  });

  // Add goals summary calculations
  const goalsSummary = useMemo(() => {
    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");

    const totalTargetAmount = activeGoals.reduce(
      (sum, g) => sum + (g.targetAmount || 0),
      0
    );
    const totalCurrentAmount = activeGoals.reduce(
      (sum, g) => sum + (g.currentAmount || 0),
      0
    );
    const totalMonthlyContributions = activeGoals.reduce(
      (sum, g) => sum + (parseFloat(g.monthlyContribution) || 0),
      0
    );

    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    return {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      totalMonthlyContributions,
      overallProgress,
    };
  }, [goals]);

  // Goals snapshot items
  const goalsSnapshotItems = [
    {
      label: "Active Goals",
      value: goalsSummary.activeGoals.toString(),
      valueClass: "positive",
    },
    {
      label: "Progress",
      value: `${goalsSummary.overallProgress.toFixed(1)}%`,
      valueClass:
        goalsSummary.overallProgress >= 75
          ? "positive"
          : goalsSummary.overallProgress >= 50
          ? "neutral"
          : "negative",
    },
    {
      label: "Monthly Allocation",
      value: `$${goalsSummary.totalMonthlyContributions.toLocaleString()}`,
      valueClass: "positive",
    },
    {
      label: "Remaining",
      value: `$${(
        goalsSummary.totalTargetAmount - goalsSummary.totalCurrentAmount
      ).toLocaleString()}`,
      valueClass: "neutral",
    },
  ];

  return (
    <div className={goalsStyles.goalsContentWrapper}>
      {/* Move SnapshotRow outside and above the Section */}
      <SnapshotRow items={goalsSnapshotItems} small={smallApp} />

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
          <GoalForm
            goal={editingGoal}
            onSave={handleSaveGoal}
            onCancel={handleCancelEdit}
            availableDiscretionary={availableDiscretionary}
          />
        )}

        <div className={goalsStyles.goalsGrid}>
          {filteredGoals.map((goal) => {
            const fundingAccount = accounts.find(
              (acc) => acc.id === goal.fundingAccountId
            );

            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                fundingAccount={fundingAccount}
                onEdit={handleEditGoal}
                onRemove={handleRemoveGoal}
                onStatusToggle={handleStatusToggle}
                onManualContribution={handleManualContribution}
              />
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
