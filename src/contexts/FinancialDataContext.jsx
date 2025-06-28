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
  syncExpensesToDebtAccounts, // Although syncExpensesToDebtAccounts is not used directly here, it's good to keep track.
} from "../utils/debtPaymentSync";
import {
  DEMO_ACCOUNTS,
  DEFAULT_DEMO_BUDGET,
  DEMO_PORTFOLIOS,
  BASE_CASH_ACCOUNT,
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

// Utility: normalize a transaction to full schema
const normalizeTransaction = (tx) => ({
  transaction_id: tx.transaction_id || tx.id || Date.now(),
  account_id: tx.account_id || tx.accountId || "",
  transaction_date: tx.transaction_date || tx.date || "",
  amount:
    typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount) || 0,
  description: tx.description || "",
  category_id: tx.category_id || tx.category || "",
  subCategory: tx.subCategory || "",
  type: tx.type || "",
  merchant_name: tx.merchant_name || "",
  location: tx.location || "",
  original_description: tx.original_description || "",
  is_recurring:
    typeof tx.is_recurring === "boolean"
      ? tx.is_recurring
      : typeof tx.isRecurring === "boolean"
      ? tx.isRecurring
      : false,
  notes: tx.notes || "",
  tags: Array.isArray(tx.tags) ? tx.tags : [],
  created_at: tx.created_at || tx.createdAt || new Date().toISOString(),
  updated_at: tx.updated_at || tx.updatedAt || new Date().toISOString(),
});

