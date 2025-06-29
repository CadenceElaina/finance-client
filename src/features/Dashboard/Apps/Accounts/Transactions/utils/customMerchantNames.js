/**
 * Custom merchant name management system
 * Allows users to override system-generated merchant names with their own preferences
 */

const CUSTOM_MERCHANT_NAMES_KEY = 'customMerchantNames';

/**
 * Get stored custom merchant names from localStorage
 * @returns {object} - Custom merchant names object
 */
export const getCustomMerchantNames = () => {
  try {
    const stored = localStorage.getItem(CUSTOM_MERCHANT_NAMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load custom merchant names:', error);
    return {};
  }
};

/**
 * Save custom merchant names to localStorage
 * @param {object} names - Custom merchant names object
 */
export const saveCustomMerchantNames = (names) => {
  try {
    localStorage.setItem(CUSTOM_MERCHANT_NAMES_KEY, JSON.stringify(names));
  } catch (error) {
    console.warn('Failed to save custom merchant names:', error);
  }
};

/**
 * Normalize raw merchant data for consistent lookup
 * @param {string} rawMerchant - Raw merchant name from CSV
 * @param {string} location - Location information
 * @returns {string} - Normalized key for lookup
 */
export const normalizeMerchantKey = (rawMerchant, location = '') => {
  const combined = `${rawMerchant} ${location}`.toLowerCase();
  return combined
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Set a custom name for a merchant
 * @param {string} rawMerchant - Original merchant name from CSV
 * @param {string} location - Location information
 * @param {string} customName - User's preferred name for this merchant
 * @returns {boolean} - Success status
 */
export const setCustomMerchantName = (rawMerchant, location, customName) => {
  if (!rawMerchant || !rawMerchant.trim() || !customName || !customName.trim()) {
    console.warn('Cannot set custom merchant name: both raw merchant and custom name are required');
    return false;
  }

  const customNames = getCustomMerchantNames();
  const key = normalizeMerchantKey(rawMerchant, location);
  
  customNames[key] = {
    rawMerchant: rawMerchant.trim(),
    location: (location || '').trim(),
    customName: customName.trim(),
    createdAt: Date.now(),
    lastUsed: Date.now(),
    usageCount: 0
  };

  saveCustomMerchantNames(customNames);
  return true;
};

/**
 * Get the custom name for a merchant (if set)
 * @param {string} rawMerchant - Original merchant name from CSV
 * @param {string} location - Location information
 * @returns {string|null} - Custom name or null if not set
 */
export const getCustomMerchantName = (rawMerchant, location = '') => {
  const customNames = getCustomMerchantNames();
  const key = normalizeMerchantKey(rawMerchant, location);
  
  const customData = customNames[key];
  if (customData) {
    // Update usage stats
    customData.lastUsed = Date.now();
    customData.usageCount = (customData.usageCount || 0) + 1;
    saveCustomMerchantNames(customNames);
    return customData.customName;
  }
  
  return null;
};

/**
 * Remove a custom merchant name
 * @param {string} rawMerchant - Original merchant name from CSV
 * @param {string} location - Location information
 * @returns {boolean} - Success status
 */
export const removeCustomMerchantName = (rawMerchant, location = '') => {
  const customNames = getCustomMerchantNames();
  const key = normalizeMerchantKey(rawMerchant, location);
  
  if (customNames[key]) {
    delete customNames[key];
    saveCustomMerchantNames(customNames);
    return true;
  }
  
  return false;
};

/**
 * Get all custom merchant names for management/display
 * @returns {array} - Array of custom merchant name objects
 */
export const getAllCustomMerchantNames = () => {
  const customNames = getCustomMerchantNames();
  return Object.entries(customNames).map(([key, data]) => ({
    key,
    ...data
  }));
};

/**
 * Get the final merchant name to use (custom name takes precedence over cleaned name)
 * @param {string} rawMerchant - Original merchant name from CSV
 * @param {string} location - Location information
 * @param {function} cleanMerchantNameFn - Function to clean merchant names
 * @returns {string} - Final merchant name to use
 */
export const getFinalMerchantName = (rawMerchant, location, cleanMerchantNameFn) => {
  // First check if user has a custom name for this merchant
  const customName = getCustomMerchantName(rawMerchant, location);
  if (customName) {
    return customName;
  }
  
  // Otherwise use the cleaned name from the system
  return cleanMerchantNameFn(rawMerchant, location);
};

/**
 * Clear all custom merchant names
 */
export const clearCustomMerchantNames = () => {
  localStorage.removeItem(CUSTOM_MERCHANT_NAMES_KEY);
};

/**
 * Clear all custom merchant names (for reset/cleanup purposes)
 */
export const clearAllCustomMerchantNames = () => {
  try {
    localStorage.removeItem(CUSTOM_MERCHANT_NAMES_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear custom merchant names:', error);
    return false;
  }
};

/**
 * Get suggestions for common merchant name improvements
 * @param {string} rawMerchant - Raw merchant name
 * @returns {array} - Array of suggested improvements
 */
export const getMerchantNameSuggestions = (rawMerchant) => {
  const suggestions = [];
  const lower = rawMerchant.toLowerCase();
  
  // Common merchant name mappings
  const commonMappings = {
    'wal-mart': 'Walmart',
    'walmart': 'Walmart',
    'walmart supercenter': 'Walmart',
    'target': 'Target',
    'amazon': 'Amazon',
    'circle k': 'Circle K',
    'mcdonald': "McDonald's",
    'mcdonalds': "McDonald's",
    'burger king': 'Burger King',
    'starbucks': 'Starbucks',
    'shell': 'Shell',
    'exxon': 'ExxonMobil',
    'bp': 'BP',
    'chevron': 'Chevron',
    'publix': 'Publix',
    'kroger': 'Kroger',
    'harris teeter': 'Harris Teeter',
    'food lion': 'Food Lion'
  };
  
  // Find exact matches first
  for (const [pattern, suggestion] of Object.entries(commonMappings)) {
    if (lower.includes(pattern)) {
      suggestions.push(suggestion);
    }
  }
  
  // If no exact matches, suggest a cleaned up version
  if (suggestions.length === 0) {
    const cleaned = rawMerchant
      .replace(/[^a-zA-Z0-9\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (cleaned !== rawMerchant) {
      suggestions.push(cleaned);
    }
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
};
