import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "../hooks/useToast";
import { debounce } from "../utils/debounce";
import { enrichBudgetWithCalculations } from "../utils/calculations/budgetCalculations";
import {
  loadFinancialData,
  saveFinancialDataUtil,
} from "../utils/dataPersistence";
import {
  syncDebtPaymentsToExpenses,
  syncExpensesToDebtAccounts,
} from "../utils/debtPaymentSync";
import {
  DEMO_ACCOUNTS,
  DEFAULT_DEMO_BUDGET,
  DEMO_PORTFOLIOS,
} from "../utils/constants";

// Split contexts for better performance
const FinancialDataStateContext = createContext();
const FinancialDataActionsContext = createContext();

const LoadingComponent = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      color: "var(--text-secondary)",
      fontSize: "var(--font-size-base)",
    }}
  >
    <div>
      <div style={{ marginBottom: "1rem" }}>Loading financial data...</div>
      <div
        style={{
          width: "200px",
          height: "4px",
          background: "var(--surface-dark)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "var(--color-primary)",
            animation: "loading-progress 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  </div>
);

export const FinancialDataProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { showNotification } = useToast();

  // Initialize persistence preference
  const [persistence, setPersistence] = useState(() => {
    const stored = localStorage.getItem("financialDataPersistence");
    return stored || (user ? "server" : "local");
  });

  // State management
  const [data, setData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track previous account values for goal linking
  const [previousAccountValues, setPreviousAccountValues] = useState({});
  const [accountChangeNotifications, setAccountChangeNotifications] = useState(
    []
  );
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(
    () => {
      try {
        const stored = localStorage.getItem("dismissedGoalNotifications");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  );

  // FIXED: Define stable callback functions with proper dependencies
  const updatePreviousAccountValues = useCallback((accounts) => {
    const accountValues = {};
    accounts.forEach((account) => {
      accountValues[account.id] = account.value;
    });
    setPreviousAccountValues(accountValues);
  }, []);

  const createNotificationId = useCallback(
    (goalId, accountId, oldValue, newValue) => {
      return `${goalId}-${accountId}-${oldValue}-${newValue}`;
    },
    []
  );

  // Update the checkAccountChangesForGoals function to properly sync linked account amounts

  const checkAccountChangesForGoals = useCallback(
    (accounts, goals, previousValues) => {
      if (!goals || goals.length === 0) return [];

      const notifications = [];

      // FIXED: Update linked account amounts for all goals, not just notifications
      const updatedGoals = goals.map((goal) => {
        if (goal.fundingAccountId && goal.useEntireAccount) {
          const linkedAccount = accounts.find(
            (acc) => acc.id === goal.fundingAccountId
          );
          if (linkedAccount) {
            const oldValue = previousValues[goal.fundingAccountId] || 0;
            const newValue = linkedAccount.value || 0;

            // FIXED: Always update linkedAccountAmount when account value changes
            const updatedGoal = {
              ...goal,
              linkedAccountAmount: newValue,
              currentAmount: newValue + (goal.manualContributions || 0),
            };

            // Only create notification if the change is significant and goal isn't complete
            const significantChange = Math.abs(newValue - oldValue) >= 50;
            const isComplete = updatedGoal.currentAmount >= goal.targetAmount;

            if (significantChange && !isComplete && newValue !== oldValue) {
              const notificationId = createNotificationId(
                goal.id,
                goal.fundingAccountId,
                oldValue,
                newValue
              );

              if (!dismissedNotificationIds.includes(notificationId)) {
                notifications.push({
                  id: notificationId,
                  type: "accountGoalUpdate",
                  goal: updatedGoal,
                  accountId: goal.fundingAccountId,
                  accountName: linkedAccount.name,
                  oldValue,
                  newValue,
                  timestamp: Date.now(),
                });
              }
            }

            return updatedGoal;
          }
        }
        return goal;
      });

      // FIXED: Update the goals in data if any linked amounts changed
      const goalsChanged = updatedGoals.some(
        (goal, index) =>
          goal.linkedAccountAmount !== goals[index].linkedAccountAmount ||
          goal.currentAmount !== goals[index].currentAmount
      );

      if (goalsChanged) {
        // Update the goals in the data immediately
        setData((prevData) => ({
          ...prevData,
          goals: updatedGoals,
        }));
      }

      return notifications;
    },
    [dismissedNotificationIds, createNotificationId]
  );

  // FIXED: Stable data initialization with dependency control
  const initializeData = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitialized) {
      console.log("Data already initialized, skipping...");
      return;
    }

    try {
      console.log("Loading financial data...");
      const loadedData = await loadFinancialData({ user, token, persistence });

      // Ensure proper structure
      const normalizedData = {
        accounts: loadedData.accounts || DEMO_ACCOUNTS,
        budget: loadedData.budget || DEFAULT_DEMO_BUDGET,
        portfolios: loadedData.portfolios || DEMO_PORTFOLIOS,
        goals: loadedData.goals || [],
      };

      // Enrich budget with calculations
      const enrichedData = {
        ...normalizedData,
        budget: enrichBudgetWithCalculations(normalizedData.budget),
      };

      console.log("Setting enriched data:", enrichedData);
      setData(enrichedData);
      updatePreviousAccountValues(enrichedData.accounts);
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to load financial data:", error);

      // Fallback to demo data
      const fallbackData = {
        accounts: DEMO_ACCOUNTS,
        budget: enrichBudgetWithCalculations(DEFAULT_DEMO_BUDGET),
        portfolios: DEMO_PORTFOLIOS,
        goals: [],
      };

      setData(fallbackData);
      updatePreviousAccountValues(fallbackData.accounts);
      setIsInitialized(true);

      showNotification({
        type: "error",
        title: "Load Failed",
        message: "Failed to load data. Using demo data.",
      });
    }
  }, [
    user?.id,
    token,
    persistence,
    isInitialized,
    updatePreviousAccountValues,
    showNotification,
  ]);

  // FIXED: Only initialize once and when critical dependencies change
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (mounted && !isInitialized) {
        await initializeData();
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [user?.id, persistence]); // FIXED: Only depend on user ID and persistence, not the function itself

  // FIXED: Stable debounced save function
  const debouncedSave = useRef(
    debounce(
      async (
        dataToSave,
        userCtx,
        tokenCtx,
        persistenceCtx,
        showNotificationCtx
      ) => {
        try {
          await saveFinancialDataUtil({
            user: userCtx,
            token: tokenCtx,
            persistence: persistenceCtx,
            data: dataToSave,
          });
        } catch (error) {
          console.error("Failed to save data:", error);
          showNotificationCtx({
            type: "error",
            title: "Save Failed",
            message: "Failed to save data. Please try again.",
          });
        }
      },
      1000
    )
  ).current;

  // FIXED: Add goal budget sync utility
  const syncGoalBudgetExpenses = (data) => {
    const goals = data.goals || [];
    const currentExpenses = data.budget?.monthlyExpenses || [];

    // Remove existing goal expenses
    let updatedExpenses = currentExpenses.filter((exp) => !exp.isGoalPayment);

    // Add current goal expenses
    goals.forEach((goal) => {
      if (
        goal.linkedToBudget &&
        goal.budgetMonthlyAmount > 0 &&
        goal.status === "active"
      ) {
        const goalExpenseId = `exp-goal-${goal.id}`;
        const goalExpense = {
          id: goalExpenseId,
          name: `${goal.name}`,
          cost: goal.budgetMonthlyAmount,
          category: "required",
          linkedToGoalId: goal.id,
          isGoalPayment: true,
        };

        updatedExpenses.push(goalExpense);
      }
    });

    return {
      ...data,
      budget: {
        ...data.budget,
        monthlyExpenses: updatedExpenses,
      },
    };
  };

  // Update the saveData function to handle goal syncing better

  const saveData = useCallback(
    async (newData) => {
      if (!isInitialized) {
        console.warn("Attempted to save data before initialization");
        return;
      }

      try {
        // FIXED: Sync goal account amounts before saving
        const syncedData = syncGoalAccountAmounts(newData);

        // Sync debt payments to budget expenses
        const finalData = syncGoalBudgetExpenses(syncedData);

        // Update previous account values for goal tracking
        if (finalData.accounts) {
          updatePreviousAccountValues(finalData.accounts);
        }

        // Check for account changes that affect goals
        if (finalData.accounts && data?.goals) {
          const notifications = checkAccountChangesForGoals(
            finalData.accounts,
            finalData.goals || [],
            previousAccountValues
          );

          if (notifications.length > 0) {
            setAccountChangeNotifications((prev) => [
              ...prev,
              ...notifications,
            ]);
          }
        }

        setData(finalData);

        // Debounced save to storage/server
        debouncedSave(finalData, user, token, persistence, showNotification);
      } catch (error) {
        console.error("Error saving data:", error);
        showNotification({
          type: "error",
          title: "Save Failed",
          message: "Failed to save your data. Please try again.",
        });
      }
    },
    [
      data,
      user,
      token,
      persistence,
      showNotification,
      updatePreviousAccountValues,
      previousAccountValues,
      checkAccountChangesForGoals,
      isInitialized,
      debouncedSave,
    ]
  );

  // FIXED: Add function to sync goal account amounts
  const syncGoalAccountAmounts = (data) => {
    if (!data.goals || !data.accounts) return data;

    const updatedGoals = data.goals.map((goal) => {
      if (goal.fundingAccountId && goal.useEntireAccount) {
        const linkedAccount = data.accounts.find(
          (acc) => acc.id === goal.fundingAccountId
        );
        if (linkedAccount) {
          const newAccountValue = linkedAccount.value || 0;
          return {
            ...goal,
            linkedAccountAmount: newAccountValue,
            currentAmount: newAccountValue + (goal.manualContributions || 0),
          };
        }
      }
      return goal;
    });

    return {
      ...data,
      goals: updatedGoals,
    };
  };

  // Persist dismissed notifications
  useEffect(() => {
    localStorage.setItem(
      "dismissedGoalNotifications",
      JSON.stringify(dismissedNotificationIds)
    );
  }, [dismissedNotificationIds]);

  // FIXED: Stable data with better memoization
  const stableData = useMemo(() => {
    if (!data) return null;

    return {
      ...data,
      accountChangeNotifications,
      dismissedNotificationIds,
      persistence,
    };
  }, [data, accountChangeNotifications, dismissedNotificationIds, persistence]);

  // FIXED: Stable actions with better memoization
  const actions = useMemo(
    () => ({
      saveData,
      setPersistence,
      updateIncome: (incomeFields) => {
        if (!data) return;
        saveData({
          ...data,
          budget: {
            ...data.budget,
            income: { ...data.budget?.income, ...incomeFields },
          },
        });
      },
      clearIncome: () => {
        if (!data) return;
        saveData({
          ...data,
          budget: { ...data.budget, income: {} },
        });
      },
      addExpense: (expense) => {
        if (!data) return;
        const expenses = data.budget?.monthlyExpenses || [];
        saveData({
          ...data,
          budget: { ...data.budget, monthlyExpenses: [...expenses, expense] },
        });
      },
      updateExpense: (id, fields) => {
        if (!data) return;
        const expenses = data.budget?.monthlyExpenses || [];
        const updated = expenses.map((exp) =>
          exp.id === id ? { ...exp, ...fields } : exp
        );
        saveData({
          ...data,
          budget: { ...data.budget, monthlyExpenses: updated },
        });
      },
      removeExpense: (id) => {
        if (!data) return;
        const expenses = data.budget?.monthlyExpenses || [];
        saveData({
          ...data,
          budget: {
            ...data.budget,
            monthlyExpenses: expenses.filter((exp) => exp.id !== id),
          },
        });
      },
      clearExpenses: () => {
        if (!data) return;
        saveData({
          ...data,
          budget: { ...data.budget, monthlyExpenses: [] },
        });
      },
      resetBudgetToDemo: () => {
        if (!data) return;
        saveData({
          ...data,
          budget: enrichBudgetWithCalculations(DEFAULT_DEMO_BUDGET),
        });
      },
      resetAccountsToDemo: () => {
        // FIXED: Use imported constants instead of require
        const updatedData = {
          ...data,
          accounts: DEMO_ACCOUNTS,
          portfolios: DEMO_PORTFOLIOS, // FIXED: Also restore demo portfolios
        };

        saveData(updatedData);

        showNotification({
          type: "warning",
          title: "Reset Complete",
          message: `Accounts and portfolios reset to demo data!\n• ${DEMO_ACCOUNTS.length} accounts\n• ${DEMO_PORTFOLIOS.length} portfolios`,
        });
      },
      clearAccountsData: () => {
        if (!data) return;
        saveData({ ...data, accounts: [] });
      },
      updateGoal: (goalId, updates) => {
        if (!data) return;
        const goals = data.goals || [];
        const updated = goals.map((goal) =>
          goal.id === goalId ? { ...goal, ...updates } : goal
        );
        saveData({ ...data, goals: updated });
      },
      removeGoal: (goalId) => {
        if (!data) return;
        const goals = data.goals || [];
        saveData({
          ...data,
          goals: goals.filter((goal) => goal.id !== goalId),
        });
      },
      addManualGoalContribution: (goalId, amount) => {
        if (!data) return;
        const goals = data.goals || [];
        const updated = goals.map((goal) => {
          if (goal.id === goalId) {
            const newAmount = (goal.currentAmount || 0) + amount;
            return {
              ...goal,
              currentAmount: newAmount,
              lastModified: new Date().toISOString().split("T")[0],
            };
          }
          return goal;
        });
        saveData({ ...data, goals: updated });
      },
      applyGoalUpdateFromNotification: (notificationId, amountToAdd) => {
        if (!data) return;
        const notification = accountChangeNotifications.find(
          (n) => n.id === notificationId
        );
        if (notification) {
          const goals = data.goals || [];
          const updated = goals.map((goal) => {
            if (goal.id === notification.goal.id) {
              const newAmount = Math.min(
                goal.targetAmount,
                (goal.currentAmount || 0) + amountToAdd
              );
              return {
                ...goal,
                currentAmount: newAmount,
                lastModified: new Date().toISOString().split("T")[0],
              };
            }
            return goal;
          });
          saveData({ ...data, goals: updated });
        }
      },
      dismissAccountChangeNotification: (notificationId) => {
        setDismissedNotificationIds((prev) => [...prev, notificationId]);
        setAccountChangeNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      },
      clearAllAccountChangeNotifications: () => {
        const allIds = accountChangeNotifications.map((n) => n.id);
        setDismissedNotificationIds((prev) => [...prev, ...allIds]);
        setAccountChangeNotifications([]);
      },
      showNotification,
    }),
    [data, saveData, accountChangeNotifications, showNotification]
  );

  // Don't render until initialized
  if (!isInitialized || !stableData) {
    return <LoadingComponent />;
  }

  return (
    <FinancialDataStateContext.Provider value={stableData}>
      <FinancialDataActionsContext.Provider value={actions}>
        {children}
      </FinancialDataActionsContext.Provider>
    </FinancialDataStateContext.Provider>
  );
};

// Hooks
export const useFinancialData = () => {
  const state = useContext(FinancialDataStateContext);
  const actions = useContext(FinancialDataActionsContext);

  if (!state || !actions) {
    throw new Error(
      "useFinancialData must be used within FinancialDataProvider"
    );
  }

  return { data: state, ...actions };
};

export const useFinancialDataSelector = (selector) => {
  const data = useContext(FinancialDataStateContext);
  if (!data)
    throw new Error(
      "useFinancialDataSelector must be used within FinancialDataProvider"
    );
  return selector(data);
};

export const useFinancialActions = () =>
  useContext(FinancialDataActionsContext);
