/**
 * Enhanced transaction utilities for smart merchant and category management
 */

import { normalizeMerchantKey } from './customMerchantNames';

/**
 * Find all transactions that match the same raw merchant data
 * @param {Array} transactions - Array of all transactions
 * @param {Object} targetTransaction - The reference transaction to match against
 * @returns {Array} - Array of matching transactions with their indices
 */
export const findMatchingTransactions = (transactions, targetTransaction) => {
  if (!transactions || !targetTransaction) return [];

  const targetKey = normalizeMerchantKey(
    targetTransaction.rawMerchant || targetTransaction.original?.merchant || targetTransaction.merchant,
    targetTransaction.location || targetTransaction.proposed?.location || ''
  );

  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ transaction }) => {
      const transactionKey = normalizeMerchantKey(
        transaction.rawMerchant || transaction.original?.merchant || transaction.merchant,
        transaction.location || transaction.proposed?.location || ''
      );
      return transactionKey === targetKey;
    });
};

/**
 * Get count of matching transactions for display purposes
 * @param {Array} transactions - Array of all transactions
 * @param {Object} targetTransaction - The reference transaction to match against
 * @returns {number} - Count of matching transactions
 */
export const getMatchingTransactionCount = (transactions, targetTransaction) => {
  return findMatchingTransactions(transactions, targetTransaction).length;
};

/**
 * Apply categorization defaults to multiple transactions
 * @param {Array} transactions - Array of all transactions
 * @param {Array} targetIndices - Indices of transactions to update
 * @param {Object} categoryData - Category data to apply
 * @param {string} categoryData.category - Category to apply
 * @param {string} categoryData.subCategory - Subcategory to apply
 * @param {string} categoryData.notes - Notes to apply
 * @returns {Array} - Updated transactions array
 */
export const applyCategorizationToTransactions = (
  transactions,
  targetIndices,
  categoryData
) => {
  const { category, subCategory, notes } = categoryData;
  
  if (!transactions || targetIndices.length === 0) return transactions;

  const updatedTransactions = [...transactions];
  
  targetIndices.forEach(index => {
    if (index >= 0 && index < updatedTransactions.length) {
      updatedTransactions[index] = {
        ...updatedTransactions[index],
        category: category || updatedTransactions[index].category,
        subCategory: subCategory || updatedTransactions[index].subCategory,
        notes: notes || updatedTransactions[index].notes,
      };
    }
  });

  return updatedTransactions;
};

/**
 * Apply custom merchant name to multiple transactions
 * @param {Array} transactions - Array of all transactions
 * @param {Array} targetIndices - Indices of transactions to update
 * @param {string} customMerchantName - Custom merchant name to apply
 * @returns {Array} - Updated transactions array
 */
export const applyMerchantNameToTransactions = (
  transactions,
  targetIndices,
  customMerchantName
) => {
  if (!transactions || targetIndices.length === 0 || !customMerchantName) {
    return transactions;
  }

  const updatedTransactions = [...transactions];
  
  targetIndices.forEach(index => {
    if (index >= 0 && index < updatedTransactions.length) {
      updatedTransactions[index] = {
        ...updatedTransactions[index],
        merchant: customMerchantName,
        // Keep the original raw merchant data for future reference
        rawMerchant: updatedTransactions[index].rawMerchant || updatedTransactions[index].merchant,
      };
    }
  });

  return updatedTransactions;
};

/**
 * Get a summary of transactions that would be affected by a bulk operation
 * @param {Array} matchingTransactions - Array of matching transaction objects with indices
 * @returns {Object} - Summary information
 */
export const getBulkOperationSummary = (matchingTransactions) => {
  if (!matchingTransactions || matchingTransactions.length === 0) {
    return {
      count: 0,
      totalAmount: 0,
      dateRange: null,
      preview: []
    };
  }

  const transactions = matchingTransactions.map(item => item.transaction);
  const totalAmount = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  
  const dates = transactions
    .map(tx => new Date(tx.transaction_date || tx.date))
    .filter(date => !isNaN(date))
    .sort((a, b) => a - b);
  
  const dateRange = dates.length > 0 ? {
    earliest: dates[0],
    latest: dates[dates.length - 1]
  } : null;

  // Create a preview of the first few transactions
  const preview = transactions.slice(0, 3).map(tx => ({
    date: tx.transaction_date || tx.date,
    amount: tx.amount,
    merchant: tx.merchant || tx.rawMerchant,
    currentCategory: tx.category,
    currentSubCategory: tx.subCategory
  }));

  return {
    count: matchingTransactions.length,
    totalAmount,
    dateRange,
    preview
  };
};

/**
 * Format currency for display in bulk operation summaries
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrencyForSummary = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absAmount);
  
  return amount < 0 ? `-${formatted}` : formatted;
};

/**
 * Format date range for display in bulk operation summaries
 * @param {Object} dateRange - Date range object with earliest and latest dates
 * @returns {string} - Formatted date range string
 */
export const formatDateRangeForSummary = (dateRange) => {
  if (!dateRange || !dateRange.earliest || !dateRange.latest) return 'No dates';
  
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const earliest = formatDate(dateRange.earliest);
  const latest = formatDate(dateRange.latest);
  
  return earliest === latest ? earliest : `${earliest} - ${latest}`;
};
