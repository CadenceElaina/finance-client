import React, { useState, useMemo } from "react";
import {
  getMerchantNamedDefaults,
  getMainNamedDefault,
} from "../../utils/merchantHistory";
import {
  getMerchantDefaults,
  getMainDefault,
} from "../../utils/merchantPreferences";
import Button from "../../../../../../../components/ui/Button/Button";
import Modal from "../../../../../../../components/ui/Modal/Modal";
import MerchantManagementTab from "../MerchantManagementTab";
import styles from "./DefaultManager.module.css";

const DefaultManager = ({
  transaction,
  onTransactionChange,
  onApplyDefault,
}) => {
  const [showDefaultsManager, setShowDefaultsManager] = useState(false);

  const merchantName = transaction?.proposed?.merchant_name;

  // Get defaults from both systems
  const namedDefaults = useMemo(() => {
    return merchantName ? getMerchantNamedDefaults(merchantName) : [];
  }, [merchantName]);

  const smartDefaults = useMemo(() => {
    return merchantName ? getMerchantDefaults(merchantName) : [];
  }, [merchantName]);

  const mainDefault = useMemo(() => {
    if (!merchantName) return null;
    // Check named defaults first, then smart defaults
    const namedMain = getMainNamedDefault(merchantName);
    const smartMain = getMainDefault(merchantName);
    return namedMain || smartMain;
  }, [merchantName]);

  const totalDefaults = namedDefaults.length + smartDefaults.length;

  const handleApplyMainDefault = () => {
    if (mainDefault) {
      const defaultData = {
        category:
          mainDefault.category ||
          mainDefault.defaultCategory ||
          mainDefault.parent,
        subCategory:
          mainDefault.subCategory ||
          mainDefault.defaultSubCategory ||
          mainDefault.sub,
        notes: mainDefault.notes || mainDefault.defaultNotes || "",
        type: mainDefault.transactionType || mainDefault.type,
        isRecurring: mainDefault.isRecurring || false,
      };

      // Apply to current transaction
      Object.entries(defaultData).forEach(([field, value]) => {
        if (value) {
          onTransactionChange(field, value);
        }
      });

      if (onApplyDefault) {
        onApplyDefault(defaultData);
      }
    }
  };

  const handleOpenDefaultsManager = () => {
    setShowDefaultsManager(true);
  };

  if (!merchantName) {
    return null;
  }

  return (
    <div className={styles.defaultManager}>
      {/* Main default or defaults manager button */}
      {totalDefaults > 0 ? (
        <Button
          variant="secondary"
          size="small"
          onClick={
            totalDefaults === 1
              ? handleApplyMainDefault
              : handleOpenDefaultsManager
          }
          className={styles.mainDefaultButton}
          title={
            totalDefaults === 1
              ? `Apply default: ${mainDefault.name || "Default"}`
              : `Manage ${totalDefaults} defaults for ${merchantName}`
          }
        >
          Default ({totalDefaults})
        </Button>
      ) : null}

      {/* Merchant Management Modal */}
      {showDefaultsManager && (
        <Modal
          isOpen={showDefaultsManager}
          onClose={() => setShowDefaultsManager(false)}
          title="Merchant Management"
          modalClassName="themedModal"
        >
          <MerchantManagementTab />
        </Modal>
      )}
    </div>
  );
};

export default DefaultManager;
