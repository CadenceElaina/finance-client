// src/services/financialService.js
const API_BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
                     (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
                     'http://localhost:3001/api';

/**
 * Fetches financial data from the server
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Financial data
 */
export async function fetchFinancialData(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/financial-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    throw error;
  }
}

/**
 * Saves financial data to the server
 * @param {Object} data - Financial data to save
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Response from server
 */
export async function saveFinancialData(data, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/financial-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error saving financial data:', error);
    throw error;
  }
}

/**
 * Deletes all financial data for the user
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Response from server
 */
export async function deleteFinancialData(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/financial-data`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error deleting financial data:', error);
    throw error;
  }
}

/**
 * Updates user profile/settings
 * @param {Object} profileData - Profile data to update
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Response from server
 */
export async function updateUserProfile(profileData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}