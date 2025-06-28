import React, { useState } from "react";
import {
  setCustomMerchantName,
  getMerchantNameSuggestions,
} from "../utils/customMerchantNames";
import styles from "./MerchantSuggestion.module.css";

const MerchantSuggestion = ({ rawMerchant, location, onAccept, onDismiss }) => {
  const [suggestions] = useState(() => getMerchantNameSuggestions(rawMerchant));
  const [customName, setCustomName] = useState("");

  const handleAcceptSuggestion = (suggestion) => {
    setCustomMerchantName(rawMerchant, location, suggestion);
    onAccept(suggestion);
  };

  const handleSaveCustom = () => {
    if (customName.trim()) {
      setCustomMerchantName(rawMerchant, location, customName.trim());
      onAccept(customName.trim());
    }
  };

  if (suggestions.length === 0 && !rawMerchant.includes(" ")) {
    return null; // Don't show for simple merchant names
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>💡</span>
        <span className={styles.title}>Merchant Name Suggestion</span>
        <button onClick={onDismiss} className={styles.dismissButton}>
          ×
        </button>
      </div>

      <div className={styles.info}>
        Raw: <code>{rawMerchant}</code>
        {location && <span> • {location}</span>}
      </div>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsLabel}>Suggested names:</div>
          <div className={styles.suggestionButtons}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAcceptSuggestion(suggestion)}
                className={styles.suggestionButton}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.customSection}>
        <div className={styles.customLabel}>Or enter custom name:</div>
        <div className={styles.customInput}>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g., Walmart, Circle K"
            className={styles.input}
            onKeyPress={(e) => e.key === "Enter" && handleSaveCustom()}
          />
          <button
            onClick={handleSaveCustom}
            disabled={!customName.trim()}
            className={styles.saveButton}
          >
            Save
          </button>
        </div>
      </div>

      <div className={styles.note}>
        This will be remembered for future imports from this merchant.
      </div>
    </div>
  );
};

export default MerchantSuggestion;
