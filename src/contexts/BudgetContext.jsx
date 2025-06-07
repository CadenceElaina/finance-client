// src/contexts/BudgetContext.js (Updated)
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import * as budgetService from "../services/budgetService";
import {
    getBudgetDataFromLocal,
    saveBudgetDataToLocal,
    clearBudgetDataFromLocal,
} from "../utils/localStorageUtils";

const BudgetContext = createContext();

// Define a default/demo budget structure
const DEFAULT_DEMO_BUDGET = {
    // UPDATED INCOME STRUCTURE
    income: {
        type: "salary", // 'salary' or 'hourly'
        salary: 3500, // Monthly salary amount
        hourlyRate: null,
        expectedAnnualHours: null,
        bonus: 500, // Annual bonus amount
        additionalIncome: 100, // Annual additional income
        // monthlyIncomeAfterTaxes: { amount: 3000, frequencyProvided: "monthly" }, // This remains user-provided net monthly
        monthlyIncomeAfterTaxes: 3000 // Simplified to just the amount
    },
    monthlyExpenses: [
        { id: "exp-1", name: "Rent/Mortgage", cost: 1200, category: "required" },
        { id: "exp-2", name: "Groceries", cost: 400, category: "flexible" },
        { id: "exp-3", name: "Utilities", cost: 150, category: "required" },
        { id: "exp-4", name: "Internet", cost: 70, category: "required" },
        { id: "exp-5", name: "Transportation", cost: 100, category: "flexible" },
        { id: "exp-6", name: "Dining Out", cost: 200, category: "non-essential" },
        { id: "exp-7", name: "Entertainment", cost: 100, category: "non-essential" },
    ],
};

// Key for local storage persistence preference
const LOCAL_PERSISTENCE_PREF_KEY = 'budgetPersistencePreference';

export const BudgetProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [budget, setBudget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // 'server', 'local', 'none'
    const [persistencePreference, setPersistencePreference] = useState(() => {
        return localStorage.getItem(LOCAL_PERSISTENCE_PREF_KEY) || (user ? 'server' : 'local');
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
            if (user && persistencePreference === 'server') {
                loadedBudget = await budgetService.fetchBudget(token);
                if (!loadedBudget) {
                    // If no server budget, use a default empty structure for new users
                    loadedBudget = {
                        income: { type: "salary", salary: 0, hourlyRate: null, expectedAnnualHours: null, bonus: 0, additionalIncome: 0, monthlyIncomeAfterTaxes: 0 },
                        monthlyExpenses: [],
                    };
                    // Optionally, save this initial empty budget to server if you want it to exist immediately
                    // await budgetService.saveBudget(loadedBudget, token);
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
    const calculatedBudget = budget ? (() => {
        const totalMonthlyExpenses = budget.monthlyExpenses.reduce((acc, item) => acc + item.cost, 0);

        // Calculate Pre-tax Annual Income
        let preTaxIncomeAnnually = 0;
        if (budget.income.type === 'salary' && typeof budget.income.salary === 'number') {
            preTaxIncomeAnnually = budget.income.salary * 12; // Assuming monthly salary
        } else if (budget.income.type === 'hourly' && typeof budget.income.hourlyRate === 'number' && typeof budget.income.expectedAnnualHours === 'number') {
            preTaxIncomeAnnually = budget.income.hourlyRate * budget.income.expectedAnnualHours;
        }
        preTaxIncomeAnnually += (budget.income.bonus || 0);
        preTaxIncomeAnnually += (budget.income.additionalIncome || 0);


        const averageIncomeAfterTaxMonthly = typeof budget.income.monthlyIncomeAfterTaxes === 'number' ? budget.income.monthlyIncomeAfterTaxes : 0;
        const discretionaryIncomeAnnually = (averageIncomeAfterTaxMonthly * 12) - (totalMonthlyExpenses * 12);
        const averageDiscretionaryIncomeMonthly = averageIncomeAfterTaxMonthly - totalMonthlyExpenses;

        return {
            ...budget,
            totalMonthlyExpenses,
            preTaxIncomeAnnually,
            discretionaryIncomeAnnually,
            averageIncomeAfterTaxMonthly,
            averageDiscretionaryIncomeMonthly,
            // Keep the previous discretionaryIncome for clarity if still needed (based on provided monthly income)
            discretionaryIncome: averageIncomeAfterTaxMonthly - totalMonthlyExpenses // Monthly discretionary
        };
    })() : null;


    const updateIncome = (newIncomeFields) => {
        setBudget(prev => ({
            ...prev,
            income: { ...prev.income, ...newIncomeFields }
        }));
    };

    const addExpense = (newExpense) => {
        setBudget(prev => ({
            ...prev,
            monthlyExpenses: [...prev.monthlyExpenses, { ...newExpense, id: `exp-${Date.now()}` }] // Unique ID
        }));
    };

    const updateExpense = (id, updatedFields) => {
        setBudget(prev => ({
            ...prev,
            monthlyExpenses: prev.monthlyExpenses.map(exp =>
                exp.id === id ? { ...exp, ...updatedFields } : exp
            )
        }));
    };

    const removeExpense = (id) => {
        setBudget(prev => ({
            ...prev,
            monthlyExpenses: prev.monthlyExpenses.filter(exp => exp.id !== id)
        }));
    };

    const saveBudget = useCallback(async () => {
        if (!calculatedBudget) return;
        setIsLoading(true);
        setError(null);
        try {
            if (user && persistencePreference === 'server') {
                // Ensure to save the *full* calculated budget, which includes all fields for consistency
                await budgetService.saveBudget(calculatedBudget, token);
                console.log("Budget saved to server.");
            } else if (persistencePreference === 'local') {
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
        if (!user || persistencePreference === 'local') {
            saveBudgetDataToLocal(DEFAULT_DEMO_BUDGET);
        }
        console.log("Budget reset to demo data.");
    }, [user, persistencePreference]);


    const clearBudget = useCallback(async () => {
        setBudget({
            income: {
                type: "salary", salary: 0, hourlyRate: null, expectedAnnualHours: null, bonus: 0, additionalIncome: 0, monthlyIncomeAfterTaxes: 0
            },
            monthlyExpenses: [],
        });

        if (user && persistencePreference === 'server') {
            await budgetService.clearBudget(token); // Or save empty budget if your API supports upsert for PUT
            console.log("Budget cleared from server.");
        } else if (persistencePreference === 'local') {
            clearBudgetDataFromLocal();
            console.log("Budget cleared from local storage.");
        } else {
            console.log("Budget cleared locally but not saved (preference set to 'none').");
        }
    }, [user, token, persistencePreference]);


    const setBudgetPersistencePreference = (pref) => {
        setPersistencePreference(pref);
        // If changing to 'server' or 'local' for a signed-in user, trigger a load to reflect potential existing data
        if (user && (pref === 'server' || pref === 'local')) {
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