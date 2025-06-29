import React, { useState, useMemo } from "react";
import {
  getAllCustomMerchantNames,
  setCustomMerchantName,
  removeCustomMerchantName,
  getMerchantNameSuggestions,
  clearAllCustomMerchantNames,
} from "../utils/customMerchantNames";
import {
  getAllMerchantsWithDefaults,
  createNamedDefault,
  clearAllNamedDefaults,
  clearAllMerchantHistory,
} from "../utils/merchantHistory";
import Button from "../../../../../../components/ui/Button/Button";
import MerchantDefaultManager from "./MerchantDefaultManager";
import styles from "./MerchantManagementTab.module.css";

const MerchantManagementTab = () => {
  const [customMerchants, setCustomMerchants] = useState(() =>
    getAllCustomMerchantNames()
  );
  const [merchantsWithDefaults, setMerchantsWithDefaults] = useState(() =>
    getAllMerchantsWithDefaults()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("merchants");
  const [selectedMerchant, setSelectedMerchant] = useState(null); // For editing merchant defaults

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
        "Main Default",
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

  // Combined search for merchants and defaults - FIXED to consolidate properly
  const allMerchants = useMemo(() => {
    const merchantMap = new Map();

    // First, process all custom merchants and group by final merchant name
    customMerchants.forEach((customMapping) => {
      const merchantName = customMapping.customName.toLowerCase();

      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, {
          name: customMapping.customName,
          rawMappings: [],
          defaults: [],
          type: "custom",
        });
      }

      const merchant = merchantMap.get(merchantName);
      merchant.rawMappings.push({
        rawMerchant: customMapping.rawMerchant,
        location: customMapping.location,
        key: customMapping.key,
      });
    });

    // Then, add defaults to corresponding merchants
    merchantsWithDefaults.forEach((merchantWithDefaults) => {
      const merchantName = (
        merchantWithDefaults.originalName || merchantWithDefaults.normalizedName
      ).toLowerCase();

      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, {
          name:
            merchantWithDefaults.originalName ||
            merchantWithDefaults.normalizedName,
          rawMappings: [],
          defaults: [],
          type: "defaults-only",
        });
      }

      const merchant = merchantMap.get(merchantName);
      merchant.defaults = merchantWithDefaults.defaults
        ? merchantWithDefaults.defaults.map((d) => d.name)
        : [];
      merchant.merchantData = merchantWithDefaults;
    });

    return Array.from(merchantMap.values());
  }, [customMerchants, merchantsWithDefaults]);

  const filteredMerchants = useMemo(() => {
    if (!searchTerm) return allMerchants;
    const term = searchTerm.toLowerCase();
    return allMerchants.filter(
      (merchant) =>
        merchant.name.toLowerCase().includes(term) ||
        merchant.rawMappings.some(
          (mapping) =>
            mapping.rawMerchant.toLowerCase().includes(term) ||
            (mapping.location && mapping.location.toLowerCase().includes(term))
        ) ||
        merchant.defaults.some((defaultName) =>
          defaultName.toLowerCase().includes(term)
        )
    );
  }, [allMerchants, searchTerm]);

  const handleDeleteAll = () => {
    const confirmMessage = `This will delete ALL merchant data including:
- ${customMerchants.length} custom merchant names
- ${merchantsWithDefaults.length} merchants with defaults
- All merchant history and preferences

This action cannot be undone. Are you sure?`;

    if (window.confirm(confirmMessage)) {
      clearAllCustomMerchantNames();
      clearAllNamedDefaults();
      clearAllMerchantHistory();
      refreshData();
    }
  };

  const getSuggestions = (rawMerchant) => {
    return getMerchantNameSuggestions(rawMerchant);
  };

  return (
    <div className={styles.container}>
      {/* Search and Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search merchants and defaults..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.buttonGroup}>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
          >
            New Merchant
          </Button>
          {(customMerchants.length > 0 || merchantsWithDefaults.length > 0) && (
            <Button
              variant="danger"
              onClick={handleDeleteAll}
              className={styles.deleteAllButton}
              title="Delete all merchant data"
            >
              Delete All
            </Button>
          )}
        </div>
      </div>

      {/* Create New Merchant Form */}
      {showCreateForm && (
        <div className={styles.createForm}>
          <h4>Create New Merchant Mapping</h4>
          <div className={styles.formGrid}>
            <div className={styles.formContainer}>
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
                  <option value="Personal Care">Personal Care</option>
                  <option value="Education">Education</option>
                  <option value="Travel">Travel</option>
                  <option value="Home">Home</option>
                  <option value="Gifts & Donations">Gifts & Donations</option>
                  <option value="Business">Business</option>
                  <option value="Fees & Charges">Fees & Charges</option>
                  <option value="Taxes">Taxes</option>
                  <option value="Other">Other</option>
                </select>
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
                  placeholder="e.g., Gas station purchases"
                  className={styles.input}
                />
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <Button variant="primary" onClick={handleCreateMerchant}>
              Create
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
            activeTab === "merchants" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("merchants")}
        >
          All Merchants ({filteredMerchants.length})
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "stats" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("stats")}
        >
          Statistics
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "merchants" && (
          <div className={styles.merchantsList}>
            <div className={styles.sectionHeader}>
              <h4>Your Merchants & Defaults</h4>
              <p>
                Click a merchant to manage its defaults. Create multiple named
                defaults for different purposes.
              </p>
            </div>
            {filteredMerchants.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No merchants found.</p>
                <p>
                  Import transactions or create a merchant mapping to get
                  started!
                </p>
              </div>
            ) : (
              filteredMerchants.map((merchant) => (
                <div
                  key={merchant.name}
                  className={`${styles.merchantItem} ${styles.clickable}`}
                  onClick={() => setSelectedMerchant(merchant)}
                >
                  <div className={styles.merchantInfo}>
                    <div className={styles.merchantHeader}>
                      <div className={styles.merchantName}>
                        {merchant.name}
                        {merchant.type === "custom" && (
                          <span className={styles.customBadge}>Custom</span>
                        )}
                      </div>
                      <div className={styles.defaultsCount}>
                        {merchant.defaults.length} default
                        {merchant.defaults.length !== 1 ? "s" : ""} •{" "}
                        {merchant.rawMappings.length} mapping
                        {merchant.rawMappings.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {merchant.rawMappings.length > 0 && (
                      <div className={styles.rawMappings}>
                        <span className={styles.rawMappingsLabel}>
                          📋 Raw data mappings:
                        </span>
                        {merchant.rawMappings
                          .slice(0, 2)
                          .map((mapping, idx) => (
                            <div key={idx} className={styles.rawMappingItem}>
                              {mapping.rawMerchant}
                              {mapping.location && ` (${mapping.location})`}
                            </div>
                          ))}
                        {merchant.rawMappings.length > 2 && (
                          <div className={styles.moreRawMappings}>
                            +{merchant.rawMappings.length - 2} more mappings
                          </div>
                        )}
                      </div>
                    )}
                    {merchant.defaults.length > 0 && (
                      <div className={styles.defaultsList}>
                        <span className={styles.defaultsLabel}>
                          ⚙️ Defaults:
                        </span>
                        {merchant.defaults.slice(0, 3).map((defaultName) => (
                          <span key={defaultName} className={styles.defaultTag}>
                            {defaultName}
                          </span>
                        ))}
                        {merchant.defaults.length > 3 && (
                          <span className={styles.moreDefaults}>
                            +{merchant.defaults.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.merchantActions}>
                    <button
                      className={styles.editButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMerchant(merchant);
                      }}
                      title="Manage merchant"
                    >
                      ⚙️
                    </button>
                    {merchant.type === "custom" &&
                      merchant.rawMappings.length > 0 && (
                        <button
                          className={styles.removeButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Remove all custom mappings for ${merchant.name}?`
                              )
                            ) {
                              merchant.rawMappings.forEach((mapping) => {
                                removeCustomMerchantName(
                                  mapping.rawMerchant,
                                  mapping.location
                                );
                              });
                              refreshData();
                            }
                          }}
                          title="Remove all custom mappings"
                        >
                          🗑️
                        </button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className={styles.statsView}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{customMerchants.length}</div>
                <div className={styles.statLabel}>Custom Merchants</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {merchantsWithDefaults.length}
                </div>
                <div className={styles.statLabel}>Merchants with Defaults</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {merchantsWithDefaults.reduce(
                    (total, m) => total + Object.keys(m.defaults).length,
                    0
                  )}
                </div>
                <div className={styles.statLabel}>Total Defaults</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Merchant Modal for editing defaults */}
      {selectedMerchant && (
        <MerchantDefaultManager
          merchantName={selectedMerchant.name}
          onClose={() => setSelectedMerchant(null)}
          onUpdate={refreshData}
        />
      )}
    </div>
  );
};

export default MerchantManagementTab;
