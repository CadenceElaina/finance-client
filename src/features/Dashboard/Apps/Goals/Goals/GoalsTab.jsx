// src/features/Dashboard/Apps/Plan/Goals/GoalsTab.jsx
import React, { useState, useMemo } from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import GoalForm from "./GoalForm";
import GoalCard from "./GoalCard";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import Button from "../../../../../components/ui/Button/Button";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import goalsStyles from "../goals.module.css";
import { useToast } from "../../../../../hooks/useToast"; // Add this import

const GoalsTab = ({ smallApp, activeInnerTabId }) => {
  // SAFETY CHECK: Add early return if financial data context is not ready
  const {
    data,
    saveData,
    updateGoal,
    removeGoal,
    resetGoalsToDemo,
    clearGoals,
  } = useFinancialData();
  const { showInfo, showWarning } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const { goals, accounts, budget } = data || {};

  const goalsSummary = useMemo(() => {
    if (!goals) {
      return {
        activeGoals: 0,
        completedGoals: 0,
        totalTargetAmount: 0,
        totalCurrentAmount: 0,
        totalMonthlyContributions: 0,
        overallProgress: 0,
      };
    }
    const activeGoals = goals.filter((g) => g.status === "active").length;
    const completedGoals = goals.filter((g) => g.status === "completed").length;

    const totalTargetAmount = goals.reduce(
      (sum, g) => sum + (parseFloat(g.targetAmount) || 0),
      0
    );
    const totalCurrentAmount = goals.reduce((sum, g) => {
      // Calculate from linked accounts only
      if (g.linkedAccounts && Array.isArray(g.linkedAccounts)) {
        return (
          sum +
          g.linkedAccounts.reduce((accSum, linkedAcc) => {
            return accSum + (parseFloat(linkedAcc.allocatedAmount) || 0);
          }, 0)
        );
      }
      return sum;
    }, 0);

    const totalBudgetAllocations = goals
      .filter((g) => g.linkedToBudget && g.status === "active")
      .reduce((sum, g) => sum + (parseFloat(g.budgetMonthlyAmount) || 0), 0);

    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    return {
      activeGoals,
      completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
      totalMonthlyContributions: totalBudgetAllocations, // Only budget allocations now
      overallProgress,
    };
  }, [goals]);

  // Calculate available discretionary income
  const monthlyDiscretionary = budget?.discretionaryIncome || 0;
  const allocatedToGoals = (goals || [])
    .filter((g) => g.linkedToBudget && g.status === "active")
    .reduce((sum, g) => sum + (parseFloat(g.budgetMonthlyAmount) || 0), 0);
  const availableDiscretionary = monthlyDiscretionary - allocatedToGoals;

  if (!data) {
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

  const handleSaveGoal = (goalData) => {
    console.log("handleSaveGoal called with:", goalData); // Debug log

    if (editingGoal) {
      // FIXED: Track what changed for better notifications
      const oldGoal = editingGoal;
      const linkedToBudgetChanged =
        oldGoal.linkedToBudget !== goalData.linkedToBudget;

      const updatedGoals = goals.map((g) =>
        g.id === editingGoal.id ? { ...goalData } : g
      );

      let updatedData = {
        ...data,
        goals: updatedGoals,
      };

      // If this goal is linked to budget, update budget expenses
      if (goalData.budgetSyncNeeded || linkedToBudgetChanged) {
        updatedData = syncGoalWithBudget(updatedData, goalData);
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
        updatedData = syncGoalWithBudget(updatedData, goalData);
      }

      saveData(updatedData);

      // FIXED: The success/info notifications are now handled in GoalForm.jsx
      // No need to duplicate them here
    }

    setShowAddForm(false);
    setEditingGoal(null);
  };

  // FIXED: Add function to sync goal with budget
  const syncGoalWithBudget = (dataToUpdate, newGoal) => {
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
        cost: parseFloat(newGoal.budgetMonthlyAmount) || 0,
        category: "goal",
        isGoalExpense: true,
        linkedToGoalId: newGoal.id,
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
    const goalToRemove = goals.find((g) => g.id === goalId);

    if (!goalToRemove) return;

    let confirmMessage = `Are you sure you want to remove "${goalToRemove.name}"?`;
    if (goalToRemove.linkedToBudget && goalToRemove.budgetMonthlyAmount > 0) {
      confirmMessage += `\n\nThis will also remove the $${goalToRemove.budgetMonthlyAmount}/month budget allocation.`;
    }

    if (window.confirm(confirmMessage)) {
      removeGoal(goalId);
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

  const handleStatusToggle = (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.status === "completed") return;

    const newStatus = goal.status === "active" ? "paused" : "active";
    if (updateGoal) {
      updateGoal(goalId, {
        status: newStatus,
        lastModified: new Date().toISOString().split("T")[0],
      });
    } else {
      // Fallback
      const updatedGoals = goals.map((g) =>
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
    return goal.status === activeInnerTabId;
  });

  // UPDATED: Goals summary calculations (removed manual contributions)

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
      label: "Budget Allocation",
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
        <div className={sectionStyles.editActions}>
          <Button onClick={resetGoalsToDemo} variant="warning" size="small">
            Reset to Demo
          </Button>
          <Button onClick={clearGoals} variant="danger" size="small">
            Clear All
          </Button>
        </div>
      </Section>
    </div>
  );
};

export default GoalsTab;
