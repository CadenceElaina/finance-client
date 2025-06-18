// src/contexts/BudgetContext.js (Updated)
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import * as budgetService from "../services/budgetService";
import {
  getBudgetDataFromLocal,
  saveBudgetDataToLocal,
  clearBudgetDataFromLocal,
} from "../utils/localStorageUtils";
import {
  LOCAL_PERSISTENCE_PREF_KEY,
  DEFAULT_DEMO_BUDGET,
} from "../utils/constants";

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [budget, setBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // 'server', 'local', 'none'
  const [persistencePreference, setPersistencePreference] = useState(() => {
    return (
      localStorage.getItem(LOCAL_PERSISTENCE_PREF_KEY) ||
      (user ? "server" : "local")
    );
  });

  // Save persistence preference to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_PERSISTENCE_PREF_KEY, persistencePreference);
  }, [persistencePreference]);

  const loadBudget = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let loadedBudget = null;
      if (user && persistencePreference === "server") {
        loadedBudget = await budgetService.fetchBudget(token);
        if (!loadedBudget) {
          // Use canonical field names!
          loadedBudget = {
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
          };
        }
      } else {
        // Load from local storage for unsigned users or signed-in with local preference
        loadedBudget = getBudgetDataFromLocal();
        if (!loadedBudget) {
          loadedBudget = DEFAULT_DEMO_BUDGET;
          saveBudgetDataToLocal(DEFAULT_DEMO_BUDGET); // Save demo to local if empty
        }
      }
      setBudget(loadedBudget);
    } catch (err) {
      console.error("Failed to load budget:", err);
      setError("Failed to load budget. Please try again.");
      setBudget(DEFAULT_DEMO_BUDGET); // Fallback to demo data on error
    } finally {
      setIsLoading(false);
    }
  }, [user, token, persistencePreference]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  // Recalculate totals whenever budget changes
  const calculatedBudget = budget
    ? (() => {
        const totalMonthlyExpenses = budget.monthlyExpenses.reduce(
          (acc, item) => acc + item.cost,
          0
        );

        let annualPreTax = 0;
        let monthlyAfterTax = 0;

        if (budget.income.type === "salary") {
          annualPreTax = budget.income.annualPreTax || 0;
          monthlyAfterTax = budget.income.monthlyAfterTax || 0;
        } else if (budget.income.type === "hourly") {
          annualPreTax =
            (budget.income.hourlyRate || 0) *
            (budget.income.expectedAnnualHours || 0);
          monthlyAfterTax = budget.income.monthlyAfterTax || 0;
        }

        // After-tax annual income
        const annualAfterTax =
          monthlyAfterTax * 12 +
          (budget.income.bonusAfterTax || 0) +
          (budget.income.additionalIncomeAfterTax || 0);

        // Pre-tax monthly income (for salary, just annualPreTax / 12)
        const monthlyPreTax =
          budget.income.type === "salary"
            ? annualPreTax / 12
            : annualPreTax / 12;

        // Discretionary income (after-tax monthly - expenses)
        const discretionaryIncome = monthlyAfterTax - totalMonthlyExpenses;

        return {
          ...budget,
          totalMonthlyExpenses,
          annualPreTax,
          monthlyAfterTax,
          annualAfterTax,
          monthlyPreTax,
          discretionaryIncome,
        };
      })()
    : null;

  const updateIncome = (newIncomeFields) => {
    setBudget((prev) => ({
      ...prev,
      income: { ...prev.income, ...newIncomeFields },
    }));
  };

  const addExpense = (newExpense) => {
    setBudget((prev) => ({
      ...prev,
      monthlyExpenses: [
        ...prev.monthlyExpenses,
        { ...newExpense, id: `exp-${Date.now()}` },
      ], // Unique ID
    }));
  };

  const updateExpense = (id, updatedFields) => {
    setBudget((prev) => ({
      ...prev,
      monthlyExpenses: prev.monthlyExpenses.map((exp) =>
        exp.id === id ? { ...exp, ...updatedFields } : exp
      ),
    }));
  };

  const removeExpense = (id) => {
    setBudget((prev) => ({
      ...prev,
      monthlyExpenses: prev.monthlyExpenses.filter((exp) => exp.id !== id),
    }));
  };

  const saveBudget = useCallback(async () => {
    if (!calculatedBudget) return;
    setIsLoading(true);
    setError(null);
    try {
      if (user && persistencePreference === "server") {
        // Ensure to save the *full* calculated budget, which includes all fields for consistency
        await budgetService.saveBudget(calculatedBudget, token);
        console.log("Budget saved to server.");
      } else if (persistencePreference === "local") {
        saveBudgetDataToLocal(calculatedBudget);
        console.log("Budget saved to local storage.");
      } else {
        console.log("Budget changes not saved (preference set to 'none').");
      }
    } catch (err) {
      console.error("Failed to save budget:", err);
      setError("Failed to save budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [calculatedBudget, user, token, persistencePreference]);

  const resetBudget = useCallback(() => {
    setBudget(DEFAULT_DEMO_BUDGET);
    if (!user || persistencePreference === "local") {
      saveBudgetDataToLocal(DEFAULT_DEMO_BUDGET);
    }
    console.log("Budget reset to demo data.");
  }, [user, persistencePreference]);

  const clearBudget = useCallback(async () => {
    setBudget({
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
    });

    if (user && persistencePreference === "server") {
      await budgetService.clearBudget(token); // Or save empty budget if your API supports upsert for PUT
      console.log("Budget cleared from server.");
    } else if (persistencePreference === "local") {
      clearBudgetDataFromLocal();
      console.log("Budget cleared from local storage.");
    } else {
      console.log(
        "Budget cleared locally but not saved (preference set to 'none')."
      );
    }
  }, [user, token, persistencePreference]);

  const setBudgetPersistencePreference = (pref) => {
    setPersistencePreference(pref);
    // If changing to 'server' or 'local' for a signed-in user, trigger a load to reflect potential existing data
    if (user && (pref === "server" || pref === "local")) {
      loadBudget();
    }
  };

  // Whenever user or token changes, re-load the budget
  useEffect(() => {
    // This effect will re-trigger loadBudget if user or token changes (e.g., login/logout)
    loadBudget();
  }, [user, token, loadBudget]);

  const contextValue = {
    budget: calculatedBudget,
    isLoading,
    error,
    persistencePreference,
    userSignedIn: !!user, // Convenience flag for components
    updateIncome,
    addExpense,
    updateExpense,
    removeExpense,
    saveBudget,
    resetBudget,
    clearBudget,
    setBudgetPersistencePreference,
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
