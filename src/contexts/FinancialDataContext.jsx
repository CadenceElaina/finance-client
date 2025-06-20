import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  loadFinancialData,
  saveFinancialDataUtil,
} from "../utils/dataPersistence";
import { calculateBudgetFields } from "../utils/calculations/budgetCalculations";
import {
  DEMO_ACCOUNTS,
  DEFAULT_DEMO_BUDGET,
  DEMO_PORTFOLIOS,
} from "../utils/constants";
import {
  getLocalData,
  saveLocalData,
  clearLocalData,
} from "../utils/localStorageUtils";

const FinancialDataContext = createContext();

export const FinancialDataProvider = ({ children }) => {
  const { user, token } = useAuth();
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
        const saved = localStorage.getItem("dismissedGoalNotifications");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch (error) {
        console.error("Error loading dismissed notifications:", error);
        return new Set();
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
        JSON.stringify([...dismissedNotificationIds])
      );
    } catch (error) {
      console.error("Error saving dismissed notifications:", error);
    }
  }, [dismissedNotificationIds]);

  // Load data on mount or when user/persistence changes
  useEffect(() => {
    async function load() {
      let loaded = null;
      if (user && persistence === "server") {
        loaded = null; // TODO: fetch from server
      }
      if (!loaded && persistence === "local") {
        loaded = getLocalData() || null;
      }

      const finalData =
        loaded && loaded.budget
          ? {
              ...loaded,
              budget: calculateBudgetFields(loaded.budget),
              portfolios: loaded.portfolios || DEMO_PORTFOLIOS,
              goals: loaded.goals || [],
            }
          : {
              accounts: DEMO_ACCOUNTS,
              budget: calculateBudgetFields(DEFAULT_DEMO_BUDGET),
              portfolios: DEMO_PORTFOLIOS,
              goals: [],
            };

      setData(finalData);

      // Initialize previous account values immediately after data load
      const accountMap = {};
      finalData.accounts.forEach((acc) => {
        accountMap[acc.id] = acc.value || 0;
      });
      setPreviousAccountValues(accountMap);

      // Clear notifications when new data is loaded
      setAccountChangeNotifications([]);
      setIsInitialized(true);

      /*   console.log("FinancialDataContext initialized:", {
        accounts: finalData.accounts.length,
        goals: finalData.goals.length,
        accountValues: accountMap,
      }); */
    }
    load();
  }, [user, token, persistence]);

  // Update the createNotificationId function to include account values
  const createNotificationId = (goalId, accountId, oldValue, newValue) => {
    return `${goalId}-${accountId}-${oldValue.toFixed(2)}-${newValue.toFixed(
      2
    )}`;
  };

  // Helper function to update previous account values
  const updatePreviousAccountValues = (accounts) => {
    const accountMap = {};
    accounts.forEach((acc) => {
      accountMap[acc.id] = acc.value || 0;
    });
    setPreviousAccountValues(accountMap);
    /*   console.log("Updated previous account values:", accountMap); */
  };

  // Save data to correct place - Updated to check for account changes BEFORE saving
  const saveData = async (newData) => {
    const dataToSave = newData || data;
    const calculatedBudget = calculateBudgetFields(dataToSave.budget);
    const finalData = { ...dataToSave, budget: calculatedBudget };

    /*   console.log("Saving data - checking for account changes first...");
     */
    // CHECK FOR ACCOUNT CHANGES BEFORE UPDATING STATE
    if (
      finalData.accounts &&
      isInitialized &&
      Object.keys(previousAccountValues).length > 0
    ) {
      const newAccountMap = {};
      finalData.accounts.forEach((acc) => {
        newAccountMap[acc.id] = acc.value || 0;
      });

      const goals = finalData.goals || [];
      const newNotifications = [];

      /*   console.log("Pre-save account check:", {
        previousValues: previousAccountValues,
        newValues: newAccountMap,
        goalsCount: goals.length,
      });
 */
      goals.forEach((goal) => {
        // Skip notifications for completed goals
        if (goal.status === "completed") {
          /*   console.log(`Skipping notification for completed goal: ${goal.name}`); */
          return;
        }

        if (
          goal.fundingAccountId &&
          previousAccountValues[goal.fundingAccountId] !== undefined
        ) {
          const oldValue = previousAccountValues[goal.fundingAccountId];
          const newValue = newAccountMap[goal.fundingAccountId] || 0;

          /*   console.log("Pre-save account comparison:", {
            goalName: goal.name,
            goalStatus: goal.status,
            accountId: goal.fundingAccountId,
            oldValue,
            newValue,
            difference: Math.abs(oldValue - newValue),
            hasSignificantChange: Math.abs(oldValue - newValue) > 0.01,
          }); */

          // Only create notification if there's a significant change
          if (oldValue !== newValue && Math.abs(oldValue - newValue) > 0.01) {
            const notificationId = createNotificationId(
              goal.id,
              goal.fundingAccountId,
              oldValue,
              newValue
            );

            /*  console.log("Pre-save notification check:", {
              notificationId,
              isDismissed: dismissedNotificationIds.has(notificationId),
            }); */

            // Check if this notification was already dismissed
            if (!dismissedNotificationIds.has(notificationId)) {
              const account = finalData.accounts.find(
                (acc) => acc.id === goal.fundingAccountId
              );
              if (account) {
                /*      console.log("Creating notification during save:", {
                  notificationId,
                  goalName: goal.name,
                  goalStatus: goal.status,
                  accountName: account.name,
                  oldValue,
                  newValue,
                });
 */
                newNotifications.push({
                  id: notificationId,
                  goal,
                  oldValue,
                  newValue,
                  accountName: account.name,
                  timestamp: Date.now(),
                });
              }
            }
          }
        }
      });

      /*    console.log("Pre-save notifications created:", newNotifications.length); */

      // Add new notifications
      if (newNotifications.length > 0) {
        setAccountChangeNotifications((prev) => {
          const filteredPrev = prev.filter(
            (notification) =>
              !newNotifications.some(
                (newNotif) => newNotif.id === notification.id
              )
          );
          const finalNotifications = [...filteredPrev, ...newNotifications];
          /*  console.log(
            "Updated notifications array during save:",
            finalNotifications
          ); */
          return finalNotifications;
        });
      }

      // Update previous values AFTER checking for notifications
      updatePreviousAccountValues(finalData.accounts);
    }

    // Now update the data
    setData(finalData);

    if (user && persistence === "server") {
      // TODO: save to server
    } else if (persistence === "local") {
      saveLocalData(finalData);
    }
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
    const calculatedBudget = calculateBudgetFields(updatedData.budget);
    const finalData = { ...updatedData, budget: calculatedBudget };

    setData(finalData);

    // Update previousAccountValues to current account values
    updatePreviousAccountValues(data.accounts);

    if (user && persistence === "server") {
      // TODO: save to server
    } else if (persistence === "local") {
      saveLocalData(finalData);
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
    saveData({ ...data, budget: DEFAULT_DEMO_BUDGET });
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
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => useContext(FinancialDataContext);
