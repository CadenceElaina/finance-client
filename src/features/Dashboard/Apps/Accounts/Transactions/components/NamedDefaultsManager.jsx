import React, { useState, useCallback } from "react";
import {
  getMerchantNamedDefaults,
  createNamedDefault,
  removeNamedDefault,
  applyNamedDefault,
} from "../utils/merchantHistory";
import { expenseCategories, incomeCategories } from "../utils/categories";
import {
  findMatchingTransactions,
  getBulkOperationSummary,
} from "../utils/bulkTransactionUtils";
import BulkOperationModal from "./BulkOperationModal";
import styles from "./NamedDefaultsManager.module.css";

const NamedDefaultsManager = ({
  merchantName,
  onDefaultSelected,
  onDefaultsChanged,
  transactionType = "expense",
  currentCategory = "",
  currentSubCategory = "",
  currentNotes = "",
  autoOpenCreateForm = false,
  // New props for bulk operations
  allTransactions = [],
  currentTransactionIndex = -1,
  onBulkUpdate = null,
}) => {
  const [namedDefaults, setNamedDefaults] = useState(() =>
    getMerchantNamedDefaults(merchantName)
  );
  const [showCreateForm, setShowCreateForm] = useState(autoOpenCreateForm);
  const [newDefaultName, setNewDefaultName] = useState("");
  const [newCategory, setNewCategory] = useState(currentCategory);
  const [newSubCategory, setNewSubCategory] = useState(currentSubCategory);
  const [newNotes, setNewNotes] = useState(currentNotes);
  const [isCreating, setIsCreating] = useState(false);

  // Bulk operation state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOperationData, setBulkOperationData] = useState(null);
  const [bulkSummary, setBulkSummary] = useState(null);

  const refreshDefaults = useCallback(() => {
    const updated = getMerchantNamedDefaults(merchantName);
    setNamedDefaults(updated);
    if (onDefaultsChanged) {
      onDefaultsChanged(updated);
    }
  }, [merchantName, onDefaultsChanged]);

  const handleCreateDefault = async () => {
    if (
      !newDefaultName.trim() ||
      !newCategory ||
      (transactionType === "expense" && !newSubCategory)
    ) {
      return;
    }

    setIsCreating(true);
    const success = createNamedDefault(
      merchantName,
      newDefaultName.trim(),
      newCategory,
      newSubCategory,
      newNotes.trim(),
      transactionType
    );

    if (success) {
      // Reset form to current values
      setNewDefaultName("");
      setNewCategory(currentCategory);
      setNewSubCategory(currentSubCategory);
      setNewNotes(currentNotes);
      setShowCreateForm(false);
      refreshDefaults();
    }
    setIsCreating(false);
  };

  const handleToggleCreateForm = () => {
    if (!showCreateForm) {
      // Pre-fill with current transaction values when opening
      setNewCategory(currentCategory);
      setNewSubCategory(currentSubCategory);
      setNewNotes(currentNotes);
    }
    setShowCreateForm(!showCreateForm);
  };

  const handleSelectDefault = (defaultData) => {
    // Mark the default as used and get updated data
    const usedDefault = applyNamedDefault(merchantName, defaultData.name);
    if (usedDefault && onDefaultSelected) {
      onDefaultSelected({
        category: usedDefault.category,
        subCategory: usedDefault.subCategory,
        notes: usedDefault.notes,
        defaultName: usedDefault.name,
      });
    }
    refreshDefaults();
  };

  const handleSelectDefaultWithBulkOption = (defaultData) => {
    if (allTransactions.length > 0 && currentTransactionIndex >= 0) {
      const currentTransaction = allTransactions[currentTransactionIndex];
      const matchingTransactions = findMatchingTransactions(
        allTransactions,
        currentTransaction
      );

      if (matchingTransactions.length > 1) {
        // Show bulk operation modal
        const summary = getBulkOperationSummary(matchingTransactions);
        setBulkOperationData({
          type: "applyCategory",
          category: defaultData.category,
          subCategory: defaultData.subCategory,
          notes: defaultData.notes,
          defaultName: defaultData.name,
          matchingTransactions,
        });
        setBulkSummary(summary);
        setShowBulkModal(true);
        return;
      }
    }

    // Fallback to single transaction update
    handleSelectDefault(defaultData);
  };

  const handleBulkOperationConfirm = () => {
    if (bulkOperationData && onBulkUpdate) {
      const {
        matchingTransactions,
        category,
        subCategory,
        notes,
        defaultName,
      } = bulkOperationData;

      // Apply the default to the single transaction first
      const usedDefault = applyNamedDefault(merchantName, defaultName);
      if (usedDefault && onDefaultSelected) {
        onDefaultSelected({
          category: usedDefault.category,
          subCategory: usedDefault.subCategory,
          notes: usedDefault.notes,
          defaultName: usedDefault.name,
        });
      }

      // Then apply to all matching transactions via callback
      onBulkUpdate({
        operation: "applyCategory",
        data: { category, subCategory, notes },
        matchingTransactions,
      });

      refreshDefaults();
    }
    setShowBulkModal(false);
  };

  const handleRemoveDefault = (defaultName) => {
    if (
      window.confirm(
        `Are you sure you want to remove the "${defaultName}" default for ${merchantName}?`
      )
    ) {
      removeNamedDefault(merchantName, defaultName);
      refreshDefaults();
    }
  };

  const categories =
    transactionType === "income" ? incomeCategories : expenseCategories;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Saved Defaults for "{merchantName}"</h4>
        <button
          type="button"
          onClick={handleToggleCreateForm}
          className={styles.createButton}
        >
          {showCreateForm ? "Cancel" : "+ Create New Default"}
        </button>
      </div>

      {/* Show bulk operation hint if multiple transactions available */}
      {allTransactions.length > 0 && onBulkUpdate && (
        <div className={styles.bulkOperationHint}>
          ⚡ When you select a default, you'll have the option to apply it to
          all similar transactions
        </div>
      )}

      {namedDefaults.length > 0 && (
        <div className={styles.defaultsList}>
          {namedDefaults.map((defaultData) => (
            <div key={defaultData.name} className={styles.defaultItem}>
              <div className={styles.defaultInfo}>
                <div className={styles.defaultName}>{defaultData.name}</div>
                <div className={styles.defaultDetails}>
                  {defaultData.category}
                  {defaultData.subCategory && ` → ${defaultData.subCategory}`}
                  {defaultData.notes && (
                    <span className={styles.notes}>"{defaultData.notes}"</span>
                  )}
                </div>
                <div className={styles.defaultStats}>
                  Used {defaultData.usageCount || 0} times
                </div>
              </div>
              <div className={styles.defaultActions}>
                <button
                  type="button"
                  onClick={() => {
                    // Use bulk option if we have transaction data, otherwise use regular selection
                    if (allTransactions.length > 0 && onBulkUpdate) {
                      handleSelectDefaultWithBulkOption(defaultData);
                    } else {
                      handleSelectDefault(defaultData);
                    }
                  }}
                  className={`${styles.selectButton} ${
                    allTransactions.length > 0 && onBulkUpdate
                      ? styles.withBulkOption
                      : ""
                  }`}
                  title={
                    allTransactions.length > 0 && onBulkUpdate
                      ? "Click to use this default and optionally apply to all similar transactions"
                      : "Use this default"
                  }
                >
                  Use This
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveDefault(defaultData.name)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {namedDefaults.length === 0 && !showCreateForm && (
        <div className={styles.noDefaults}>
          No saved defaults for this merchant yet.
        </div>
      )}

      {showCreateForm && (
        <div className={styles.createForm}>
          <h5>Create New Default</h5>

          <div className={styles.formRow}>
            <label>Default Name:</label>
            <input
              type="text"
              value={newDefaultName}
              onChange={(e) => setNewDefaultName(e.target.value)}
              placeholder="e.g., Gas, Convenience Store, Groceries"
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <label>Category:</label>
            <select
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                setNewSubCategory(""); // Reset subcategory when category changes
              }}
              className={styles.select}
            >
              <option value="">Select Category</option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {transactionType === "expense" && newCategory && (
            <div className={styles.formRow}>
              <label>Sub-Category:</label>
              <select
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                className={styles.select}
              >
                <option value="">Select Sub-Category</option>
                {categories[newCategory]?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formRow}>
            <label>Notes (optional):</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g., Usually for fuel, Weekend convenience runs"
              className={styles.input}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCreateDefault}
              disabled={
                !newDefaultName.trim() ||
                !newCategory ||
                (transactionType === "expense" && !newSubCategory) ||
                isCreating
              }
              className={styles.saveButton}
            >
              {isCreating ? "Creating..." : "Create Default"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewDefaultName("");
                setNewCategory("");
                setNewSubCategory("");
                setNewNotes("");
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BulkOperationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkOperationConfirm}
        operation="applyCategory"
        summary={bulkSummary}
        operationData={bulkOperationData}
      />
    </div>
  );
};

export default NamedDefaultsManager;
