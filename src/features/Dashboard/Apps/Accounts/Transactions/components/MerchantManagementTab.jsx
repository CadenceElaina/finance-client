import React, { useState, useMemo } from "react";
import {
  getAllCustomMerchantNames,
  setCustomMerchantName,
  removeCustomMerchantName,
  getMerchantNameSuggestions,
} from "../utils/customMerchantNames";
import {
  getAllMerchantsWithDefaults,
  createNamedDefault,
  removeNamedDefault,
} from "../utils/merchantHistory";
import Section from "../../../../../../components/ui/Section/Section";
import Button from "../../../../../../components/ui/Button/Button";
import styles from "./MerchantManagementTab.module.css";

const MerchantManagementTab = () => {
  const [customMerchants, setCustomMerchants] = useState(() =>
    getAllCustomMerchantNames()
  );
  const [merchantsWithDefaults, setMerchantsWithDefaults] = useState(() =>
    getAllMerchantsWithDefaults()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("custom-names");
  const [editingDefault, setEditingDefault] = useState(null); // Track which default is being edited
  const [editingDefaultData, setEditingDefaultData] = useState({
    name: "",
    category: "",
    subcategory: "",
    notes: "",
  });

  // New merchant creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    rawMerchant: "",
    location: "",
    customName: "",
    category: "",
    subcategory: "",
    notes: "",
  });

  const refreshData = () => {
    setCustomMerchants(getAllCustomMerchantNames());
    setMerchantsWithDefaults(getAllMerchantsWithDefaults());
  };

  const handleCreateMerchant = () => {
    if (!newMerchant.rawMerchant.trim() || !newMerchant.customName.trim()) {
      alert("Please provide both a raw merchant name and custom name");
      return;
    }

    // Set custom merchant name
    setCustomMerchantName(
      newMerchant.rawMerchant,
      newMerchant.location,
      newMerchant.customName
    );

    // If category is provided, create a default
    if (newMerchant.category) {
      createNamedDefault(
        newMerchant.customName,
        "Default",
        newMerchant.category,
        newMerchant.subcategory || "",
        newMerchant.notes || "",
        "expense"
      );
    }

    // Reset form
    setNewMerchant({
      rawMerchant: "",
      location: "",
      customName: "",
      category: "",
      subcategory: "",
      notes: "",
    });
    setShowCreateForm(false);
    refreshData();
  };

  const handleRemoveCustomName = (merchant) => {
    if (
      window.confirm(
        `Remove custom name "${merchant.customName}" for this merchant?`
      )
    ) {
      removeCustomMerchantName(merchant.rawMerchant, merchant.location);
      refreshData();
    }
  };

  const handleRemoveDefault = (merchantName, defaultName) => {
    if (
      window.confirm(`Remove default "${defaultName}" for ${merchantName}?`)
    ) {
      removeNamedDefault(merchantName, defaultName);
      refreshData();
    }
  };

  const handleEditDefault = (merchantName, defaultName, defaultData) => {
    setEditingDefault(`${merchantName}-${defaultName}`);
    setEditingDefaultData({
      name: defaultName,
      category: defaultData.category,
      subcategory: defaultData.subCategory || defaultData.subcategory,
      notes: defaultData.notes || "",
    });
  };

  const handleSaveDefaultEdit = (merchantName, originalDefaultName) => {
    if (
      !editingDefaultData.name.trim() ||
      !editingDefaultData.category.trim()
    ) {
      alert("Please provide both a name and category for the default");
      return;
    }

    // If the name changed, remove the old default
    if (originalDefaultName !== editingDefaultData.name.trim()) {
      removeNamedDefault(merchantName, originalDefaultName);
    }

    // Create/update the default
    createNamedDefault(
      merchantName,
      editingDefaultData.name.trim(),
      editingDefaultData.category,
      editingDefaultData.subcategory,
      editingDefaultData.notes
    );

    setEditingDefault(null);
    setEditingDefaultData({
      name: "",
      category: "",
      subcategory: "",
      notes: "",
    });
    refreshData();
  };

  const handleCancelDefaultEdit = () => {
    setEditingDefault(null);
    setEditingDefaultData({
      name: "",
      category: "",
      subcategory: "",
      notes: "",
    });
  };

  const filteredCustomMerchants = useMemo(() => {
    if (!searchTerm) return customMerchants;
    const term = searchTerm.toLowerCase();
    return customMerchants.filter(
      (merchant) =>
        merchant.customName.toLowerCase().includes(term) ||
        merchant.rawMerchant.toLowerCase().includes(term)
    );
  }, [customMerchants, searchTerm]);

  const filteredMerchantsWithDefaults = useMemo(() => {
    if (!searchTerm) return merchantsWithDefaults;
    const term = searchTerm.toLowerCase();
    return merchantsWithDefaults.filter((merchant) =>
      merchant.merchantName.toLowerCase().includes(term)
    );
  }, [merchantsWithDefaults, searchTerm]);

  const getSuggestions = (rawMerchant) => {
    return getMerchantNameSuggestions(rawMerchant);
  };

  return (
    <div className={styles.container}>
      <Section title="Merchant Management" className={styles.section}>
        {/* Search and Controls */}
        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
          >
            {" "}
            + New Merchant
          </Button>
        </div>

        {/* Create New Merchant Form */}
        {showCreateForm && (
          <div className={styles.createForm}>
            <h4>Create New Merchant Mapping</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Raw Merchant Name (from CSV):</label>
                <input
                  type="text"
                  value={newMerchant.rawMerchant}
                  onChange={(e) =>
                    setNewMerchant((prev) => ({
                      ...prev,
                      rawMerchant: e.target.value,
                    }))
                  }
                  placeholder="e.g., WALMART SUPERCENTER #1234 CHARLOTTE NC"
                  className={styles.input}
                />
                {newMerchant.rawMerchant && (
                  <div className={styles.suggestions}>
                    <span>Suggestions: </span>
                    {getSuggestions(newMerchant.rawMerchant).map(
                      (suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setNewMerchant((prev) => ({
                              ...prev,
                              customName: suggestion,
                            }))
                          }
                          className={styles.suggestionButton}
                        >
                          {suggestion}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Location (optional):</label>
                <input
                  type="text"
                  value={newMerchant.location}
                  onChange={(e) =>
                    setNewMerchant((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="e.g., Charlotte, NC"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Custom Display Name:</label>
                <input
                  type="text"
                  value={newMerchant.customName}
                  onChange={(e) =>
                    setNewMerchant((prev) => ({
                      ...prev,
                      customName: e.target.value,
                    }))
                  }
                  placeholder="e.g., Walmart"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Default Category (optional):</label>
                <select
                  value={newMerchant.category}
                  onChange={(e) =>
                    setNewMerchant((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className={styles.select}
                >
                  <option value="">-- Select Category --</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Gas & Fuel">Gas & Fuel</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Home">Home</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Subcategory (optional):</label>
                <input
                  type="text"
                  value={newMerchant.subcategory}
                  onChange={(e) =>
                    setNewMerchant((prev) => ({
                      ...prev,
                      subcategory: e.target.value,
                    }))
                  }
                  placeholder="e.g., Groceries, Fast Food, etc."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Notes (optional):</label>
                <input
                  type="text"
                  value={newMerchant.notes}
                  onChange={(e) =>
                    setNewMerchant((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any additional notes"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="primary" onClick={handleCreateMerchant}>
                Create Merchant
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tabs for Different Views */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "custom-names" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("custom-names")}
          >
            Custom Names ({filteredCustomMerchants.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "defaults" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("defaults")}
          >
            Named Defaults ({filteredMerchantsWithDefaults.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === "custom-names" && (
            <div className={styles.merchantsList}>
              <h4>Custom Merchant Names</h4>
              <p className={styles.description}>
                These are custom names you've assigned to raw merchant data from
                CSV imports.
              </p>
              {filteredCustomMerchants.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No custom merchant names found.</p>
                  <p>Create one above to get started!</p>
                </div>
              ) : (
                filteredCustomMerchants.map((merchant) => (
                  <div key={merchant.key} className={styles.merchantItem}>
                    <div className={styles.merchantInfo}>
                      <div className={styles.customName}>
                        {merchant.customName}
                      </div>
                      <div className={styles.rawMerchant}>
                        Raw: {merchant.rawMerchant}
                        {merchant.location && ` (${merchant.location})`}
                      </div>
                      <div className={styles.stats}>
                        Used {merchant.usageCount || 0} times
                        {merchant.lastUsed && (
                          <span>
                            {" "}
                            • Last used:{" "}
                            {new Date(merchant.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="danger"
                        onClick={() => handleRemoveCustomName(merchant)}
                        className={styles.removeButton}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "defaults" && (
            <div className={styles.merchantsList}>
              <h4>Named Defaults</h4>
              <p className={styles.description}>
                Merchants with saved categorization defaults for faster
                transaction processing.
              </p>
              {filteredMerchantsWithDefaults.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No merchant defaults found.</p>
                  <p>
                    Defaults are created when you categorize transactions during
                    import.
                  </p>
                </div>
              ) : (
                filteredMerchantsWithDefaults.map((merchant) => (
                  <div
                    key={merchant.merchantName}
                    className={styles.merchantItem}
                  >
                    <div className={styles.merchantInfo}>
                      <div className={styles.merchantName}>
                        {merchant.merchantName}
                      </div>
                      <div className={styles.defaults}>
                        {merchant.defaults.map((defaultItem) => {
                          const editKey = `${merchant.merchantName}-${defaultItem.name}`;
                          const isEditing = editingDefault === editKey;

                          return (
                            <div
                              key={defaultItem.name}
                              className={styles.defaultItem}
                            >
                              {isEditing ? (
                                <div className={styles.editingDefault}>
                                  <div className={styles.editField}>
                                    <label>Name:</label>
                                    <input
                                      type="text"
                                      value={editingDefaultData.name}
                                      onChange={(e) =>
                                        setEditingDefaultData((prev) => ({
                                          ...prev,
                                          name: e.target.value,
                                        }))
                                      }
                                      className={styles.editInput}
                                    />
                                  </div>
                                  <div className={styles.editField}>
                                    <label>Category:</label>
                                    <input
                                      type="text"
                                      value={editingDefaultData.category}
                                      onChange={(e) =>
                                        setEditingDefaultData((prev) => ({
                                          ...prev,
                                          category: e.target.value,
                                        }))
                                      }
                                      className={styles.editInput}
                                    />
                                  </div>
                                  <div className={styles.editField}>
                                    <label>Subcategory:</label>
                                    <input
                                      type="text"
                                      value={editingDefaultData.subcategory}
                                      onChange={(e) =>
                                        setEditingDefaultData((prev) => ({
                                          ...prev,
                                          subcategory: e.target.value,
                                        }))
                                      }
                                      className={styles.editInput}
                                    />
                                  </div>
                                  <div className={styles.editField}>
                                    <label>Notes:</label>
                                    <input
                                      type="text"
                                      value={editingDefaultData.notes}
                                      onChange={(e) =>
                                        setEditingDefaultData((prev) => ({
                                          ...prev,
                                          notes: e.target.value,
                                        }))
                                      }
                                      className={styles.editInput}
                                    />
                                  </div>
                                  <div className={styles.editActions}>
                                    <Button
                                      variant="primary"
                                      onClick={() =>
                                        handleSaveDefaultEdit(
                                          merchant.merchantName,
                                          defaultItem.name
                                        )
                                      }
                                      className={styles.saveButton}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      onClick={handleCancelDefaultEdit}
                                      className={styles.cancelButton}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.defaultDisplay}>
                                  <div className={styles.defaultText}>
                                    <strong>{defaultItem.name}:</strong>{" "}
                                    {defaultItem.category}
                                    {defaultItem.subcategory &&
                                      ` → ${defaultItem.subcategory}`}
                                    {defaultItem.notes && (
                                      <div className={styles.notes}>
                                        Notes: {defaultItem.notes}
                                      </div>
                                    )}
                                  </div>
                                  <div className={styles.defaultActions}>
                                    <Button
                                      variant="secondary"
                                      onClick={() =>
                                        handleEditDefault(
                                          merchant.merchantName,
                                          defaultItem.name,
                                          defaultItem
                                        )
                                      }
                                      className={styles.editButton}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="danger"
                                      onClick={() =>
                                        handleRemoveDefault(
                                          merchant.merchantName,
                                          defaultItem.name
                                        )
                                      }
                                      className={styles.removeDefaultButton}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default MerchantManagementTab;