// Utility: normalize all transactions in a list
const normalizeTransactions = (txs) =>
  Array.isArray(txs) ? txs.map(normalizeTransaction) : [];

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

  // Define stable callback functions with proper dependencies
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

      // Update linked account amounts for all goals, not just notifications
      const updatedGoals = goals.map((goal) => {
        if (goal.fundingAccountId && goal.useEntireAccount) {
          const linkedAccount = accounts.find(
            (acc) => acc.id === goal.fundingAccountId
          );
          if (linkedAccount) {
            const oldValue = previousValues[goal.fundingAccountId] || 0;
            const newValue = linkedAccount.value || 0;

            // Always update linkedAccountAmount when account value changes
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

      // Update the goals in data if any linked amounts changed
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

  // Stable data initialization with dependency control
  const ensureBaseCashAccount = (accounts) => {
    if (!accounts || !Array.isArray(accounts)) {
      return [BASE_CASH_ACCOUNT];
    }

    // Check if base cash account exists
    const hasBaseCash = accounts.some((acc) => acc.id === BASE_CASH_ACCOUNT.id);

    if (hasBaseCash) {
      return accounts;
    }

    // Add base cash account at the beginning
    return [BASE_CASH_ACCOUNT, ...accounts];
  };

  const initializeData = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitialized) {
      //    console.log("Data already initialized, skipping...");
      return;
    }

    try {
      //    console.log("Loading financial data...");
      const loadedData = await loadFinancialData({ user, token, persistence });

      // Ensure proper structure
      const normalizedData = {
        accounts: loadedData.accounts || DEMO_ACCOUNTS,
        budget: loadedData.budget || DEFAULT_DEMO_BUDGET,
        portfolios: loadedData.portfolios || DEMO_PORTFOLIOS,
        goals: loadedData.goals || [],
        transactions: normalizeTransactions(loadedData.transactions),
      };

      const accountsWithBaseCash = ensureBaseCashAccount(
        normalizedData.accounts
      );

      // FIXED: Initial enrichment of budget
      const enrichedBudget = enrichBudgetWithCalculations(
        normalizedData.budget
      );

      // Ensure initial expenses include debt payments
      const initialExpenses = syncDebtPaymentsToExpenses(
        accountsWithBaseCash,
        enrichedBudget.monthlyExpenses
      );

      const enrichedAndSyncedData = {
        ...normalizedData,
        accounts: accountsWithBaseCash,
        budget: {
          ...enrichedBudget,
          monthlyExpenses: initialExpenses,
        },
        transactions: normalizeTransactions(normalizedData.transactions),
      };

      setData(enrichedAndSyncedData);
      updatePreviousAccountValues(accountsWithBaseCash);
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to load financial data:", error);

      // Fallback to demo data
      const fallbackData = {
        accounts: DEMO_ACCOUNTS,
        budget: enrichBudgetWithCalculations(DEFAULT_DEMO_BUDGET),
        portfolios: DEMO_PORTFOLIOS,
        goals: [],
        transactions: [],
      };

      // Ensure fallback expenses include debt payments from demo accounts
      const fallbackExpenses = syncDebtPaymentsToExpenses(
        DEMO_ACCOUNTS,
        fallbackData.budget.monthlyExpenses
      );
      fallbackData.budget.monthlyExpenses = fallbackExpenses;
      fallbackData.budget = enrichBudgetWithCalculations(fallbackData.budget); // Re-enrich after adding debt expenses

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

  // Only initialize once and when critical dependencies change
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
  }, [user?.id, persistence, initializeData]); // Added initializeData to deps to trigger re-init if the function itself changes, though it's memoized.

  // Stable debounced save function
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

  // Update the goal sync functions to handle the new structure

  // Update the syncGoalBudgetExpenses function
  const syncGoalBudgetExpenses = (data) => {
    if (!data.goals || !data.budget) return data;

    const currentExpenses = data.budget.monthlyExpenses || [];
    let updatedExpenses = [...currentExpenses];

    // Remove existing goal expenses that are no longer active
    updatedExpenses = updatedExpenses.filter(
      (exp) =>
        !(
          exp.isGoalExpense === true ||
          (exp.id && exp.id.startsWith("exp-goal-"))
        )
    );

    // Add current goal expenses
    data.goals.forEach((goal) => {
      if (
        goal.linkedToBudget &&
        goal.budgetMonthlyAmount > 0 &&
        goal.status === "active"
      ) {
        const goalExpenseId = `exp-goal-${goal.id}`;

        updatedExpenses.push({
          id: goalExpenseId,
          name: `${goal.name} (Goal)`,
          cost: parseFloat(goal.budgetMonthlyAmount) || 0,
          category: "goal",
          isGoalExpense: true,
          linkedToGoalId: goal.id,
        });
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

  // Add function to sync goal account amounts (removed manual contributions)
  const syncGoalAccountAmounts = (data) => {
    if (!data.goals || !data.accounts) return data;

    return {
      ...data,
      goals: data.goals.map((goal) => {
        if (!goal.linkedAccounts || !Array.isArray(goal.linkedAccounts)) {
          return { ...goal, currentAmount: 0 };
        }

        // Calculate current amount from linked accounts only
        const currentAmount = goal.linkedAccounts.reduce((sum, linkedAcc) => {
          return sum + (parseFloat(linkedAcc.allocatedAmount) || 0);
        }, 0);

        return {
          ...goal,
          currentAmount,
        };
      }),
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
        // Ensure base cash account always exists before saving
        const accountsWithBaseCash = ensureBaseCashAccount(
          newData.accounts?.accounts || newData.accounts
        );

        // Step 1: Sync goal account amounts within the new data
        let currentData = syncGoalAccountAmounts({
          ...newData,
          accounts: accountsWithBaseCash,
        });

        // Step 2: Sync debt payments from accounts into expenses
        const expensesFromDebtSync = syncDebtPaymentsToExpenses(
          currentData.accounts,
          currentData.budget.monthlyExpenses
        );

        currentData = {
          ...currentData,
          budget: {
            ...currentData.budget,
            monthlyExpenses: expensesFromDebtSync,
          },
        };

        // Step 3: Sync goal budget expenses into the monthly expenses
        const finalSyncedData = syncGoalBudgetExpenses(currentData);

        // FIXED: Step 4: Re-enrich the budget with calculations after all modifications
        const enrichedBudget = enrichBudgetWithCalculations(
          finalSyncedData.budget
        );
        const dataToSet = {
          ...finalSyncedData,
          budget: enrichedBudget,
          transactions: normalizeTransactions(newData.transactions),
        };

        // Update previous account values for goal tracking
        if (dataToSet.accounts) {
          updatePreviousAccountValues(dataToSet.accounts);
        }

        // Check for account changes that affect goals
        if (dataToSet.accounts && data?.goals) {
          // Keep `data?.goals` for checking against previous state if needed for notifications
          const notifications = checkAccountChangesForGoals(
            dataToSet.accounts,
            dataToSet.goals || [],
            previousAccountValues
          );

          if (notifications.length > 0) {
            setAccountChangeNotifications((prev) => [
              ...prev,
              ...notifications,
            ]);
          }
        }

        // Final update of the state
        setData(dataToSet);

        // Debounced save to storage/server
        debouncedSave(dataToSet, user, token, persistence, showNotification);
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
      data, // This dependency is needed to access data.goals for notifications
      user,
      token,
      persistence,
      showNotification,
      updatePreviousAccountValues,
      previousAccountValues,
      checkAccountChangesForGoals,
      isInitialized,
      debouncedSave,
      syncGoalBudgetExpenses, // Add as dependency
      syncGoalAccountAmounts, // Add as dependency
    ]
  );

  // Persist dismissed notifications
  useEffect(() => {
    localStorage.setItem(
      "dismissedGoalNotifications",
      JSON.stringify(dismissedNotificationIds)
    );
  }, [dismissedNotificationIds]);

  // Stable data with better memoization
  const stableData = useMemo(() => {
    if (!data) return null;

    return {
      ...data,
      accountChangeNotifications,
      dismissedNotificationIds,
      persistence,
    };
  }, [data, accountChangeNotifications, dismissedNotificationIds, persistence]);

  // Stable actions with better memoization
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
        const updatedData = {
          ...data,
          accounts: DEMO_ACCOUNTS,
          portfolios: DEMO_PORTFOLIOS,
          goals: [], // Also reset goals to empty
        };

        // Ensure the budget reflects the debt payments from demo accounts
        const budgetWithDemoExpenses = {
          ...updatedData.budget,
          monthlyExpenses: syncDebtPaymentsToExpenses(
            DEMO_ACCOUNTS,
            DEFAULT_DEMO_BUDGET.monthlyExpenses
          ),
        };

        saveData({
          ...updatedData,
          budget: enrichBudgetWithCalculations(budgetWithDemoExpenses),
        });

        showNotification({
          type: "warning",
          title: "Reset Complete",
          message: `Accounts, portfolios, and budget reset to demo data!\n• ${DEMO_ACCOUNTS.length} accounts\n• ${DEMO_PORTFOLIOS.length} portfolios`,
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
    [
      data,
      saveData,
      accountChangeNotifications,
      showNotification,
      syncDebtPaymentsToExpenses,
    ]
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
