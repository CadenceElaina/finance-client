import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  DEMO_ACCOUNTS,
  DEFAULT_DEMO_BUDGET,
  DEMO_PORTFOLIOS,
} from "../utils/constants";
import { calculateBudgetFields } from "../utils/calculations/budgetCalculations";
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
    portfolios: DEMO_PORTFOLIOS, // Add portfolios to initial state
  });

  // Load data on mount or when user/persistence changes
  useEffect(() => {
    async function load() {
      let loaded = null;
      if (user && persistence === "server") {
        // TODO: fetch from server
        loaded = null;
      }
      if (!loaded && persistence === "local") {
        loaded = getLocalData() || null;
      }
      setData(
        loaded && loaded.budget
          ? {
              ...loaded,
              budget: calculateBudgetFields(loaded.budget),
              portfolios: loaded.portfolios || DEMO_PORTFOLIOS, // Ensure portfolios exist
            }
          : {
              accounts: DEMO_ACCOUNTS,
              budget: calculateBudgetFields(DEFAULT_DEMO_BUDGET),
              portfolios: DEMO_PORTFOLIOS, // Include portfolios in demo data
            }
      );
    }
    load();
  }, [user, token, persistence]);

  // Save data to correct place
  const saveData = async (newData) => {
    const dataToSave = newData || data; // Use current data if none provided
    const calculatedBudget = calculateBudgetFields(dataToSave.budget);
    const finalData = { ...dataToSave, budget: calculatedBudget };

    setData(finalData); // Update state with calculated budget

    if (user && persistence === "server") {
      // TODO: save to server
    } else if (persistence === "local") {
      saveLocalData(finalData);
    }
  };

  // --- Update methods ---
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
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: [
        ...data.budget.monthlyExpenses,
        { ...expense, id: `exp-${Date.now()}` },
      ],
    };
    saveData({ ...data, budget: updatedBudget });
  };

  const updateExpense = (id, fields) => {
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: data.budget.monthlyExpenses.map((exp) =>
        exp.id === id ? { ...exp, ...fields } : exp
      ),
    };
    saveData({ ...data, budget: updatedBudget });
  };

  const removeExpense = (id) => {
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
    const emptyBudget = {
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
    saveData({ ...data, budget: emptyBudget });
    clearLocalData();
  };

  const resetBudgetToDemo = () => {
    setData((prev) => ({
      ...prev,
      budget: calculateBudgetFields(DEFAULT_DEMO_BUDGET),
    }));
    if (persistence === "local") {
      saveLocalData({
        ...data,
        budget: calculateBudgetFields(DEFAULT_DEMO_BUDGET),
      });
    }
  };

  const resetAccountsToDemo = () => {
    setData((prev) => ({
      ...prev,
      accounts: DEMO_ACCOUNTS,
      portfolios: DEMO_PORTFOLIOS, // Reset portfolios too
    }));
    if (persistence === "local") {
      saveLocalData({
        ...data,
        accounts: DEMO_ACCOUNTS,
        portfolios: DEMO_PORTFOLIOS, // Save portfolios
      });
    }
  };

  const clearAccountsData = () => {
    const updatedData = { ...data, accounts: [], portfolios: [] };
    setData(updatedData);
    if (persistence === "local") {
      saveLocalData(updatedData);
    }
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
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => useContext(FinancialDataContext);
