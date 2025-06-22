// src/features/Dashboard/Apps/Plan/Goals/GoalsTab.jsx
import React, { useState, useMemo, useEffect } from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import GoalForm from "./GoalForm";
import GoalCard from "./GoalCard";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import {
  calculateProgress,
  calculateTimeToGoal,
} from "../../Plan/utils/calculationUtils";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import goalsStyles from "../goals.module.css";

const GoalsTab = ({ smallApp, activeInnerTabId }) => {
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
        Loading goals data...
      </div>
    );
  }

  const { data, saveData, updateGoal, addManualGoalContribution, removeGoal } =
    financialDataResult;

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
        Initializing goals...
      </div>
    );
  }

  const { goals, accounts, budget } = data;

  // Calculate available discretionary income
  const monthlyDiscretionary = budget?.discretionaryIncome || 0;
  const allocatedToGoals = (goals || [])
    .filter((g) => g.linkedToBudget && g.status === "active")
    .reduce((sum, g) => sum + (parseFloat(g.monthlyContribution) || 0), 0);
  const availableDiscretionary = monthlyDiscretionary - allocatedToGoals;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const handleSaveGoal = (goalData) => {
    if (editingGoal) {
      // Update existing goal
      updateGoal(editingGoal.id, {
        ...goalData,
        lastModified: new Date().toISOString().split("T")[0],
      });
    } else {
      // Add new goal
      const newGoal = {
        ...goalData,
        id: `goal-${Date.now()}`,
        status: "active",
        currentAmount: parseFloat(goalData.currentAmount) || 0,
        targetAmount: parseFloat(goalData.targetAmount) || 0,
        monthlyContribution: parseFloat(goalData.monthlyContribution) || 0,
        dateCreated: new Date().toISOString().split("T")[0],
        lastModified: new Date().toISOString().split("T")[0],
      };

      const updatedGoals = [...(goals || []), newGoal];
      saveData({ ...data, goals: updatedGoals });
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
      if (removeGoal) {
        removeGoal(goalId);
      } else {
        // Fallback if removeGoal is not available
        const updatedGoals = (goals || []).filter((g) => g.id !== goalId);
        saveData({ ...data, goals: updatedGoals });
      }
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingGoal(null);
  };

  const handleManualContribution = (goalId, amount) => {
    if (addManualGoalContribution) {
      addManualGoalContribution(goalId, amount);
    } else {
      // Fallback if addManualGoalContribution is not available
      const updatedGoals = (goals || []).map((goal) => {
        if (goal.id === goalId) {
          const newAmount = (goal.currentAmount || 0) + amount;
          return {
            ...goal,
            currentAmount: Math.min(goal.targetAmount, newAmount),
            lastModified: new Date().toISOString().split("T")[0],
          };
        }
        return goal;
      });
      saveData({ ...data, goals: updatedGoals });
    }
  };

  const handleStatusToggle = (goalId) => {
    const goal = (goals || []).find((g) => g.id === goalId);
    if (!goal || goal.status === "completed") return;

    const newStatus = goal.status === "active" ? "paused" : "active";
    if (updateGoal) {
      updateGoal(goalId, {
        status: newStatus,
        lastModified: new Date().toISOString().split("T")[0],
      });
    } else {
      // Fallback
      const updatedGoals = (goals || []).map((g) =>
        g.id === goalId
          ? {
              ...g,
              status: newStatus,
              lastModified: new Date().toISOString().split("T")[0],
            }
          : g
      );
      saveData({ ...data, goals: updatedGoals });
    }
  };

  // Filter goals based on active inner tab
  const filteredGoals = (goals || []).filter((goal) => {
    if (!activeInnerTabId || activeInnerTabId === "showAll") return true;
    if (activeInnerTabId === "active") return goal.status === "active";
    if (activeInnerTabId === "completed") return goal.status === "completed";
    return true;
  });

  // Add goals summary calculations
  const goalsSummary = useMemo(() => {
    const safeGoals = goals || [];
    const activeGoals = safeGoals.filter((g) => g.status === "active");
    const completedGoals = safeGoals.filter((g) => g.status === "completed");

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
            const fundingAccount = (accounts || []).find(
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
