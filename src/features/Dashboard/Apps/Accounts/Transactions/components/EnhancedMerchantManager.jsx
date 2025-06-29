import React, { useState, useEffect } from 'react';
import {
  getMerchantPreferences,
  getRawDataMappings,
  resetAllMerchantPreferences,
  resetMerchantPreferences,
  getMerchantPreferencesStats
} from '../utils/merchantPreferences';
import {
  getAllCustomMerchantNames
} from '../utils/customMerchantNames';
import { getAllMerchantsWithDefaults } from '../utils/merchantHistory';
import Modal from '../../../../../../components/ui/Modal/Modal';
import Button from '../../../../../../components/ui/Button/Button';
import styles from './EnhancedMerchantManager.module.css';

const EnhancedMerchantManager = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [merchantPreferences, setMerchantPreferences] = useState({});
  const [rawDataMappings, setRawDataMappings] = useState({});
  const [customNames, setCustomNames] = useState({});
  const [merchantDefaults, setMerchantDefaults] = useState({});

  useEffect(() => {
    if (isOpen) {
      refreshData();
      
      // Set up polling for real-time updates when modal is open
      const interval = setInterval(() => {
        refreshData();
      }, 2000); // Refresh every 2 seconds while open
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-refresh when window gains focus (helps with real-time updates)
    const handleFocus = () => {
      if (isOpen) {
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen]);

  const refreshData = () => {
    setStats(getMerchantPreferencesStats());
    setMerchantPreferences(getMerchantPreferences());
    setRawDataMappings(getRawDataMappings());
    setCustomNames(getAllCustomMerchantNames());
    setMerchantDefaults(getAllMerchantsWithDefaults());
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset ALL merchant preferences and data? This cannot be undone.')) {
      resetAllMerchantPreferences();
      // Also clear custom names and defaults
      localStorage.removeItem('customMerchantNames');
      localStorage.removeItem('merchantCategoryHistory');
      localStorage.removeItem('merchantNamedDefaults');
      refreshData();
    }
  };

  const handleResetMerchant = (merchantName) => {
    if (window.confirm(`Reset all data for "${merchantName}"? This cannot be undone.`)) {
      resetMerchantPreferences(merchantName);
      refreshData();
    }
  };

  const getAllMerchants = () => {
    const merchants = new Set();
    
    // Add merchants with preferences
    Object.keys(merchantPreferences).forEach(name => merchants.add(name));
    
    // Add merchants with custom names
    Object.values(customNames).forEach(data => merchants.add(data.customName));
    
    // Add merchants with defaults
    Object.keys(merchantDefaults).forEach(name => merchants.add(name));
    
    return Array.from(merchants).sort();
  };

  const filteredMerchants = getAllMerchants().filter(merchant =>
    merchant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalMerchants || 0}</div>
          <div className={styles.statLabel}>Merchants with Preferences</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalMappings || 0}</div>
          <div className={styles.statLabel}>Raw Data Mappings</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.autoApplyMerchants || 0}</div>
          <div className={styles.statLabel}>Auto-Apply Merchants</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalDefaults || 0}</div>
          <div className={styles.statLabel}>Total Defaults</div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h4>Quick Actions</h4>
        <div className={styles.actionButtons}>
          <Button 
            variant="danger" 
            onClick={handleResetAll}
          >
            Reset All Data
          </Button>
          <Button 
            variant="secondary" 
            onClick={refreshData}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h4>Recent Raw Data Mappings</h4>
        <div className={styles.mappingsList}>
          {Object.values(rawDataMappings)
            .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
            .slice(0, 5)
            .map((mapping, index) => (
              <div key={index} className={styles.mappingItem}>
                <div className={styles.mappingInfo}>
                  <div className={styles.mappingRaw}>{mapping.rawMerchant}</div>
                  <div className={styles.mappingArrow}>→</div>
                  <div className={styles.mappingMerchant}>{mapping.merchantName}</div>
                </div>
                <div className={styles.mappingMeta}>
                  {mapping.autoApply && <span className={styles.autoApplyBadge}>Auto-Apply</span>}
                  <span className={styles.usageCount}>Used {mapping.usageCount || 0} times</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderMerchantList = () => (
    <div className={styles.merchantList}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search merchants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.merchantGrid}>
        {filteredMerchants.map(merchantName => {
          const prefs = merchantPreferences[merchantName] || {};
          const defaults = merchantDefaults[merchantName] || [];
          const mappings = Object.values(rawDataMappings).filter(m => m.merchantName === merchantName);

          return (
            <div key={merchantName} className={styles.merchantCard}>
              <div className={styles.merchantHeader}>
                <h5 className={styles.merchantName}>{merchantName}</h5>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleResetMerchant(merchantName)}
                >
                  Reset
                </Button>
              </div>

              <div className={styles.merchantDetails}>
                {prefs.autoApplyMerchant && (
                  <div className={styles.preference}>
                    <span className={styles.autoApplyBadge}>Auto-Apply Enabled</span>
                  </div>
                )}
                
                {prefs.mainDefaultName && (
                  <div className={styles.preference}>
                    <strong>Main Default:</strong> {prefs.mainDefaultName}
                  </div>
                )}

                <div className={styles.preference}>
                  <strong>Defaults:</strong> {defaults.length}
                </div>

                <div className={styles.preference}>
                  <strong>Raw Data Mappings:</strong> {mappings.length}
                </div>

                {mappings.length > 0 && (
                  <div className={styles.mappingsPreview}>
                    <strong>Mapped from:</strong>
                    {mappings.slice(0, 2).map((mapping, index) => (
                      <div key={index} className={styles.mappingPreview}>
                        • {mapping.rawMerchant}
                        {mapping.autoApply && <span className={styles.autoApplyBadge}>Auto</span>}
                      </div>
                    ))}
                    {mappings.length > 2 && (
                      <div className={styles.mappingMore}>
                        +{mappings.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRawDataMappings = () => (
    <div className={styles.rawDataMappings}>
      <div className={styles.sectionHeader}>
        <h4>Raw Data → Merchant Mappings</h4>
        <p>These mappings link raw transaction data to clean merchant names</p>
      </div>

      <div className={styles.mappingsList}>
        {Object.values(rawDataMappings)
          .filter(mapping => 
            mapping.rawMerchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.merchantName.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((mapping, index) => (
            <div key={index} className={styles.mappingCard}>
              <div className={styles.mappingFlow}>
                <div className={styles.mappingSource}>
                  <div className={styles.mappingLabel}>Raw Data</div>
                  <div className={styles.mappingValue}>{mapping.rawMerchant}</div>
                  {mapping.location && (
                    <div className={styles.mappingLocation}>📍 {mapping.location}</div>
                  )}
                </div>
                <div className={styles.mappingArrow}>→</div>
                <div className={styles.mappingTarget}>
                  <div className={styles.mappingLabel}>Merchant Name</div>
                  <div className={styles.mappingValue}>{mapping.merchantName}</div>
                </div>
              </div>
              
              <div className={styles.mappingMeta}>
                <div className={styles.mappingStats}>
                  <span>Used {mapping.usageCount || 0} times</span>
                  <span>Last used: {mapping.lastUsed ? new Date(mapping.lastUsed).toLocaleDateString() : 'Never'}</span>
                </div>
                <div className={styles.mappingBadges}>
                  {mapping.autoApply && <span className={styles.autoApplyBadge}>Auto-Apply</span>}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enhanced Merchant Manager"
    >
      <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'merchants' ? styles.active : ''}`}
            onClick={() => setActiveTab('merchants')}
          >
            Merchants
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'mappings' ? styles.active : ''}`}
            onClick={() => setActiveTab('mappings')}
          >
            Raw Data Mappings
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'merchants' && renderMerchantList()}
          {activeTab === 'mappings' && renderRawDataMappings()}
        </div>
      </div>
    </Modal>
  );
};

export default EnhancedMerchantManager;
