// src/utils/localStorageUtils.js

const BUDGET_LOCAL_STORAGE_KEY = 'myFinAppBudget';

/**
 * Retrieves budget data from local storage.
 * @returns {Object|null} The budget data object, or null if not found or invalid.
 */
export const getBudgetDataFromLocal = () => {
    try {
        const data = localStorage.getItem(BUDGET_LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error reading budget from local storage:", error);
        return null;
    }
};

/**
 * Saves budget data to local storage.
 * @param {Object} budgetData - The budget data object to save.
 */
export const saveBudgetDataToLocal = (budgetData) => {
    try {
        localStorage.setItem(BUDGET_LOCAL_STORAGE_KEY, JSON.stringify(budgetData));
    } catch (error) {
        console.error("Error saving budget to local storage:", error);
    }
};

/**
 * Clears budget data from local storage.
 */
export const clearBudgetDataFromLocal = () => {
    try {
        localStorage.removeItem(BUDGET_LOCAL_STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing budget from local storage:", error);
    }
};

// Generic helpers for any data type
export const getLocalData = (key = 'financialData') => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error reading from local storage:", error);
        return null;
    }
};

export const saveLocalData = (data, key = 'financialData') => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving to local storage:", error);
    }
};

export const clearLocalData = (key = 'financialData') => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Error clearing local storage:", error);
    }
};