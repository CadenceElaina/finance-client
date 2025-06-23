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
import { useToast } from "../../../../../hooks/useToast"; // Add this import

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
  const { showSuccess, showInfo, showWarning } = useToast(); // Add useToast hook

  const handleSaveGoal = (goalData) => {
    console.log("handleSaveGoal called with:", goalData); // Debug log

    if (editingGoal) {
      // FIXED: Track what changed for better notifications
      const oldGoal = editingGoal;
      const budgetChanged =
        oldGoal.budgetMonthlyAmount !== goalData.budgetMonthlyAmount;
      const linkedToBudgetChanged =
        oldGoal.linkedToBudget !== goalData.linkedToBudget;

      const updatedGoals = (goals || []).map((g) =>
        g.id === editingGoal.id ? { ...goalData } : g
      );

      let updatedData = {
        ...data,
        goals: updatedGoals,
      };

      // If this goal is linked to budget, update budget expenses
      if (goalData.budgetSyncNeeded || linkedToBudgetChanged) {
        updatedData = syncGoalWithBudget(updatedData, goalData, editingGoal);
      }

      console.log(
        "Updated goals:",
        updatedGoals.find((g) => g.id === editingGoal.id)
      ); // Debug log
      saveData(updatedData);

      // FIXED: The success/info notifications are now handled in GoalForm.jsx
      // No need to duplicate them here
    } else {
      // New goal
      const newGoals = [...(goals || []), goalData];
      let updatedData = {
        ...data,
        goals: newGoals,
      };

      // If this goal is linked to budget, update budget expenses
      if (goalData.budgetSyncNeeded) {
        updatedData = syncGoalWithBudget(updatedData, goalData, null);
      }

      saveData(updatedData);

      // FIXED: The success/info notifications are now handled in GoalForm.jsx
      // No need to duplicate them here
    }

    setShowAddForm(false);
    setEditingGoal(null);
  };

  // FIXED: Add function to sync goal with budget
  const syncGoalWithBudget = (dataToUpdate, newGoal, oldGoal) => {
    const currentExpenses = dataToUpdate.budget?.monthlyExpenses || [];
    const goalExpenseId = `exp-goal-${newGoal.id}`;

    // Remove existing goal expense if it exists
    let updatedExpenses = currentExpenses.filter(
      (exp) => exp.id !== goalExpenseId
    );

    // Add new goal expense if goal is linked to budget
    if (newGoal.linkedToBudget && newGoal.budgetMonthlyAmount > 0) {
      const goalExpense = {
        id: goalExpenseId,
        name: `${newGoal.name} (Goal)`,
        cost: newGoal.budgetMonthlyAmount,
        category: "required",
        linkedToGoalId: newGoal.id,
        isGoalPayment: true,
      };

      updatedExpenses.push(goalExpense);
    }

    return {
      ...dataToUpdate,
      budget: {
        ...dataToUpdate.budget,
        monthlyExpenses: updatedExpenses,
      },
    };
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  // FIXED: Enhanced goal removal with notifications
  const handleRemoveGoal = (goalId) => {
    const goalToRemove = (goals || []).find((g) => g.id === goalId);

    if (!goalToRemove) return;

    let confirmMessage = `Are you sure you want to remove "${goalToRemove.name}"?`;
    if (goalToRemove.linkedToBudget && goalToRemove.budgetMonthlyAmount > 0) {
      confirmMessage += `\n\nThis will also remove the $${goalToRemove.budgetMonthlyAmount}/month budget allocation.`;
    }

    if (window.confirm(confirmMessage)) {
      const updatedGoals = (goals || []).filter((g) => g.id !== goalId);

      let updatedData = {
        ...data,
        goals: updatedGoals,
      };

      // Remove associated budget expense if it exists
      if (goalToRemove?.linkedToBudget) {
        const goalExpenseId = `exp-goal-${goalId}`;
        const updatedExpenses = (data.budget?.monthlyExpenses || []).filter(
          (exp) => exp.id !== goalExpenseId
        );

        updatedData = {
          ...updatedData,
          budget: {
            ...data.budget,
            monthlyExpenses: updatedExpenses,
          },
        };
      }

      saveData(updatedData);

      // FIXED: Show removal notification
      showWarning(`🗑️ Goal "${goalToRemove.name}" has been removed.`);

      if (goalToRemove.linkedToBudget && goalToRemove.budgetMonthlyAmount > 0) {
        showInfo(
          `💰 Budget Update:\nThe $${goalToRemove.budgetMonthlyAmount}/month allocation has been removed from your budget.`
        );
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
