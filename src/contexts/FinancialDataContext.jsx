import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getLocalData, saveLocalData } from "../utils/localStorageUtils";
import { DEMO_ACCOUNTS, DEFAULT_DEMO_BUDGET } from "../utils/constants";
// import { fetchFinancialData, saveFinancialData } from "../services/financialService";

const FinancialDataContext = createContext();

export const FinancialDataProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [data, setData] = useState({
    accounts: DEMO_ACCOUNTS,
    budget: DEFAULT_DEMO_BUDGET,
  });
  const [persistence, setPersistence] = useState(
    () =>
      localStorage.getItem("financialDataPersistence") ||
      (user ? "server" : "local")
  );

  useEffect(() => {
    const load = async () => {
      let loaded;
      if (user && persistence === "server") {
        // TODO: Replace with real fetch function
        // loaded = await fetchFinancialData(token);
        loaded = null; // Simulate no server data for new user
        if (loaded && loaded.accounts && loaded.budget) {
          setData(loaded);
        } else {
          setData({ accounts: DEMO_ACCOUNTS, budget: DEFAULT_DEMO_BUDGET });
        }
      } else if (persistence === "local") {
        loaded = getLocalData() || {
          accounts: DEMO_ACCOUNTS,
          budget: DEFAULT_DEMO_BUDGET,
        };
        setData(loaded);
      } else {
        setData({ accounts: DEMO_ACCOUNTS, budget: DEFAULT_DEMO_BUDGET });
      }
    };
    load();
  }, [user, token, persistence]);

  // Save data to correct place
  const saveData = async (newData) => {
    setData(newData);
    if (user && persistence === "server") {
      // TODO: save to server
      // await saveFinancialData(newData, token);
    } else if (persistence === "local") {
      saveLocalData(newData);
    }
  };

  // --- Update methods ---
  const updateAccount = (updatedAccount) => {
    const newAccounts = data.accounts.map((acc) =>
      acc.id === updatedAccount.id ? updatedAccount : acc
    );
    saveData({ ...data, accounts: newAccounts });
  };

  const addAccount = (newAccount) => {
    saveData({ ...data, accounts: [...data.accounts, newAccount] });
  };

  const removeAccount = (accountId) => {
    saveData({
      ...data,
      accounts: data.accounts.filter((acc) => acc.id !== accountId),
    });
  };

  const updateBudget = (updatedBudget) => {
    saveData({ ...data, budget: updatedBudget });
  };

  // Budget helpers (optional)
  const updateIncome = (newIncomeFields) => {
    const updatedBudget = {
      ...data.budget,
      income: { ...data.budget.income, ...newIncomeFields },
    };
    updateBudget(updatedBudget);
  };

  const addExpense = (newExpense) => {
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: [
        ...data.budget.monthlyExpenses,
        { ...newExpense, id: `exp-${Date.now()}` },
      ],
    };
    updateBudget(updatedBudget);
  };

  const updateExpense = (id, updatedFields) => {
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: data.budget.monthlyExpenses.map((exp) =>
        exp.id === id ? { ...exp, ...updatedFields } : exp
      ),
    };
    updateBudget(updatedBudget);
  };

  const removeExpense = (id) => {
    const updatedBudget = {
      ...data.budget,
      monthlyExpenses: data.budget.monthlyExpenses.filter(
        (exp) => exp.id !== id
      ),
    };
    updateBudget(updatedBudget);
  };

  return (
    <FinancialDataContext.Provider
      value={{
        data,
        updateAccount,
        addAccount,
        removeAccount,
        updateBudget,
        updateIncome,
        addExpense,
        updateExpense,
        removeExpense,
        setPersistence,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => useContext(FinancialDataContext);
