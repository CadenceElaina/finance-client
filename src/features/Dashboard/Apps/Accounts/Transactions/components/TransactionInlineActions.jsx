import React, { useState } from 'react';
import { 
  getMatchingTransactionCount,
  findMatchingTransactions,
  applyCategorizationToTransactions,
  applyMerchantNameToTransactions
} from '../utils/bulkTransactionUtils';
import {
  linkRawDataToMerchant,
  getMerchantDefaults,
  getMainDefault,
  setMerchantPreference
} from '../utils/merchantPreferences';
import styles from './TransactionInlineActions.module.css';

const TransactionInlineActions = ({
  transaction,
  allTransactions,
  transactionIndex,
  onTransactionUpdate,
  onBulkUpdate
}) => {
  const [showActions, setShowActions] = useState(false);
  
  // Calculate matching transaction count
  const matchingCount = getMatchingTransactionCount(allTransactions, transaction);
  const hasMatches = matchingCount > 1;
  
  // Get merchant info
  const rawMerchant = transaction.original?.merchant || transaction.rawMerchant;
  const location = transaction.proposed?.location || transaction.location || '';
  const currentMerchant = transaction.proposed?.merchant_name || transaction.merchant;
  const currentCategory = transaction.proposed?.category || transaction.category;
  const currentSubCategory = transaction.proposed?.subCategory || transaction.subCategory;
  const currentNotes = transaction.proposed?.notes || transaction.notes;
  
  // Get merchant defaults
  const merchantDefaults = currentMerchant ? getMerchantDefaults(currentMerchant) : [];
  const mainDefault = currentMerchant ? getMainDefault(currentMerchant) : null;
  
  const handleApplyToMatching = (action, data = {}) => {
    if (!hasMatches) return;
    
    const matchingTransactions = findMatchingTransactions(allTransactions, transaction);
    const indices = matchingTransactions.map(item => item.index);
    
    if (action === 'merchant') {
      const updatedTransactions = applyMerchantNameToTransactions(
        allTransactions, 
        indices, 
        data.merchantName
      );
      onBulkUpdate(updatedTransactions);
      
      // Also link raw data to merchant with auto-apply option
      linkRawDataToMerchant(rawMerchant, location, data.merchantName, data.autoApply || false);
      
    } else if (action === 'category') {
      const updatedTransactions = applyCategorizationToTransactions(
        allTransactions,
        indices,
        data
      );
      onBulkUpdate(updatedTransactions);
      
      // Optionally save as merchant default
      if (data.saveAsDefault && currentMerchant) {
        setMerchantPreference(currentMerchant, {
          name: data.defaultName || `Default ${Date.now()}`,
          defaultCategory: data.category,
          defaultSubCategory: data.subCategory,
          defaultNotes: data.notes,
          isMainDefault: data.setAsMain || false
        });
      }
    }
    
    // Show success feedback
    console.log(`Applied ${action} to ${matchingCount} transactions`);
  };
  
  const handleUseMerchantDefault = (defaultData) => {
    // Apply to current transaction
    onTransactionUpdate(transaction.id || transactionIndex, {
      category: defaultData.defaultCategory,
      subCategory: defaultData.defaultSubCategory,
      notes: defaultData.defaultNotes
    });
  };
  
  const handleUseMerchantDefaultForAll = (defaultData) => {
    handleApplyToMatching('category', {
      category: defaultData.defaultCategory,
      subCategory: defaultData.defaultSubCategory,
      notes: defaultData.defaultNotes
    });
  };
  
  const handleLinkMerchantToAll = (merchantName, autoApply = false) => {
    handleApplyToMatching('merchant', {
      merchantName,
      autoApply
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.infoBar}>
        {hasMatches && (
          <span className={styles.matchCount}>
            💡 {matchingCount - 1} similar transactions found
          </span>
        )}
        <button 
          className={styles.toggleButton}
          onClick={() => setShowActions(!showActions)}
        >
          {showActions ? '▲ Hide Actions' : '▼ Quick Actions'}
        </button>
      </div>
      
      {showActions && (
        <div className={styles.actionsPanel}>
          
          {/* Merchant Actions */}
          {currentMerchant && (
            <div className={styles.actionGroup}>
              <div className={styles.groupLabel}>Merchant: {currentMerchant}</div>
              
              {hasMatches && (
                <div className={styles.actionRow}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => handleLinkMerchantToAll(currentMerchant, false)}
                  >
                    📋 Apply "{currentMerchant}" to {matchingCount - 1} similar
                  </button>
                  <button 
                    className={styles.actionButtonSecondary}
                    onClick={() => handleLinkMerchantToAll(currentMerchant, true)}
                  >
                    🔗 + Enable auto-apply for future
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Category Actions */}
          {(currentCategory || currentSubCategory) && (
            <div className={styles.actionGroup}>
              <div className={styles.groupLabel}>
                Category: {currentCategory}
                {currentSubCategory && ` > ${currentSubCategory}`}
              </div>
              
              {hasMatches && (
                <div className={styles.actionRow}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => handleApplyToMatching('category', {
                      category: currentCategory,
                      subCategory: currentSubCategory,
                      notes: currentNotes
                    })}
                  >
                    🏷️ Apply category to {matchingCount - 1} similar
                  </button>
                  {currentMerchant && (
                    <button 
                      className={styles.actionButtonSecondary}
                      onClick={() => handleApplyToMatching('category', {
                        category: currentCategory,
                        subCategory: currentSubCategory,
                        notes: currentNotes,
                        saveAsDefault: true,
                        defaultName: `Default ${Date.now()}`,
                        setAsMain: true
                      })}
                    >
                      💾 + Save as {currentMerchant} default
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Merchant Defaults */}
          {merchantDefaults.length > 0 && (
            <div className={styles.actionGroup}>
              <div className={styles.groupLabel}>Saved Defaults for {currentMerchant}</div>
              
              {merchantDefaults.map((defaultData, index) => (
                <div key={index} className={styles.actionRow}>
                  <div className={styles.defaultInfo}>
                    <span className={styles.defaultName}>
                      {defaultData.name}
                      {mainDefault?.name === defaultData.name && (
                        <span className={styles.mainBadge}>MAIN</span>
                      )}
                    </span>
                    <span className={styles.defaultDetails}>
                      {defaultData.defaultCategory}
                      {defaultData.defaultSubCategory && ` > ${defaultData.defaultSubCategory}`}
                    </span>
                  </div>
                  <div className={styles.defaultActions}>
                    <button 
                      className={styles.actionButtonSmall}
                      onClick={() => handleUseMerchantDefault(defaultData)}
                    >
                      Use
                    </button>
                    {hasMatches && (
                      <button 
                        className={styles.actionButtonSmall}
                        onClick={() => handleUseMerchantDefaultForAll(defaultData)}
                      >
                        Use for all {matchingCount - 1}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Quick Links */}
          {hasMatches && (
            <div className={styles.actionGroup}>
              <div className={styles.groupLabel}>Quick Actions</div>
              <div className={styles.actionRow}>
                <button 
                  className={styles.actionButtonQuick}
                  onClick={() => {
                    // Apply current transaction's full state to all matching
                    handleApplyToMatching('merchant', { 
                      merchantName: currentMerchant,
                      autoApply: false 
                    });
                    handleApplyToMatching('category', {
                      category: currentCategory,
                      subCategory: currentSubCategory,
                      notes: currentNotes
                    });
                  }}
                >
                  Apply all to {matchingCount - 1} similar transactions
                </button>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};

export default TransactionInlineActions;
