import React, { useState, useEffect } from "react";
import {
  setCustomMerchantName,
  getMerchantNameSuggestions,
  getAllCustomMerchantNames,
} from "../utils/customMerchantNames";
import { cleanMerchantName } from "../utils/dataCleaning";
import styles from "./InlineMerchantEditor.module.css";

const InlineMerchantEditor = ({
  rawMerchant,
  location,
  currentName,
  onUpdate,
  onCancel,
  existingMerchants: propExistingMerchants,
}) => {
  const [customName, setCustomName] = useState(currentName);
  const [suggestions] = useState(() => getMerchantNameSuggestions(rawMerchant));
  const [showExistingMerchants, setShowExistingMerchants] = useState(false);
  const [existingMerchants, setExistingMerchants] = useState(
    () => propExistingMerchants || getAllCustomMerchantNames()
  );

  useEffect(() => {
    // Refresh existing merchants when component mounts or when prop changes
    setExistingMerchants(propExistingMerchants || getAllCustomMerchantNames());
  }, [propExistingMerchants]);

  const handleSave = () => {
    if (customName.trim() && customName.trim() !== currentName) {
      // Only save if it's different from the current cleaned name
      const cleanedName = cleanMerchantName(rawMerchant, location);
      if (customName.trim() !== cleanedName) {
        setCustomMerchantName(rawMerchant, location, customName.trim());
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
    </div>
  );
};

export default InlineMerchantEditor;
