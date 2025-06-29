/**
 * Smart merchant preferences and auto-application system
 * Handles merchant recognition, default categorization, and auto-application preferences
 */

const MERCHANT_PREFERENCES_KEY = 'merchantPreferences';
const RAW_DATA_MAPPINGS_KEY = 'rawDataMappings';

/**
 * Get stored merchant preferences
 * @returns {object} - Merchant preferences object
 */
export const getMerchantPreferences = () => {
  try {
    const stored = localStorage.getItem(MERCHANT_PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load merchant preferences:', error);
    return {};
  }
};

/**
 * Save merchant preferences
 * @param {object} preferences - Merchant preferences object
 */
export const saveMerchantPreferences = (preferences) => {
  try {
    localStorage.setItem(MERCHANT_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save merchant preferences:', error);
  }
};

/**
 * Get raw data to merchant mappings
 * @returns {object} - Raw data mappings object
 */
export const getRawDataMappings = () => {
  try {
    const stored = localStorage.getItem(RAW_DATA_MAPPINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load raw data mappings:', error);
    return {};
  }
};

/**
 * Save raw data mappings
 * @param {object} mappings - Raw data mappings object
 */
export const saveRawDataMappings = (mappings) => {
  try {
    localStorage.setItem(RAW_DATA_MAPPINGS_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.warn('Failed to save raw data mappings:', error);
  }
};

/**
 * Create or update a merchant preference
 * @param {string} merchantName - The merchant name
 * @param {object} preferences - Merchant preferences
 * @param {string} preferences.defaultCategory - Default category
 * @param {string} preferences.defaultSubCategory - Default subcategory
 * @param {string} preferences.defaultNotes - Default notes
 * @param {boolean} preferences.autoApply - Whether to auto-apply defaults
 * @param {boolean} preferences.isMainDefault - Whether this is the main default
 */
export const setMerchantPreference = (merchantName, preferences) => {
  const allPreferences = getMerchantPreferences();
  
  if (!allPreferences[merchantName]) {
    allPreferences[merchantName] = {
      defaults: [],
      autoApplyMerchant: false,
      mainDefaultName: null
    };
  }

  const merchantPref = allPreferences[merchantName];
  
  // If this is marked as main default, update the main default reference
  if (preferences.isMainDefault) {
    merchantPref.mainDefaultName = preferences.name;
  }
  
  // Update or add the default
  const existingIndex = merchantPref.defaults.findIndex(d => d.name === preferences.name);
  if (existingIndex >= 0) {
    merchantPref.defaults[existingIndex] = {
      ...merchantPref.defaults[existingIndex],
      ...preferences,
      lastUpdated: Date.now()
    };
  } else {
    merchantPref.defaults.push({
      ...preferences,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      usageCount: 0
    });
  }

  saveMerchantPreferences(allPreferences);
};

/**
 * Link raw data to a merchant name
 * @param {string} rawMerchant - Original merchant name from CSV
 * @param {string} location - Location information
 * @param {string} merchantName - Clean merchant name to map to
 * @param {boolean} autoApply - Whether to auto-apply this mapping to future transactions
 */
export const linkRawDataToMerchant = (rawMerchant, location, merchantName, autoApply = false) => {
  const mappings = getRawDataMappings();
  const key = normalizeMerchantKey(rawMerchant, location);
  
  mappings[key] = {
    rawMerchant,
    location: location || '',
    merchantName,
    autoApply,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    usageCount: 0
  };

  saveRawDataMappings(mappings);
  
  // Also update merchant preferences for auto-application
  if (autoApply) {
    const preferences = getMerchantPreferences();
    if (!preferences[merchantName]) {
      preferences[merchantName] = {
        defaults: [],
        autoApplyMerchant: true,
        mainDefaultName: null
      };
    } else {
      preferences[merchantName].autoApplyMerchant = true;
    }
    saveMerchantPreferences(preferences);
  }
};

/**
 * Get merchant name from raw data
 * @param {string} rawMerchant - Original merchant name from CSV
 * @param {string} location - Location information
 * @returns {string|null} - Mapped merchant name or null
 */
export const getMerchantFromRawData = (rawMerchant, location) => {
  const mappings = getRawDataMappings();
  const key = normalizeMerchantKey(rawMerchant, location);
  
  const mapping = mappings[key];
  if (mapping) {
    // Update usage statistics
    mapping.lastUsed = Date.now();
    mapping.usageCount = (mapping.usageCount || 0) + 1;
    saveRawDataMappings(mappings);
    
    return mapping.merchantName;
  }
  
  return null;
};

/**
 * Get auto-apply preference for a merchant
 * @param {string} merchantName - The merchant name
 * @returns {boolean} - Whether merchant should be auto-applied
 */
export const shouldAutoApplyMerchant = (merchantName) => {
  const preferences = getMerchantPreferences();
  return preferences[merchantName]?.autoApplyMerchant || false;
};

/**
 * Get main default for a merchant
 * @param {string} merchantName - The merchant name
 * @returns {object|null} - Main default or null
 */
export const getMainDefault = (merchantName) => {
  const preferences = getMerchantPreferences();
  const merchantPref = preferences[merchantName];
  
  if (!merchantPref || !merchantPref.mainDefaultName) return null;
  
  return merchantPref.defaults.find(d => d.name === merchantPref.mainDefaultName) || null;
};

/**
 * Get all defaults for a merchant
 * @param {string} merchantName - The merchant name
 * @returns {Array} - Array of defaults
 */
export const getMerchantDefaults = (merchantName) => {
  const preferences = getMerchantPreferences();
  return preferences[merchantName]?.defaults || [];
};

/**
 * Process transaction with smart merchant recognition and auto-application
 * @param {object} transaction - Transaction to process
 * @param {boolean} applyDefaults - Whether to apply defaults
 * @returns {object} - Processed transaction
 */
export const processTransactionWithSmartRecognition = (transaction, applyDefaults = true) => {
  const rawMerchant = transaction.original?.merchant || transaction.rawMerchant;
  const location = transaction.proposed?.location || transaction.location || '';
  
  // First, try to get merchant from raw data mapping
  const mappedMerchant = getMerchantFromRawData(rawMerchant, location);
  
  let processedTransaction = { ...transaction };
  
  if (mappedMerchant) {
    // Update merchant name
    if (processedTransaction.proposed) {
      processedTransaction.proposed.merchant_name = mappedMerchant;
    } else {
      processedTransaction.merchant = mappedMerchant;
    }
    
    // Apply defaults if requested and merchant has auto-apply enabled
    if (applyDefaults && shouldAutoApplyMerchant(mappedMerchant)) {
      const mainDefault = getMainDefault(mappedMerchant);
      if (mainDefault) {
        if (processedTransaction.proposed) {
          processedTransaction.proposed.category = mainDefault.defaultCategory;
          processedTransaction.proposed.subCategory = mainDefault.defaultSubCategory;
          processedTransaction.proposed.notes = mainDefault.defaultNotes;
          processedTransaction.proposed.isAutoApplied = true;
        } else {
          processedTransaction.category = mainDefault.defaultCategory;
          processedTransaction.subCategory = mainDefault.defaultSubCategory;
          processedTransaction.notes = mainDefault.defaultNotes;
          processedTransaction.isAutoApplied = true;
        }
      }
    }
  }
  
  return processedTransaction;
};

/**
 * Reset all merchant preferences
 */
export const resetAllMerchantPreferences = () => {
  localStorage.removeItem(MERCHANT_PREFERENCES_KEY);
  localStorage.removeItem(RAW_DATA_MAPPINGS_KEY);
};

/**
 * Reset preferences for a specific merchant
 * @param {string} merchantName - The merchant name
 */
export const resetMerchantPreferences = (merchantName) => {
  const preferences = getMerchantPreferences();
  delete preferences[merchantName];
  saveMerchantPreferences(preferences);
  
  // Also remove any raw data mappings for this merchant
  const mappings = getRawDataMappings();
  const updatedMappings = {};
  
  Object.keys(mappings).forEach(key => {
    if (mappings[key].merchantName !== merchantName) {
      updatedMappings[key] = mappings[key];
    }
  });
  
  saveRawDataMappings(updatedMappings);
};

/**
 * Get all merchants with preferences
 * @returns {Array} - Array of merchant names with preferences
 */
export const getAllMerchantsWithPreferences = () => {
  const preferences = getMerchantPreferences();
  return Object.keys(preferences);
};

/**
 * Get statistics for merchant preferences system
 * @returns {object} - Statistics object
 */
export const getMerchantPreferencesStats = () => {
  const preferences = getMerchantPreferences();
  const mappings = getRawDataMappings();
  
  const totalMerchants = Object.keys(preferences).length;
  const totalMappings = Object.keys(mappings).length;
  const autoApplyMerchants = Object.values(preferences).filter(p => p.autoApplyMerchant).length;
  const totalDefaults = Object.values(preferences).reduce((sum, p) => sum + p.defaults.length, 0);
  
  return {
    totalMerchants,
    totalMappings,
    autoApplyMerchants,
    totalDefaults
  };
};

// Helper function to normalize merchant keys (imported from customMerchantNames)
const normalizeMerchantKey = (rawMerchant, location = '') => {
  const combined = `${rawMerchant} ${location}`.toLowerCase();
  return combined
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};
