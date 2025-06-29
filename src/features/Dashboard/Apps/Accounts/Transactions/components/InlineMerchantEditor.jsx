import React, { useState, useEffect } from "react";
import {
  setCustomMerchantName,
  getMerchantNameSuggestions,
  getAllCustomMerchantNames,
} from "../utils/customMerchantNames";
import { cleanMerchantName } from "../utils/dataCleaning";
import { createNamedDefault } from "../utils/merchantHistory";
import {
  findMatchingTransactions,
  applyMerchantNameToTransactions,
  getMatchingTransactionCount,
} from "../utils/bulkTransactionUtils";
import { linkRawDataToMerchant } from "../utils/merchantPreferences";
import styles from "./InlineMerchantEditor.module.css";

const InlineMerchantEditor = ({
  rawMerchant,
  location,
  currentName,
  onUpdate,
  onCancel,
  existingMerchants: propExistingMerchants,
  // New props for bulk operations
  allTransactions = [],
  currentTransactionIndex = -1,
  onBulkUpdate = null,
  onMerchantPreferenceUpdate = null, // New callback for merchant manager updates
  // New props for creating main default during import
  currentTransaction = null,
}) => {
  const [customName, setCustomName] = useState(currentName);
  const [suggestions] = useState(() => getMerchantNameSuggestions(rawMerchant));
  const [showExistingMerchants, setShowExistingMerchants] = useState(false);
  const [existingMerchants, setExistingMerchants] = useState(
    () => propExistingMerchants || getAllCustomMerchantNames()
  );

  // Show bulk options state
  const [matchingCount, setMatchingCount] = useState(0);

  useEffect(() => {
    // Refresh existing merchants when component mounts or when prop changes
    setExistingMerchants(propExistingMerchants || getAllCustomMerchantNames());
  }, [propExistingMerchants]);

  useEffect(() => {
    // Calculate matching transactions when relevant data changes
    if (allTransactions.length > 0 && currentTransactionIndex >= 0) {
      const currentTransaction = allTransactions[currentTransactionIndex];
      const count = getMatchingTransactionCount(
        allTransactions,
        currentTransaction
      );
      setMatchingCount(count);
    }
  }, [allTransactions, currentTransactionIndex]);

  const handleSave = () => {
    if (customName.trim() && customName.trim() !== currentName) {
      // Save the custom merchant name
      const cleanedName = cleanMerchantName(rawMerchant, location);
      if (customName.trim() !== cleanedName) {
        setCustomMerchantName(rawMerchant, location, customName.trim());
      }

      // Create raw data mapping for smart recognition
      linkRawDataToMerchant(rawMerchant, location, customName.trim(), true); // auto-apply enabled

      // Create main default if we have current transaction details
      if (currentTransaction && currentTransaction.proposed) {
        const proposed = currentTransaction.proposed;
        if (proposed.type && proposed.category) {
          createNamedDefault(
            customName.trim(),
            "Main Default",
            proposed.category,
            proposed.subCategory || "",
            proposed.notes || "",
            proposed.type
          );
        }
      }

      // Trigger merchant preference update callback
      if (onMerchantPreferenceUpdate) {
        onMerchantPreferenceUpdate();
      }

      // Check if we should apply to matching transactions
      if (
        allTransactions.length > 0 &&
        currentTransactionIndex >= 0 &&
        onBulkUpdate &&
        matchingCount > 1
      ) {
        const currentTransaction = allTransactions[currentTransactionIndex];
        const matchingTransactions = findMatchingTransactions(
          allTransactions,
          currentTransaction
        );
        const indices = matchingTransactions.map((item) => item.index);

        // Apply merchant name to all matching transactions
        const updatedTransactions = applyMerchantNameToTransactions(
          allTransactions,
          indices,
          customName.trim()
        );

        onBulkUpdate(updatedTransactions);
      }

      onUpdate(customName.trim());
    } else {
      onCancel();
    }
  };

  const handleUseSuggestion = (suggestion) => {
    setCustomName(suggestion);
  };

  const handleUseExistingMerchant = (merchant) => {
    setCustomName(merchant.customName);
    setShowExistingMerchants(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className={styles.container}>
      {/* Show bulk operation hint if multiple transactions available */}
      {allTransactions.length > 0 && onBulkUpdate && (
        <div className={styles.bulkOperationHint}>
          ⚡ You'll have the option to apply this name to all similar
          transactions
        </div>
      )}

      <div className={styles.inputSection}>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={handleKeyPress}
          className={styles.nameInput}
          placeholder="Enter merchant name"
          autoFocus
        />
        <div className={styles.actions}>
          <button onClick={handleSave} className={styles.saveButton}>
            ✓
          </button>
          <button onClick={onCancel} className={styles.cancelButton}>
            ×
          </button>
          {existingMerchants.length > 0 && (
            <button
              onClick={() => setShowExistingMerchants(!showExistingMerchants)}
              className={styles.folderButton}
              title="Select from existing merchants"
            >
              📁
            </button>
          )}
        </div>
      </div>

      {showExistingMerchants && existingMerchants.length > 0 && (
        <div className={styles.existingMerchants}>
          <div className={styles.existingMerchantsLabel}>
            Existing Merchants:
          </div>
          {existingMerchants.map((merchant) => (
            <button
              key={merchant.key}
              onClick={() => handleUseExistingMerchant(merchant)}
              className={styles.existingMerchantButton}
            >
              {merchant.customName}
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsLabel}>Suggestions:</div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleUseSuggestion(suggestion)}
              className={styles.suggestionButton}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className={styles.originalInfo}>
        Original: {rawMerchant}
        {location && ` (${location})`}
      </div>

      {matchingCount > 1 && (
        <div className={styles.bulkActionInfo}>
          <small>
            💡 This will also apply "{customName}" to {matchingCount - 1} other
            similar transactions
          </small>
        </div>
      )}
    </div>
  );
};

export default InlineMerchantEditor;
