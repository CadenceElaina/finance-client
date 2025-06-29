import React, { useState, useEffect } from "react";
import {
  getMerchantDefaults,
  getMainDefault,
  deleteMerchantDefault,
  setMainDefault,
} from "../utils/merchantPreferences";
import {
  getMerchantNamedDefaults,
  createNamedDefault,
  updateNamedDefault,
  deleteNamedDefault,
  setMainNamedDefault,
} from "../utils/merchantHistory";
import {
  getAllCustomMerchantNames,
  setCustomMerchantName,
  removeCustomMerchantName,
  getMerchantNameSuggestions,
} from "../utils/customMerchantNames";
import Button from "../../../../../../components/ui/Button/Button";
import Modal from "../../../../../../components/ui/Modal/Modal";
import styles from "./MerchantDefaultManager.module.css";

const MerchantDefaultManager = ({ merchantName, onClose, onUpdate }) => {
  const [smartDefaults, setSmartDefaults] = useState([]);
  const [namedDefaults, setNamedDefaults] = useState([]);
  const [rawMappings, setRawMappings] = useState([]);
  const [editingDefault, setEditingDefault] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddMappingForm, setShowAddMappingForm] = useState(false);
  const [mainDefaultId, setMainDefaultId] = useState(null);

  const [newDefault, setNewDefault] = useState({
    name: "",
    category: "",
    subCategory: "",
    type: "expense",
    notes: "",
    isRecurring: false,
  });

  const [newMapping, setNewMapping] = useState({
    rawMerchant: "",
    location: "",
  });

  useEffect(() => {
    const refreshData = () => {
      if (merchantName) {
        // Get smart defaults
        const smart = getMerchantDefaults(merchantName);
        setSmartDefaults(smart || []);

        // Get named defaults
        const named = getMerchantNamedDefaults(merchantName);
        setNamedDefaults(named || []);

        // Get raw mappings for this merchant
        const allMappings = getAllCustomMerchantNames();
        const merchantMappings = allMappings.filter(
          (mapping) =>
            mapping.customName.toLowerCase() === merchantName.toLowerCase()
        );
        setRawMappings(merchantMappings);

        // Get main default - improved logic for single/multiple defaults
        const allDefaults = [...(named || []), ...(smart || [])];
        let mainDefault = getMainDefault(merchantName);

        // If no main default is set but we have defaults, set the first as main
        if (!mainDefault && allDefaults.length === 1) {
          const singleDefault = allDefaults[0];
          if (singleDefault.source === "named" || !singleDefault.source) {
            setMainNamedDefault(merchantName, singleDefault.name);
          } else {
            setMainDefault(merchantName, singleDefault.name);
          }
          mainDefault = singleDefault;
        }

        setMainDefaultId(mainDefault?.name || null);
      }
    };

    refreshData();
  }, [merchantName]);

  const refreshData = () => {
    if (merchantName) {
      // Get smart defaults
      const smart = getMerchantDefaults(merchantName);
      setSmartDefaults(smart || []);

      // Get named defaults
      const named = getMerchantNamedDefaults(merchantName);
      setNamedDefaults(named || []);

      // Get raw mappings for this merchant
      const allMappings = getAllCustomMerchantNames();
      const merchantMappings = allMappings.filter(
        (mapping) =>
          mapping.customName.toLowerCase() === merchantName.toLowerCase()
      );
      setRawMappings(merchantMappings);

      // Get main default - improved logic for single/multiple defaults
      const allDefaults = [...(named || []), ...(smart || [])];
      let mainDefault = getMainDefault(merchantName);

      // If no main default is set but we have defaults, set the first as main
      if (!mainDefault && allDefaults.length === 1) {
        const singleDefault = allDefaults[0];
        if (singleDefault.source === "named" || !singleDefault.source) {
          setMainNamedDefault(merchantName, singleDefault.name);
        } else {
          setMainDefault(merchantName, singleDefault.name);
        }
        mainDefault = singleDefault;
      }

      setMainDefaultId(mainDefault?.name || null);
    }
  };

  const handleCreateDefault = () => {
    if (!newDefault.name.trim() || !newDefault.category.trim()) {
      alert("Please provide at least a name and category");
      return;
    }

    // Create named default
    createNamedDefault(
      merchantName,
      newDefault.name,
      newDefault.category,
      newDefault.subCategory || "",
      newDefault.notes || "",
      newDefault.type || "expense",
      newDefault.isRecurring || false
    );

    // Check if this should be the main default
    const allDefaults = [...namedDefaults, ...smartDefaults];
    if (allDefaults.length === 0) {
      // This will be the only default, so set it as main
      setMainNamedDefault(merchantName, newDefault.name);
    }

    // Reset form
    setNewDefault({
      name: "",
      category: "",
      subCategory: "",
      type: "expense",
      notes: "",
      isRecurring: false,
    });
    setShowCreateForm(false);
    refreshData();
    if (onUpdate) onUpdate();
  };

  const handleEditDefault = (defaultItem) => {
    setEditingDefault({
      ...defaultItem,
      originalName: defaultItem.name,
      type: defaultItem.type || defaultItem.transactionType || "expense",
    });
  };

  const handleUpdateDefault = () => {
    if (!editingDefault.name.trim() || !editingDefault.category.trim()) {
      alert("Please provide at least a name and category");
      return;
    }

    // Update named default
    updateNamedDefault(
      merchantName,
      editingDefault.originalName,
      editingDefault.name,
      editingDefault.category,
      editingDefault.subCategory || "",
      editingDefault.notes || "",
      editingDefault.type || "expense",
      editingDefault.isRecurring || false
    );

    setEditingDefault(null);
    refreshData();
    if (onUpdate) onUpdate();
  };

  const handleDeleteDefault = (defaultItem) => {
    if (
      window.confirm(
        `Are you sure you want to delete the default "${defaultItem.name}"?`
      )
    ) {
      // Delete from appropriate system
      if (defaultItem.source === "named" || !defaultItem.source) {
        deleteNamedDefault(merchantName, defaultItem.name);
      } else {
        deleteMerchantDefault(merchantName, defaultItem.name);
      }

      refreshData();
      if (onUpdate) onUpdate();
    }
  };

  const handleSetMainDefault = (defaultItem) => {
    // Set as main default in the appropriate system
    if (defaultItem.source === "named" || !defaultItem.source) {
      setMainNamedDefault(merchantName, defaultItem.name);
    } else {
      setMainDefault(merchantName, defaultItem.name);
    }

    setMainDefaultId(defaultItem.name);
    refreshData();
    if (onUpdate) onUpdate();
  };

  const handleAddMapping = () => {
    if (!newMapping.rawMerchant.trim()) {
      alert("Please provide a raw merchant name");
      return;
    }

    setCustomMerchantName(
      newMapping.rawMerchant,
      newMapping.location || "",
      merchantName
    );

    // Reset form
    setNewMapping({
      rawMerchant: "",
      location: "",
    });
    setShowAddMappingForm(false);
    refreshData();
    if (onUpdate) onUpdate();
  };

  const handleRemoveMapping = (mapping) => {
    if (window.confirm(`Remove mapping for "${mapping.rawMerchant}"?`)) {
      removeCustomMerchantName(mapping.rawMerchant, mapping.location || "");
      refreshData();
      if (onUpdate) onUpdate();
    }
  };

  const getSuggestions = (rawMerchant) => {
    return getMerchantNameSuggestions(rawMerchant);
  };

  const renderDefaultForm = (defaultData, onChange, onSubmit, onCancel) => (
    <div className={styles.defaultForm}>
      <div className={styles.formRow}>
        <label>Name:</label>
        <input
          type="text"
          value={defaultData.name}
          onChange={(e) => onChange({ ...defaultData, name: e.target.value })}
          className={styles.formInput}
          placeholder="Default name (e.g., 'Lunch', 'Gas')"
        />
      </div>

      <div className={styles.formRow}>
        <label>Category:</label>
        <input
          type="text"
          value={defaultData.category}
          onChange={(e) =>
            onChange({ ...defaultData, category: e.target.value })
          }
          className={styles.formInput}
          placeholder="Main category"
        />
      </div>

      <div className={styles.formRow}>
        <label>Sub-Category:</label>
        <input
          type="text"
          value={defaultData.subCategory || ""}
          onChange={(e) =>
            onChange({ ...defaultData, subCategory: e.target.value })
          }
          className={styles.formInput}
          placeholder="Sub-category (optional)"
        />
      </div>

      <div className={styles.formRow}>
        <label>Type:</label>
        <select
          value={defaultData.type || "expense"}
          onChange={(e) => onChange({ ...defaultData, type: e.target.value })}
          className={styles.formSelect}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      <div className={styles.formRow}>
        <label>Notes:</label>
        <textarea
          value={defaultData.notes || ""}
          onChange={(e) => onChange({ ...defaultData, notes: e.target.value })}
          className={styles.formTextarea}
          placeholder="Optional notes"
          rows="3"
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={defaultData.isRecurring || false}
            onChange={(e) =>
              onChange({ ...defaultData, isRecurring: e.target.checked })
            }
          />
          Recurring transaction
        </label>
      </div>

      <div className={styles.formActions}>
        <Button variant="primary" onClick={onSubmit}>
          {editingDefault ? "Update" : "Create"} Default
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderDefaultItem = (defaultItem, isMain = false) => (
    <div
      key={defaultItem.name}
      className={`${styles.defaultItem} ${isMain ? styles.mainDefault : ""}`}
    >
      <div className={styles.defaultInfo}>
        <div className={styles.defaultName}>
          {defaultItem.name}
          {isMain && <span className={styles.mainBadge}>MAIN</span>}
        </div>
        <div className={styles.defaultDetails}>
          <span className={styles.category}>
            {defaultItem.category ||
              defaultItem.defaultCategory ||
              defaultItem.parent}
          </span>
          {(defaultItem.subCategory ||
            defaultItem.defaultSubCategory ||
            defaultItem.sub) && (
            <span className={styles.subCategory}>
              {" "}
              &gt;{" "}
              {defaultItem.subCategory ||
                defaultItem.defaultSubCategory ||
                defaultItem.sub}
            </span>
          )}
          <span className={styles.type}>
            [{defaultItem.type || defaultItem.transactionType || "expense"}]
          </span>
          {(defaultItem.isRecurring ||
            defaultItem.recurring ||
            defaultItem.isRecurring) && (
            <span className={styles.recurringBadge}>🔄 Recurring</span>
          )}
        </div>
        {(defaultItem.notes || defaultItem.defaultNotes) && (
          <div className={styles.defaultNotes}>
            {defaultItem.notes || defaultItem.defaultNotes}
          </div>
        )}
      </div>
      <div className={styles.defaultActions}>
        {!isMain && allDefaults.length > 1 && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleSetMainDefault(defaultItem)}
            title="Set as main default"
          >
            ⭐ Set Main
          </Button>
        )}
        <Button
          variant="outline"
          size="small"
          onClick={() => handleEditDefault(defaultItem)}
        >
          ✏️ Edit
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={() => handleDeleteDefault(defaultItem)}
          className={styles.deleteButton}
        >
          🗑️ Delete
        </Button>
      </div>
    </div>
  );

  const allDefaults = [...namedDefaults, ...smartDefaults];
  const mainDefault = allDefaults.find((d) => d.name === mainDefaultId);
  const otherDefaults = allDefaults.filter((d) => d.name !== mainDefaultId);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage: ${merchantName}`}
      modalClassName="wideModal"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Merchant Management for {merchantName}</h3>
          <p>
            Manage raw data mappings and defaults for this merchant. Set
            categories, types, and notes that can be quickly applied to
            transactions.
          </p>
        </div>

        {/* Raw Data Mappings Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4>Raw Data Mappings ({rawMappings.length})</h4>
            {!showAddMappingForm && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowAddMappingForm(true)}
              >
                + Add Mapping
              </Button>
            )}
          </div>
          <p className={styles.sectionDescription}>
            These are the raw merchant names from CSV files that will be
            automatically mapped to "{merchantName}".
          </p>

          {showAddMappingForm && (
            <div className={styles.mappingForm}>
              <div className={styles.formRow}>
                <label>Raw Merchant Name (from CSV):</label>
                <input
                  type="text"
                  value={newMapping.rawMerchant}
                  onChange={(e) =>
                    setNewMapping((prev) => ({
                      ...prev,
                      rawMerchant: e.target.value,
                    }))
                  }
                  className={styles.formInput}
                  placeholder="e.g., WALMART SUPERCENTER #1234"
                />
                {newMapping.rawMerchant && (
                  <div className={styles.suggestions}>
                    <span>Name suggestions: </span>
                    {getSuggestions(newMapping.rawMerchant)
                      .slice(0, 3)
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setNewMapping((prev) => ({
                              ...prev,
                              rawMerchant: suggestion,
                            }))
                          }
                          className={styles.suggestionButton}
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div className={styles.formRow}>
                <label>Location (optional):</label>
                <input
                  type="text"
                  value={newMapping.location}
                  onChange={(e) =>
                    setNewMapping((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className={styles.formInput}
                  placeholder="e.g., Charlotte, NC"
                />
              </div>
              <div className={styles.formActions}>
                <Button variant="primary" onClick={handleAddMapping}>
                  Add Mapping
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddMappingForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {rawMappings.length > 0 ? (
            <div className={styles.mappingsList}>
              {rawMappings.map((mapping) => (
                <div key={mapping.key} className={styles.mappingItem}>
                  <div className={styles.mappingInfo}>
                    <div className={styles.mappingName}>
                      {mapping.rawMerchant}
                    </div>
                    {mapping.location && (
                      <div className={styles.mappingLocation}>
                        📍 {mapping.location}
                      </div>
                    )}
                    <div className={styles.mappingMeta}>
                      Used {mapping.usageCount || 0} times • Created{" "}
                      {new Date(mapping.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.mappingActions}>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleRemoveMapping(mapping)}
                      className={styles.removeButton}
                    >
                      🗑️ Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>
                No raw data mappings yet. Add mappings to automatically
                categorize transactions from specific CSV merchant names.
              </p>
            </div>
          )}
        </div>

        {/* Main Default Section */}
        {allDefaults.length > 0 && (
          <div className={styles.section}>
            <h4>
              {allDefaults.length === 1 ? "Default" : "Main Default"}
              {allDefaults.length === 1 && (
                <span className={styles.autoMainBadge}> (Auto-Main)</span>
              )}
            </h4>
            <p className={styles.sectionDescription}>
              {allDefaults.length === 1
                ? "This is your only default and will be auto-applied to transactions from this merchant."
                : "This is the primary default that will be auto-applied to new transactions from this merchant."}
            </p>
            {mainDefault
              ? renderDefaultItem(mainDefault, true)
              : renderDefaultItem(allDefaults[0], true)}
          </div>
        )}

        {/* Other Defaults Section */}
        {otherDefaults.length > 0 && (
          <div className={styles.section}>
            <h4>Other Defaults ({otherDefaults.length})</h4>
            <p className={styles.sectionDescription}>
              Additional defaults that can be manually applied to transactions.
            </p>
            <div className={styles.defaultsList}>
              {otherDefaults.map((defaultItem) =>
                renderDefaultItem(defaultItem, false)
              )}
            </div>
          </div>
        )}

        {/* Create New Default Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4>Create New Default</h4>
            {!showCreateForm && (
              <Button variant="primary" onClick={() => setShowCreateForm(true)}>
                + Add New Default
              </Button>
            )}
          </div>

          {showCreateForm &&
            renderDefaultForm(
              newDefault,
              setNewDefault,
              handleCreateDefault,
              () => setShowCreateForm(false)
            )}
        </div>

        {/* Edit Form */}
        {editingDefault &&
          renderDefaultForm(
            editingDefault,
            setEditingDefault,
            handleUpdateDefault,
            () => setEditingDefault(null)
          )}

        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MerchantDefaultManager;
