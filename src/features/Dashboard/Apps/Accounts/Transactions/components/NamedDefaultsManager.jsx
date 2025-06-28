import React, { useState, useCallback } from "react";
import {
  getMerchantNamedDefaults,
  createNamedDefault,
  removeNamedDefault,
  applyNamedDefault,
} from "../utils/merchantHistory";
import { expenseCategories, incomeCategories } from "../utils/categories";
import styles from "./NamedDefaultsManager.module.css";

const NamedDefaultsManager = ({
  merchantName,
  onDefaultSelected,
  onDefaultsChanged,
  transactionType = "expense",
}) => {
  const [namedDefaults, setNamedDefaults] = useState(() =>
    getMerchantNamedDefaults(merchantName)
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDefaultName, setNewDefaultName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
      // Reset form
      setNewDefaultName("");
      setNewCategory("");
      setNewSubCategory("");
      setNewNotes("");
      setShowCreateForm(false);
      refreshDefaults();
    }
    setIsCreating(false);
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
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={styles.createButton}
        >
          {showCreateForm ? "Cancel" : "+ Create New Default"}
        </button>
      </div>

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
                  onClick={() => handleSelectDefault(defaultData)}
                  className={styles.selectButton}
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
    </div>
  );
};

export default NamedDefaultsManager;
