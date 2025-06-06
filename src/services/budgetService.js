// src/services/budgetService.js
import axios from 'axios';

// Base URL for your backend API
const API_URL = '/api/budget'; // Adjust if your API base URL is different

// Helper to set authorization header
const getConfig = (token) => ({
    headers: {
        Authorization: token ? `Bearer ${token}` : '',
    },
});

/**
 * Fetches the budget data for the logged-in user from the server.
 * @param {string} token - User's authentication token.
 * @returns {Promise<Object|null>} The budget object if found, otherwise null.
 */
export const fetchBudget = async (token) => {
    try {
        const response = await axios.get(API_URL, getConfig(token));
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Budget not found for user, which is a valid scenario for new users
            console.log("No budget found for this user on the server.");
            return null;
        }
        console.error("Error fetching budget:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
};

/**
 * Saves (creates or updates) the budget data on the server.
 * @param {Object} budgetData - The budget object to save.
 * @param {string} token - User's authentication token.
 * @returns {Promise<Object>} The saved budget object from the server.
 */
export const saveBudget = async (budgetData, token) => {
    try {
        // You might need to adjust this to differentiate between POST (create) and PUT (update)
        // For simplicity, we'll assume a PUT operation that creates if not exists or updates.
        // Your backend logic should handle this gracefully (e.g., upsert).
        const response = await axios.put(API_URL, budgetData, getConfig(token));
        return response.data;
    } catch (error) {
        console.error("Error saving budget:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to save budget');
    }
};

/**
 * Clears/deletes the budget data for the logged-in user on the server.
 * @param {string} token - User's authentication token.
 * @returns {Promise<void>}
 */
export const clearBudget = async (token) => {
    try {
        await axios.delete(API_URL, getConfig(token));
    } catch (error) {
        console.error("Error clearing budget:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to clear budget');
    }
};