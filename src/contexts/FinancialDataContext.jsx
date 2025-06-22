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

  const checkAccountChangesForGoals = useCallback(
    (accounts, goals, previousValues) => {
      const notifications = [];

      goals.forEach((goal) => {
        if (goal.fundingType === "account" && goal.fundingAccountId) {
          const account = accounts.find(
            (acc) => acc.id === goal.fundingAccountId
          );
          const oldValue = previousValues[goal.fundingAccountId] || 0;
          const newValue = account?.value || 0;

          if (Math.abs(newValue - oldValue) > 0.01) {
            const notificationId = createNotificationId(
              goal.id,
              account.id,
              oldValue,
              newValue
            );

            if (!dismissedNotificationIds.includes(notificationId)) {
              notifications.push({
                id: notificationId,
                goal,
                oldValue,
                newValue,
                accountName: account.name,
                type: "account_change",
              });
            }
          }
        }
      });

      setAccountChangeNotifications(notifications);
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

  // Save function with debt sync
  const saveData = useCallback(
    async (newData) => {
      if (!newData || !isInitialized) return;

      try {
        // Always enrich budget
        const dataToSave = {
          ...newData,
          budget: newData.budget
            ? enrichBudgetWithCalculations(newData.budget)
            : data?.budget,
        };

        // ENHANCED BIDIRECTIONAL SYNC
        const originalExpenses = data?.budget?.monthlyExpenses || [];
        const originalAccounts = data?.accounts || [];

        // Check if accounts changed (debt payments)
        const accountsChanged =
          JSON.stringify(originalAccounts) !==
          JSON.stringify(dataToSave.accounts);

        // Check if budget expenses changed
        const expensesChanged =
          JSON.stringify(originalExpenses) !==
          JSON.stringify(dataToSave.budget?.monthlyExpenses);

        let finalData = { ...dataToSave };

        if (accountsChanged) {
          // Accounts changed - sync debt payments TO expenses
          const syncedExpenses = syncDebtPaymentsToExpenses(
            dataToSave.accounts || [],
            dataToSave.budget?.monthlyExpenses || []
          );

          finalData.budget = {
            ...finalData.budget,
            monthlyExpenses: syncedExpenses,
          };
        } else if (expensesChanged) {
          // Budget expenses changed - sync debt payments TO accounts
          const syncedAccounts = syncExpensesToDebtAccounts(
            dataToSave.accounts || [],
            dataToSave.budget?.monthlyExpenses || []
          );

          finalData.accounts = syncedAccounts;
        }

        // Re-enrich after syncing
        finalData.budget = enrichBudgetWithCalculations(finalData.budget);

        // Check for account changes that affect goals
        const goals = finalData.goals || [];
        if (goals.length > 0) {
          checkAccountChangesForGoals(
            finalData.accounts,
            goals,
            previousAccountValues
          );
        }

        setData(finalData);
        updatePreviousAccountValues(finalData.accounts || []);

        // Save to persistence using the debounced function
        debouncedSave(finalData, user, token, persistence, showNotification);
      } catch (error) {
        console.error("Failed to save data:", error);
        showNotification({
          type: "error",
          title: "Save Failed",
          message: "Failed to save data. Please try again.",
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
        if (!data) return;
        saveData({ ...data, accounts: DEMO_ACCOUNTS });
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
