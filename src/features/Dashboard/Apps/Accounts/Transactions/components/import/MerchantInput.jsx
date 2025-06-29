import React, { useState, useEffect } from "react";
import styles from "./MerchantInput.module.css";
import {
  getAllCustomMerchantNames,
  setCustomMerchantName,
} from "../../utils/customMerchantNames";
import { getMerchantNameSuggestions } from "../../utils/customMerchantNames";
import { getMainDefault } from "../../utils/merchantPreferences";
import { createNamedDefault } from "../../utils/merchantHistory";
import InlineMerchantEditor from "../InlineMerchantEditor";

const MerchantInput = ({
  value,
  onChange,
  onSelect,
  transaction,
  allTransactions = [],
  currentTransactionIndex = -1,
  onBulkUpdate = null,
  onMerchantPreferenceUpdate = null,
  onApplyDefault = null,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);
  const [showMerchantEditor, setShowMerchantEditor] = useState(false);
  const [showMerchantPicker, setShowMerchantPicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const merchants = getAllCustomMerchantNames();
    setAllMerchants(Object.values(merchants));
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Generate initial suggestions but don't show them until input is focused
  useEffect(() => {
    if (transaction?.original?.merchant) {
      const autoSuggestions = getMerchantNameSuggestions(
        transaction.original.merchant
      );
      setSuggestions(autoSuggestions.slice(0, 3)); // Prepare top 3 suggestions
    }
  }, [transaction]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text);
    setShowSuggestions(true); // Show suggestions when typing

    if (text.length > 1) {
      const filteredSuggestions = allMerchants.filter((merchant) =>
        merchant.customName.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5));
    } else if (transaction?.original?.merchant) {
      // Fall back to auto-suggestions
      const autoSuggestions = getMerchantNameSuggestions(
        transaction.original.merchant
      );
      setSuggestions(autoSuggestions.slice(0, 3));
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);

    // If input is empty and we have auto-suggestions, show them
    if (!inputValue && transaction?.original?.merchant) {
      const autoSuggestions = getMerchantNameSuggestions(
        transaction.original.merchant
      );
      setSuggestions(autoSuggestions.slice(0, 3));
    }
  };

  const handleInputBlur = () => {
    // Use setTimeout to allow click events on suggestions to fire first
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleSuggestionClick = (merchant) => {
    const merchantName =
      typeof merchant === "string" ? merchant : merchant.customName;

    setInputValue(merchantName);
    onSelect(merchantName);

    // Apply main default if it exists
    if (onApplyDefault) {
      const mainDefault = getMainDefault(merchantName);
      if (mainDefault) {
        const defaultData = {
          category: mainDefault.category,
          subCategory: mainDefault.subCategory,
          notes: mainDefault.notes || "",
        };
        onApplyDefault(defaultData);
      }
    }

    // Close suggestions and picker
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMerchantPicker(false);
  };

  const handleAddNewMerchant = () => {
    setShowMerchantEditor(true);
    setShowSuggestions(false);
    setShowMerchantPicker(false);
  };

  const handleSelectExistingMerchant = () => {
    setShowMerchantPicker(!showMerchantPicker);
    setShowSuggestions(false);
  };

  const createMerchantFromTransaction = (merchantName) => {
    const proposed = transaction?.proposed || {};
    const original = transaction?.original || {};

    // Create custom merchant mapping if we have raw merchant data
    if (original.merchant && original.merchant !== merchantName) {
      setCustomMerchantName(
        original.merchant,
        proposed.location || "",
        merchantName
      );
    }

    // Create main default from current transaction settings
    if (proposed.category || proposed.type) {
      createNamedDefault(
        merchantName,
        "Main Default",
        proposed.category || "",
        proposed.subCategory || "",
        proposed.notes || "",
        proposed.type || "expense"
      );
    }

    // Update the input and notify parent
    setInputValue(merchantName);
    onSelect(merchantName);

    if (onMerchantPreferenceUpdate) {
      onMerchantPreferenceUpdate();
    }
  };

  const handleMerchantEditorUpdate = (newName) => {
    setInputValue(newName);
    onSelect(newName);
    setShowMerchantEditor(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMerchantPicker(false);
    if (onMerchantPreferenceUpdate) {
      onMerchantPreferenceUpdate();
    }
  };

  const handleMerchantEditorCancel = () => {
    setShowMerchantEditor(false);
  };

  return (
    <div className={styles.merchantInputContainer}>
      {showMerchantEditor ? (
        <InlineMerchantEditor
          rawMerchant={transaction?.original?.merchant || ""}
          location={transaction?.proposed?.location || ""}
          currentName={value}
          onUpdate={handleMerchantEditorUpdate}
          onCancel={handleMerchantEditorCancel}
          allTransactions={allTransactions}
          currentTransactionIndex={currentTransactionIndex}
          onBulkUpdate={onBulkUpdate}
          onMerchantPreferenceUpdate={onMerchantPreferenceUpdate}
          currentTransaction={transaction}
        />
      ) : (
        <>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className={styles.merchantInput}
              placeholder="Enter or select a merchant"
            />
            <div className={styles.inputActions}>
              <button
                type="button"
                className={styles.actionButton}
                title="Add new custom merchant"
                onClick={handleAddNewMerchant}
              >
                ✚
              </button>
              {allMerchants.length > 0 && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${
                    showMerchantPicker ? styles.active : ""
                  }`}
                  title="Select from existing merchants"
                  onClick={handleSelectExistingMerchant}
                >
                  ▼
                </button>
              )}
            </div>
          </div>

          {/* Auto-suggestions from merchant patterns */}
          {suggestions.length > 0 && showSuggestions && !showMerchantPicker && (
            <div className={styles.suggestionsContainer}>
              <div className={styles.suggestionsHeader}>Suggestions:</div>
              <ul className={styles.suggestionsList}>
                {suggestions.map((suggestion, index) => (
                  <li
                    key={
                      typeof suggestion === "string"
                        ? suggestion
                        : suggestion.key || index
                    }
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={styles.suggestionItem}
                  >
                    {typeof suggestion === "string"
                      ? suggestion
                      : suggestion.customName}
                  </li>
                ))}
                {/* Add create merchant option if user has typed something */}
                {inputValue &&
                  inputValue.trim() &&
                  !suggestions.some(
                    (s) =>
                      (typeof s === "string"
                        ? s
                        : s.customName
                      ).toLowerCase() === inputValue.toLowerCase()
                  ) && (
                    <li
                      onClick={() =>
                        createMerchantFromTransaction(inputValue.trim())
                      }
                      className={`${styles.suggestionItem} ${styles.createMerchantItem}`}
                      title="Create new merchant with current transaction settings as default"
                    >
                      ✅ Create "{inputValue.trim()}" with current settings
                    </li>
                  )}
              </ul>
            </div>
          )}

          {/* Existing merchants picker */}
          {showMerchantPicker && allMerchants.length > 0 && (
            <div className={styles.merchantPickerContainer}>
              <div className={styles.merchantPickerHeader}>
                <span>Select Existing Merchant:</span>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowMerchantPicker(false)}
                >
                  ✕
                </button>
              </div>
              <ul className={styles.merchantsList}>
                {allMerchants.map((merchant) => (
                  <li
                    key={merchant.key}
                    onClick={() => handleSuggestionClick(merchant)}
                    className={styles.merchantItem}
                  >
                    <div className={styles.merchantName}>
                      {merchant.customName}
                    </div>
                    <div className={styles.merchantDetails}>
                      {merchant.rawMerchant}{" "}
                      {merchant.location && `(${merchant.location})`}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MerchantInput;
