/**
 * Merchant history and learning system for transaction categorization
 * Enhanced to support multiple named defaults per merchant
 */

const MERCHANT_HISTORY_KEY = 'merchantCategoryHistory';
const MERCHANT_DEFAULTS_KEY = 'merchantNamedDefaults';

/**
 * Get stored merchant history from localStorage
 * @returns {object} - Merchant history object
 */
export const getMerchantHistory = () => {
  try {
    const stored = localStorage.getItem(MERCHANT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load merchant history:', error);
    return {};
  }
};

/**
 * Save merchant history to localStorage
 * @param {object} history - Merchant history object
 */
export const saveMerchantHistory = (history) => {
  try {
    localStorage.setItem(MERCHANT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save merchant history:', error);
  }
};

/**
 * Normalize merchant name for history tracking
 * @param {string} merchantName - The merchant name
 * @returns {string} - Normalized merchant name
 */
export const normalizeMerchantName = (merchantName) => {
  return merchantName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Record a merchant's category choice
 * @param {string} merchantName - The merchant name
 * @param {string} category - The selected category
 * @param {string} subCategory - The selected subcategory
 * @param {string} accountType - The account type (for context)
 * @param {string} transactionType - The transaction type (income/expense) to validate subcategory requirement
 */
export const recordMerchantChoice = (merchantName, category, subCategory, accountType = '', transactionType = 'expense') => {
  // Validate inputs before recording
  if (!merchantName || !merchantName.trim()) {
    console.warn('Cannot record merchant choice: merchant name is required');
    return false;
  }
  
  if (!category || category.trim() === '' || category === 'Select Category') {
    console.warn('Cannot record merchant choice: valid category is required');
    return false;
  }
  
  // For expense transactions, subcategory is required
  if (transactionType === 'expense' && (!subCategory || subCategory.trim() === '' || subCategory === 'Select Sub-Category')) {
    console.warn('Cannot record merchant choice: subcategory is required for expense transactions');
    return false;
  }

  const history = getMerchantHistory();
  const normalizedName = normalizeMerchantName(merchantName);
  
  if (!history[normalizedName]) {
    history[normalizedName] = {
      originalName: merchantName,
      choices: [],
      mostCommon: null,
      confidence: 0,
    };
  }

  const merchant = history[normalizedName];
  
  // Add this choice
  merchant.choices.push({
    category: category.trim(),
    subCategory: (subCategory || '').trim(),
    accountType,
    transactionType,
    timestamp: Date.now(),
  });

  // Keep only the last 10 choices to prevent unlimited growth
  if (merchant.choices.length > 10) {
    merchant.choices = merchant.choices.slice(-10);
  }

  // Calculate most common choice
  const choiceCounts = {};
  merchant.choices.forEach(choice => {
    const key = `${choice.category}|${choice.subCategory}`;
    choiceCounts[key] = (choiceCounts[key] || 0) + 1;
  });

  // Find the most common choice
  let maxCount = 0;
  let mostCommonKey = null;
  Object.entries(choiceCounts).forEach(([key, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonKey = key;
    }
  });

  if (mostCommonKey) {
    const [category, subCategory] = mostCommonKey.split('|');
    merchant.mostCommon = { category, subCategory };
    merchant.confidence = maxCount / merchant.choices.length;
  }

  saveMerchantHistory(history);
  return true;
};

/**
 * Get the preferred category for a merchant based on history
 * @param {string} merchantName - The merchant name
 * @returns {object|null} - Preferred category or null
 */
export const getMerchantPreference = (merchantName) => {
  const history = getMerchantHistory();
  const normalizedName = normalizeMerchantName(merchantName);
  
  const merchant = history[normalizedName];
  if (!merchant || !merchant.mostCommon || merchant.confidence < 0.6) {
    return null;
  }

  return {
    parent: merchant.mostCommon.category,
    sub: merchant.mostCommon.subCategory,
    confidence: merchant.confidence,
    source: 'merchant_history',
    usageCount: merchant.choices.length,
  };
};

/**
 * Check if a merchant has been seen before
 * @param {string} merchantName - The merchant name
 * @returns {boolean} - True if merchant has history
 */
export const isKnownMerchant = (merchantName) => {
  const history = getMerchantHistory();
  const normalizedName = normalizeMerchantName(merchantName);
  return !!history[normalizedName];
};

/**
 * Get all known merchants for debugging/admin purposes
 * @returns {array} - Array of merchant objects
 */
export const getAllKnownMerchants = () => {
  const history = getMerchantHistory();
  return Object.entries(history).map(([normalizedName, data]) => ({
    normalizedName,
    ...data,
  }));
};

/**
 * Clear merchant history (for privacy/reset)
 */
export const clearMerchantHistory = () => {
  localStorage.removeItem(MERCHANT_HISTORY_KEY);
};

/**
 * Remove a merchant's learned preferences
 * @param {string} merchantName - The merchant name
 */
export const removeMerchantChoice = (merchantName) => {
  const history = getMerchantHistory();
  const normalizedName = normalizeMerchantName(merchantName);
  
  if (history[normalizedName]) {
    delete history[normalizedName];
    saveMerchantHistory(history);
  }
};

/**
 * Validate if a merchant choice is valid for recording
 * @param {string} merchantName - The merchant name
 * @param {string} category - The selected category
 * @param {string} subCategory - The selected subcategory
 * @param {string} transactionType - The transaction type (income/expense)
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidMerchantChoice = (merchantName, category, subCategory, transactionType = 'expense') => {
  // Merchant name is required
  if (!merchantName || !merchantName.trim()) {
    return false;
  }
  
  // Category is required and cannot be placeholder
  if (!category || category.trim() === '' || category === 'Select Category') {
    return false;
  }
  
  // For expense transactions, subcategory is required
  if (transactionType === 'expense' && (!subCategory || subCategory.trim() === '' || subCategory === 'Select Sub-Category')) {
    return false;
  }
  
  return true;
};

/**
 * Get stored named defaults from localStorage
 * @returns {object} - Named defaults object
 */
export const getNamedDefaults = () => {
  try {
    const stored = localStorage.getItem(MERCHANT_DEFAULTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load named defaults:', error);
    return {};
  }
};

/**
 * Save named defaults to localStorage
 * @param {object} defaults - Named defaults object
 */
export const saveNamedDefaults = (defaults) => {
  try {
    localStorage.setItem(MERCHANT_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.warn('Failed to save named defaults:', error);
  }
};

/**
 * Create or update a named default for a merchant
 * @param {string} merchantName - The merchant name
 * @param {string} defaultName - The name for this default (e.g., "Gas", "Convenience Store")
 * @param {string} category - The category
 * @param {string} subCategory - The subcategory
 * @param {string} notes - Optional notes
 * @param {string} transactionType - The transaction type (income/expense)
 * @returns {boolean} - Success status
 */
export const createNamedDefault = (merchantName, defaultName, category, subCategory, notes = '', transactionType = 'expense') => {
  // Validate inputs
  if (!merchantName || !merchantName.trim()) {
    console.warn('Cannot create named default: merchant name is required');
    return false;
  }
  
  if (!defaultName || !defaultName.trim()) {
    console.warn('Cannot create named default: default name is required');
    return false;
  }
  
  if (!category || category.trim() === '' || category === 'Select Category') {
    console.warn('Cannot create named default: valid category is required');
    return false;
  }
  
  // For expense transactions, subcategory is required
  if (transactionType === 'expense' && (!subCategory || subCategory.trim() === '' || subCategory === 'Select Sub-Category')) {
    console.warn('Cannot create named default: subcategory is required for expense transactions');
    return false;
  }

  const defaults = getNamedDefaults();
  const normalizedMerchant = normalizeMerchantName(merchantName);
  
  if (!defaults[normalizedMerchant]) {
    defaults[normalizedMerchant] = {
      originalName: merchantName,
      defaults: {}
    };
  }

  // Create the named default
  defaults[normalizedMerchant].defaults[defaultName.trim()] = {
    category: category.trim(),
    subCategory: (subCategory || '').trim(),
    notes: (notes || '').trim(),
    transactionType,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    usageCount: 0
  };

  saveNamedDefaults(defaults);
  return true;
};

/**
 * Get all named defaults for a merchant
 * @param {string} merchantName - The merchant name
 * @returns {array} - Array of named defaults
 */
export const getMerchantNamedDefaults = (merchantName) => {
  const defaults = getNamedDefaults();
  const normalizedName = normalizeMerchantName(merchantName);
  
  const merchant = defaults[normalizedName];
  if (!merchant || !merchant.defaults) {
    return [];
  }

  return Object.entries(merchant.defaults).map(([name, data]) => ({
    name,
    ...data
  }));
};

/**
 * Apply a named default (increments usage count and updates lastUsed)
 * @param {string} merchantName - The merchant name
 * @param {string} defaultName - The default name to use
 * @returns {object|null} - The default data or null if not found
 */
export const applyNamedDefault = (merchantName, defaultName) => {
  const defaults = getNamedDefaults();
  const normalizedName = normalizeMerchantName(merchantName);
  
  const merchant = defaults[normalizedName];
  if (!merchant || !merchant.defaults || !merchant.defaults[defaultName]) {
    return null;
  }

  const defaultData = merchant.defaults[defaultName];
  
  // Update usage statistics
  defaultData.lastUsed = Date.now();
  defaultData.usageCount = (defaultData.usageCount || 0) + 1;
  
  saveNamedDefaults(defaults);
  
  return {
    name: defaultName,
    ...defaultData
  };
};

/**
 * Remove a named default
 * @param {string} merchantName - The merchant name
 * @param {string} defaultName - The default name to remove
 * @returns {boolean} - Success status
 */
export const removeNamedDefault = (merchantName, defaultName) => {
  const defaults = getNamedDefaults();
  const normalizedName = normalizeMerchantName(merchantName);
  
  const merchant = defaults[normalizedName];
  if (!merchant || !merchant.defaults || !merchant.defaults[defaultName]) {
    return false;
  }

  delete merchant.defaults[defaultName];
  
  // Clean up empty merchant entries
  if (Object.keys(merchant.defaults).length === 0) {
    delete defaults[normalizedName];
  }
  
  saveNamedDefaults(defaults);
  return true;
};

/**
 * Get all merchants with named defaults
 * @returns {array} - Array of merchants with their defaults
 */
export const getAllMerchantsWithDefaults = () => {
  const defaults = getNamedDefaults();
  return Object.entries(defaults).map(([normalizedName, data]) => ({
    normalizedName,
    originalName: data.originalName,
    defaults: Object.entries(data.defaults || {}).map(([name, defaultData]) => ({
      name,
      ...defaultData
    }))
  }));
};

/**
 * Clear all named defaults
 */
export const clearNamedDefaults = () => {
  localStorage.removeItem(MERCHANT_DEFAULTS_KEY);
};

/**
 * Clear all merchant history (for reset/cleanup purposes)
 */
export const clearAllMerchantHistory = () => {
  try {
    localStorage.removeItem(MERCHANT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear merchant history:', error);
    return false;
  }
};

/**
 * Clear all named defaults (for reset/cleanup purposes)
 */
export const clearAllNamedDefaults = () => {
  try {
    localStorage.removeItem(MERCHANT_DEFAULTS_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear named defaults:', error);
    return false;
  }
};

/**
 * Get the main default for a merchant (looks for "Main Default" first, then most used)
 * @param {string} merchantName - The merchant name
 * @returns {object|null} - The main default or null if none found
 */
export const getMainNamedDefault = (merchantName) => {
  const defaults = getMerchantNamedDefaults(merchantName);
  
  if (defaults.length === 0) {
    return null;
  }

  // First, look for a default named "Main Default"
  const mainDefault = defaults.find(d => d.name === "Main Default");
  if (mainDefault) {
    return mainDefault;
  }

  // Fall back to the most used default
  const mostUsed = defaults.reduce((prev, current) => {
    return (current.usageCount || 0) > (prev.usageCount || 0) ? current : prev;
  });

  return mostUsed;
};

/**
 * Update an existing named default
 */
export const updateNamedDefault = (
  originalMerchantName,
  originalDefaultName,
  newDefaultName,
  category,
  subCategory = "",
  notes = "",
  transactionType = "expense",
  isRecurring = false
) => {
  const defaults = getNamedDefaults();
  const normalizedName = normalizeMerchantName(originalMerchantName);
  
  if (defaults[normalizedName] && defaults[normalizedName].defaults[originalDefaultName]) {
    // If the name is changing, we need to delete the old and create the new
    if (originalDefaultName !== newDefaultName) {
      delete defaults[normalizedName].defaults[originalDefaultName];
    }
    
    defaults[normalizedName].defaults[newDefaultName] = {
      name: newDefaultName,
      category,
      subCategory,
      notes,
      transactionType,
      isRecurring,
      createdAt: defaults[normalizedName].defaults[originalDefaultName]?.createdAt || Date.now(),
      lastUpdated: Date.now(),
      usageCount: defaults[normalizedName].defaults[originalDefaultName]?.usageCount || 0
    };
    
    localStorage.setItem(MERCHANT_DEFAULTS_KEY, JSON.stringify(defaults));
  }
};

/**
 * Delete a named default
 */
export const deleteNamedDefault = (merchantName, defaultName) => {
  const defaults = getNamedDefaults();
  const normalizedName = normalizeMerchantName(merchantName);
  
  if (defaults[normalizedName] && defaults[normalizedName].defaults[defaultName]) {
    delete defaults[normalizedName].defaults[defaultName];
    
    // If no defaults left, remove the merchant entry
    if (Object.keys(defaults[normalizedName].defaults).length === 0) {
      delete defaults[normalizedName];
    }
    
    localStorage.setItem(MERCHANT_DEFAULTS_KEY, JSON.stringify(defaults));
  }
};

/**
 * Set the main named default for a merchant
 */
export const setMainNamedDefault = (merchantName, defaultName) => {
  const defaults = getNamedDefaults();
  const normalizedName = normalizeMerchantName(merchantName);
  
  if (defaults[normalizedName] && defaults[normalizedName].defaults[defaultName]) {
    defaults[normalizedName].mainDefaultName = defaultName;
    localStorage.setItem(MERCHANT_DEFAULTS_KEY, JSON.stringify(defaults));
  }
};
