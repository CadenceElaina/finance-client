import React, { useState, useCallback, useMemo } from "react";
import {
  getAllCustomMerchantNames,
  setCustomMerchantName,
  removeCustomMerchantName,
} from "../utils/customMerchantNames";
import {
  getAllMerchantsWithDefaults,
  removeNamedDefault,
} from "../utils/merchantHistory";
import styles from "./MerchantManager.module.css";

const MerchantManager = ({ onClose = null }) => {
  const [customMerchants, setCustomMerchants] = useState(() =>
    getAllCustomMerchantNames()
  );
  const [merchantsWithDefaults] = useState(() => getAllMerchantsWithDefaults());
  const [activeTab, setActiveTab] = useState("custom-names");
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [newCustomName, setNewCustomName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const refreshCustomMerchants = useCallback(() => {
    setCustomMerchants(getAllCustomMerchantNames());
  }, []);

  const handleEditMerchant = (merchant) => {
    setEditingMerchant(merchant);
    setNewCustomName(merchant.customName);
  };

  const handleSaveEdit = () => {
    if (editingMerchant && newCustomName.trim()) {
      setCustomMerchantName(
        editingMerchant.rawMerchant,
        editingMerchant.location,
        newCustomName.trim()
      );
      setEditingMerchant(null);
      setNewCustomName("");
      refreshCustomMerchants();
    }
  };

  const handleRemoveCustomName = (merchant) => {
    if (
      window.confirm(
        `Remove custom name "${merchant.customName}" for this merchant?`
      )
    ) {
      removeCustomMerchantName(merchant.rawMerchant, merchant.location);
      refreshCustomMerchants();
    }
  };

  const handleRemoveDefault = (merchantName, defaultName) => {
    if (
      window.confirm(`Remove the "${defaultName}" default for ${merchantName}?`)
    ) {
      removeNamedDefault(merchantName, defaultName);
      // Force parent to refresh if needed
    }
  };

  const filteredCustomMerchants = useMemo(() => {
    if (!searchTerm.trim()) return customMerchants;
    const term = searchTerm.toLowerCase();
    return customMerchants.filter(
      (merchant) =>
        merchant.customName.toLowerCase().includes(term) ||
        merchant.rawMerchant.toLowerCase().includes(term)
    );
  }, [customMerchants, searchTerm]);

  const filteredMerchantsWithDefaults = useMemo(() => {
    if (!searchTerm.trim()) return merchantsWithDefaults;
    const term = searchTerm.toLowerCase();
    return merchantsWithDefaults.filter(
      (merchant) =>
        merchant.originalName.toLowerCase().includes(term) ||
        merchant.defaults.some((def) => def.name.toLowerCase().includes(term))
    );
  }, [merchantsWithDefaults, searchTerm]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Merchant Management</h3>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        )}
      </div>

      <div className={styles.search}>
        <input
          type="text"
          placeholder="Search merchants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "custom-names" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("custom-names")}
        >
          Custom Names ({customMerchants.length})
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "defaults" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("defaults")}
        >
          Saved Defaults ({merchantsWithDefaults.length})
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "custom-names" && (
          <div className={styles.customNamesTab}>
            <div className={styles.sectionHeader}>
              <h4>Custom Merchant Names</h4>
              <p>Override how merchant names appear in your transactions</p>
            </div>

            {filteredCustomMerchants.length === 0 ? (
              <div className={styles.emptyState}>
                {searchTerm
                  ? "No merchants match your search."
                  : "No custom merchant names yet."}
              </div>
            ) : (
              <div className={styles.merchantsList}>
                {filteredCustomMerchants.map((merchant) => (
                  <div key={merchant.key} className={styles.merchantItem}>
                    <div className={styles.merchantInfo}>
                      <div className={styles.customName}>
                        {editingMerchant?.key === merchant.key ? (
                          <input
                            type="text"
                            value={newCustomName}
                            onChange={(e) => setNewCustomName(e.target.value)}
                            className={styles.editInput}
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleSaveEdit()
                            }
                            autoFocus
                          />
                        ) : (
                          <strong>{merchant.customName}</strong>
                        )}
                      </div>
                      <div className={styles.rawMerchant}>
                        Original: {merchant.rawMerchant}
                        {merchant.location && ` (${merchant.location})`}
                      </div>
                      <div className={styles.merchantStats}>
                        Used {merchant.usageCount || 0} times
                      </div>
                    </div>
                    <div className={styles.merchantActions}>
                      {editingMerchant?.key === merchant.key ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className={styles.saveButton}
                            disabled={!newCustomName.trim()}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingMerchant(null);
                              setNewCustomName("");
                            }}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditMerchant(merchant)}
                            className={styles.editButton}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveCustomName(merchant)}
                            className={styles.removeButton}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "defaults" && (
          <div className={styles.defaultsTab}>
            <div className={styles.sectionHeader}>
              <h4>Merchant Defaults</h4>
              <p>Manage saved categorization defaults for your merchants</p>
            </div>

            {filteredMerchantsWithDefaults.length === 0 ? (
              <div className={styles.emptyState}>
                {searchTerm
                  ? "No merchants match your search."
                  : "No saved defaults yet."}
              </div>
            ) : (
              <div className={styles.merchantsList}>
                {filteredMerchantsWithDefaults.map((merchant) => (
                  <div
                    key={merchant.normalizedName}
                    className={styles.merchantItem}
                  >
                    <div className={styles.merchantInfo}>
                      <div className={styles.merchantName}>
                        <strong>{merchant.originalName}</strong>
                      </div>
                      <div className={styles.defaultsList}>
                        {merchant.defaults.map((defaultData) => (
                          <div
                            key={defaultData.name}
                            className={styles.defaultItem}
                          >
                            <div className={styles.defaultInfo}>
                              <span className={styles.defaultName}>
                                {defaultData.name}
                              </span>
                              <span className={styles.defaultCategory}>
                                {defaultData.category}
                                {defaultData.subCategory &&
                                  ` → ${defaultData.subCategory}`}
                              </span>
                              {defaultData.notes && (
                                <span className={styles.defaultNotes}>
                                  "{defaultData.notes}"
                                </span>
                              )}
                              <span className={styles.defaultStats}>
                                Used {defaultData.usageCount || 0} times
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveDefault(
                                  merchant.originalName,
                                  defaultData.name
                                )
                              }
                              className={styles.removeDefaultButton}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantManager;
