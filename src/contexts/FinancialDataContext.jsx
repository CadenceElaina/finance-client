import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "../hooks/useToast";
import {
  loadFinancialData,
  saveFinancialDataUtil,
} from "../utils/dataPersistence";
import {
  DEMO_ACCOUNTS,
  DEFAULT_DEMO_BUDGET,
  DEMO_PORTFOLIOS,
} from "../utils/constants";
import { DebtSyncService } from "../services/debtSyncService";
import { enrichBudgetWithCalculations } from "../utils/calculations/budgetCalculations";

const FinancialDataContext = createContext();

export const FinancialDataProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { showNotification } = useToast();
  const [persistence, setPersistence] = useState(
    () =>
      localStorage.getItem("financialDataPersistence") ||
      (user ? "server" : "local")
  );
  const [data, setData] = useState({
    accounts: DEMO_ACCOUNTS,
    budget: DEFAULT_DEMO_BUDGET,
    portfolios: DEMO_PORTFOLIOS,
    goals: [],
  });

  // Track previous account values for goal linking
  const [previousAccountValues, setPreviousAccountValues] = useState({});
  const [accountChangeNotifications, setAccountChangeNotifications] = useState(
    []
  );

  // Load dismissed notification IDs from localStorage on mount
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(
    () => {
      try {
        const stored = localStorage.getItem("dismissedGoalNotifications");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error loading dismissed notifications:", error);
        return [];
      }
    }
  );

  // Add a flag to track if we've initialized properly
  const [isInitialized, setIsInitialized] = useState(false);

  // Persist dismissed notification IDs to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "dismissedGoalNotifications",
        JSON.stringify(dismissedNotificationIds)
      );
    } catch (error) {
      console.error("Error saving dismissed notifications:", error);
    }
  }, [dismissedNotificationIds]);

  // Load data on mount or when user/persistence changes
  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadFinancialData({ user, token, persistence });

        // Enrich budget with calculations on load
        const enrichedData = {
          ...loaded,
          budget: enrichBudgetWithCalculations(loaded.budget),
        };

        setData(enrichedData);
        updatePreviousAccountValues(enrichedData.accounts);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load financial data:", error);
        showNotification({
          type: "error",
          title: "Load Error",
          message:
            "Failed to load your financial data. Using demo data instead.",
        });
      }
    }
    load();
  }, [user, token, persistence]);

  // Helper function to update previous account values
  const updatePreviousAccountValues = (accounts) => {
    const accountMap = {};
    accounts.forEach((acc) => {
      accountMap[acc.id] = acc.value || 0;
    });
    setPreviousAccountValues(accountMap);
  };

  // Helper function to check for account changes that should trigger goal notifications
  const checkAccountChangesForGoals = (accounts, goals, previousValues) => {
    if (!isInitialized || goals.length === 0) return [];

    const notifications = [];
    const now = new Date().toISOString().split("T")[0];

    accounts.forEach((account) => {
      const oldValue = previousValues[account.id] || 0;
      const newValue = account.value || 0;
      const valueChange = newValue - oldValue;

      if (Math.abs(valueChange) < 0.01) return;

      const linkedGoals = goals.filter(
        (goal) =>
          goal.fundingAccountId === account.id &&
          goal.status === "active" &&
          goal.fundingType === "account"
      );

      linkedGoals.forEach((goal) => {
        const notificationId = createNotificationId(
          goal.id,
          account.id,
          oldValue,
          newValue
        );

        if (!dismissedNotificationIds.includes(notificationId)) {
          notifications.push({
            id: notificationId,
            goalId: goal.id,
            goal,
            accountId: account.id,
            accountName: account.name,
            oldValue,
            newValue,
            valueChange,
            dateCreated: now,
          });
        }
      });
    });

    return notifications;
  };

  // Helper function to detect debt payment changes
  const detectDebtPaymentChanges = (originalExpenses, syncedExpenses) => {
    return DebtSyncService.detectDebtPaymentChanges(
      originalExpenses,
      syncedExpenses
    );
  };

  // Enhanced save data function with debt sync service
  // Update the saveData function to ensure budget is always enriched
  const saveData = async (newData) => {
    try {
      // Store previous account values for goal linking
      const previousAccountValues = {};
      data.accounts.forEach((acc) => {
        previousAccountValues[acc.id] = acc.value;
      });

      // FIXED: Ensure we have a complete data object
      const finalData = {
        accounts: data.accounts || [],
        budget: data.budget || {},
        portfolios: data.portfolios || [],
        goals: data.goals || [],
        ...newData, // Override with new data
      };

      // FIXED: Ensure budget is enriched before saving and updating state
      if (finalData.budget) {
        finalData.budget = enrichBudgetWithCalculations(finalData.budget);
      }

      // Check for account changes that might affect goals
      const accountNotifications = checkAccountChangesForGoals(
        finalData.accounts,
        finalData.goals,
        previousAccountValues
      );

      // Detect debt payment changes
      const debtChanges = finalData.budget?.monthlyExpenses
        ? detectDebtPaymentChanges(
            data.budget?.monthlyExpenses || [],
            finalData.budget.monthlyExpenses
          )
        : [];

      // Apply debt payment changes to accounts if any
      if (debtChanges.length > 0) {
        finalData.accounts = DebtSyncService.applyChangesToAccounts(
          finalData.accounts,
          debtChanges
        );
      }

      // Re-enrich budget after any changes
      finalData.budget = enrichBudgetWithCalculations(finalData.budget);

      // Save to persistence layer
      await saveFinancialDataUtil({
        user,
        token,
        persistence,
        data: finalData,
      });

      // Update state
      setData(finalData);
      updatePreviousAccountValues(finalData.accounts);

      // Process goal-related notifications if they exist
      if (accountNotifications.length > 0) {
        setAccountChangeNotifications((prev) => {
          const newNotifications = accountNotifications.filter(
            (newNotif) =>
              !dismissedNotificationIds.includes(newNotif.id) &&
              !prev.some((existingNotif) => existingNotif.id === newNotif.id)
          );
          return [...prev, ...newNotifications];
        });
      }

      // Show debt sync notifications if any changes
      if (debtChanges.length > 0) {
        showDebtSyncNotification(debtChanges);
      }
    } catch (error) {
      console.error("Failed to save data:", error);
      showNotification({
        type: "error",
        title: "Save Error",
        message: "Failed to save your data. Please try again.",
      });
    }
  };

  // Helper function to show debt sync notification using toast
  const showDebtSyncNotification = (changes) => {
    const changesSummary = changes
      .map(
        (change) =>
          `${change.accountName}: $${change.oldAmount} → $${change.newAmount}`
      )
      .join("\n");

    showNotification({
      type: "warning",
      title: "Debt Payments Synchronized",
      message: `Budget expenses updated to match account payments:\n${changesSummary}`,
    });
  };

  // Update the createNotificationId function to include account values
  const createNotificationId = (goalId, accountId, oldValue, newValue) => {
    return `${goalId}-${accountId}-${oldValue.toFixed(2)}-${newValue.toFixed(
      2
    )}`;
  };

  // Apply goal update from account change notification - FIXED VERSION
  const applyGoalUpdateFromNotification = (notificationId, amountToAdd) => {
    const notification = accountChangeNotifications.find(
      (n) => n.id === notificationId
    );
    if (!notification) return;

    const { goal } = notification;

    const updatedGoals = data.goals.map((g) => {
      if (g.id === goal.id) {
        const newCurrentAmount = Math.max(0, g.currentAmount + amountToAdd);

        // Check if goal is now complete
        const isComplete = newCurrentAmount >= g.targetAmount;

        return {
          ...g,
          currentAmount: newCurrentAmount,
          linkedAccountAmount: g.useEntireAccount
            ? notification.newValue
            : g.linkedAccountAmount + amountToAdd,
          status: isComplete ? "completed" : g.status, // Update status if complete
          completedDate:
            isComplete && g.status !== "completed"
              ? new Date().toISOString().split("T")[0]
              : g.completedDate, // Set completion date
          lastModified: new Date().toISOString().split("T")[0],
        };
      }
      return g;
    });

    const updatedData = {
      ...data,
      goals: updatedGoals,
    };

    // For goal updates, we don't want to trigger new notifications, so we update directly
    const calculatedBudget = enrichBudgetWithCalculations(updatedData.budget);
    const finalData = { ...updatedData, budget: calculatedBudget };

    setData(finalData);

    // Update previousAccountValues to current account values
    updatePreviousAccountValues(data.accounts);

    if (user && persistence === "server") {
      // TODO: save to server
    } else if (persistence === "local") {
      saveFinancialDataUtil(finalData);
    }

    // Remove the notification and DO NOT mark it as dismissed when applying
    // This allows future notifications for the same goal-account pair
    setAccountChangeNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );

    // Show celebration message if goal was completed
    const completedGoal = updatedGoals.find((g) => g.id === goal.id);
    if (
      completedGoal &&
      completedGoal.status === "completed" &&
      goal.status !== "completed"
    ) {
      /*    console.log(
        `🎉 Congratulations! You've completed your "${completedGoal.name}" goal!`
      ); */
      // You could add a toast notification here if you have a notification system
    }
  };

  // Dismiss notification without updating goal - ALSO UPDATED
  const dismissAccountChangeNotification = (notificationId) => {
    // When dismissing (not applying), we should add to dismissed set
    // to prevent the same notification from appearing again
    const notification = accountChangeNotifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      updatePreviousAccountValues(data.accounts);
    }

    setAccountChangeNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
    setDismissedNotificationIds((prev) => new Set([...prev, notificationId]));
  };

  // Clear all notifications - ALSO UPDATED
  const clearAllAccountChangeNotifications = () => {
    // Mark all current notifications as dismissed and update previous values
    const allCurrentIds = accountChangeNotifications.map((n) => n.id);
    setDismissedNotificationIds((prev) => new Set([...prev, ...allCurrentIds]));
    setAccountChangeNotifications([]);

    // Update previous account values to current state
    updatePreviousAccountValues(data.accounts);
  };

  // Clear dismissed notifications (for testing/debugging)
  const clearDismissedNotifications = () => {
    setDismissedNotificationIds(new Set());
    localStorage.removeItem("dismissedGoalNotifications");
  };

  // Reset dismissal state for a specific goal-account pair
  const resetDismissalForGoalAccount = (goalId, accountId) => {
    const notificationId = createNotificationId(goalId, accountId);
    setDismissedNotificationIds((prev) => {
      const newSet = new Set([...prev]);
      newSet.delete(notificationId);
      return newSet;
    });
  };

  // --- Update methods (existing methods remain the same) ---
  const updateIncome = (incomeFields) => {
    const updatedBudget = {
      ...data.budget,
      income: { ...data.budget.income, ...incomeFields },
    };
    saveData({ ...data, budget: updatedBudget });
  };

  const clearIncome = () => {
    const updatedBudget = {
      ...data.budget,
      income: {
        type: "salary",
        annualPreTax: 0,
        monthlyAfterTax: 0,
        hourlyRate: null,
        expectedAnnualHours: null,
        bonusAfterTax: 0,
        additionalIncomeAfterTax: 0,
      },
    };
    saveData({ ...data, budget: updatedBudget });
  };

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: `exp-${Date.now()}`,
    };

    // If this expense is linked to a goal, update the goal
    if (newExpense.goalId) {
      const goal = data.goals.find((g) => g.id === newExpense.goalId);
      if (goal) {
        updateGoal(newExpense.goalId, {
          linkedToBudget: true,
          budgetExpenseId: newExpense.id,
          monthlyContribution: parseFloat(newExpense.amount) || 0,
        });
      }
    }

    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: [...data.budget.monthlyExpenses, newExpense],
    };
    saveData({ ...data, budget: updatedBudget });
  };

  const updateExpense = (id, fields) => {
    const expense = data.budget.monthlyExpenses.find((exp) => exp.id === id);
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: data.budget.monthlyExpenses.map((exp) =>
        exp.id === id ? { ...exp, ...fields } : exp
      ),
    };

    // If this expense is linked to a goal, update the goal's monthly contribution
    if (expense && expense.goalId) {
      const newAmount =
        parseFloat(fields.amount) || parseFloat(expense.amount) || 0;
      updateGoal(expense.goalId, {
        monthlyContribution: newAmount,
      });
    }

    saveData({ ...data, budget: updatedBudget });
  };

  const removeExpense = (id) => {
    const expense = data.budget.monthlyExpenses.find((exp) => exp.id === id);

    // If this expense is linked to a goal, unlink it
    if (expense && expense.goalId) {
      updateGoal(expense.goalId, {
        linkedToBudget: false,
        budgetExpenseId: null,
        monthlyContribution: 0,
      });
    }

    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: data.budget.monthlyExpenses.filter(
        (exp) => exp.id !== id
      ),
    };
    saveData({ ...data, budget: updatedBudget });
  };

  const clearExpenses = () => {
    const updatedBudget = { ...data.budget, monthlyExpenses: [] };
    saveData({ ...data, budget: updatedBudget });
  };

  const clearBudget = () => {
    saveData({
      ...data,
      budget: {
        income: {
          type: "salary",
          annualPreTax: 0,
          monthlyAfterTax: 0,
          hourlyRate: null,
          expectedAnnualHours: null,
          bonusAfterTax: 0,
          additionalIncomeAfterTax: 0,
        },
        monthlyExpenses: [],
      },
    });
  };

  const resetBudgetToDemo = () => {
    setData({
      accounts: DEMO_ACCOUNTS, // <-- reset accounts too
      budget: DEFAULT_DEMO_BUDGET,
      portfolios: DEMO_PORTFOLIOS,
      goals: [],
    });
  };

  const resetAccountsToDemo = () => {
    saveData({ ...data, accounts: DEMO_ACCOUNTS });
  };

  const clearAccountsData = () => {
    saveData({ ...data, accounts: [] });
  };

  // Add method to update goals
  const updateGoal = (goalId, updates) => {
    const updatedGoals = data.goals.map((goal) => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, ...updates };

        // Check if goal is now completed
        const isComplete =
          updatedGoal.currentAmount >= updatedGoal.targetAmount;
        if (isComplete && updatedGoal.status !== "completed") {
          updatedGoal.status = "completed";
          updatedGoal.completedDate = new Date().toISOString().split("T")[0];
        }

        return updatedGoal;
      }
      return goal;
    });

    // Handle budget synchronization
    let updatedBudget = { ...data.budget };
    const updatedGoal = updatedGoals.find((g) => g.id === goalId);

    if (updatedGoal) {
      // Remove any existing budget expense for this goal
      updatedBudget.monthlyExpenses = updatedBudget.monthlyExpenses.filter(
        (exp) => exp.goalId !== goalId
      );

      // Add new budget expense if goal is linked to budget
      if (updatedGoal.linkedToBudget && updatedGoal.budgetMonthlyAmount > 0) {
        const budgetExpense = {
          id: updatedGoal.budgetExpenseId || `goal-expense-${goalId}`,
          name: `Goal: ${updatedGoal.name}`,
          cost: updatedGoal.budgetMonthlyAmount,
          category: "flexible",
          goalId: goalId,
        };
        updatedBudget.monthlyExpenses.push(budgetExpense);

        // Update the goal with the budget expense ID
        const goalIndex = updatedGoals.findIndex((g) => g.id === goalId);
        if (goalIndex !== -1) {
          updatedGoals[goalIndex].budgetExpenseId = budgetExpense.id;
        }
      }
    }

    saveData({ ...data, goals: updatedGoals, budget: updatedBudget });
  };

  // Add method for manual goal contributions
  const addManualGoalContribution = (goalId, amount) => {
    const goal = data.goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newCurrentAmount = Math.max(0, goal.currentAmount + amount);
    const isComplete = newCurrentAmount >= goal.targetAmount;

    updateGoal(goalId, {
      currentAmount: newCurrentAmount,
      status: isComplete ? "completed" : goal.status,
      completedDate:
        isComplete && goal.status !== "completed"
          ? new Date().toISOString().split("T")[0]
          : goal.completedDate,
      lastModified: new Date().toISOString().split("T")[0],
    });
  };

  // Add method to remove goals
  const removeGoal = (goalId) => {
    const goal = data.goals.find((g) => g.id === goalId);

    // Remove goal from goals array
    const updatedGoals = data.goals.filter((g) => g.id !== goalId);

    // Remove associated budget expense if it exists
    let updatedBudget = { ...data.budget };
    if (goal && goal.budgetExpenseId) {
      updatedBudget.monthlyExpenses = updatedBudget.monthlyExpenses.filter(
        (exp) => exp.id !== goal.budgetExpenseId
      );
    }

    saveData({ ...data, goals: updatedGoals, budget: updatedBudget });
  };

  return (
    <FinancialDataContext.Provider
      value={{
        data,
        saveData,
        updateIncome,
        clearIncome,
        addExpense,
        updateExpense,
        removeExpense,
        clearExpenses,
        clearBudget,
        setPersistence,
        persistence,
        userSignedIn: !!user,
        resetBudgetToDemo,
        resetAccountsToDemo,
        clearAccountsData,
        updateGoal,
        removeGoal, // Add this line
        addManualGoalContribution,
        // Account change notifications
        accountChangeNotifications,
        applyGoalUpdateFromNotification,
        dismissAccountChangeNotification,
        clearAllAccountChangeNotifications,
        clearDismissedNotifications,
        resetDismissalForGoalAccount,
        showNotification, // Expose toast notification function
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => useContext(FinancialDataContext);
