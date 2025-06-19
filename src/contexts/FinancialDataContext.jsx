import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getLocalData,
  saveLocalData,
  clearLocalData,
} from "../utils/localStorageUtils";
import { DEMO_ACCOUNTS, DEFAULT_DEMO_BUDGET } from "../utils/constants";
import { calculateBudgetFields } from "../utils/calculations/budgetCalculations";

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
          ? { ...loaded, budget: calculateBudgetFields(loaded.budget) }
          : {
              accounts: DEMO_ACCOUNTS,
              budget: calculateBudgetFields(DEFAULT_DEMO_BUDGET),
            }
      );
    }
    load();
  }, [user, token, persistence]);

  // Save data to correct place
  const saveData = async (newData) => {
    const dataToSave = newData || data; // Use current data if none provided
    const calculatedBudget = calculateBudgetFields(dataToSave.budget);
    setData({ ...dataToSave, budget: calculatedBudget });
    if (user && persistence === "server") {
      // TODO: save to server
    } else if (persistence === "local") {
      saveLocalData({ ...dataToSave, budget: calculatedBudget });
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

  const resetToDemoData = () => {
    const demoData = {
      accounts: DEMO_ACCOUNTS,
      budget: calculateBudgetFields(DEFAULT_DEMO_BUDGET),
    };
    setData(demoData);
    saveData(demoData);
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
        resetToDemoData,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => useContext(FinancialDataContext);
