import React from "react";
import Modal from "../../../../../../components/ui/Modal/Modal";
import Button from "../../../../../../components/ui/Button/Button";
import {
  formatCurrencyForSummary,
  formatDateRangeForSummary,
} from "../utils/bulkTransactionUtils";
import styles from "./BulkOperationModal.module.css";

const BulkOperationModal = ({
  isOpen,
  onClose,
  onConfirm,
  operation,
  summary,
  operationData,
}) => {
  if (!isOpen || !summary) return null;

  const getOperationTitle = () => {
    switch (operation) {
      case "applyCategory":
        return "Apply Category to All Matching Transactions";
      case "applyMerchantName":
        return "Apply Merchant Name to All Matching Transactions";
      default:
        return "Bulk Operation Confirmation";
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case "applyCategory":
        return `Apply the category "${operationData.category}" ${
          operationData.subCategory ? `(${operationData.subCategory})` : ""
        } to all ${summary.count} matching transactions?`;
      case "applyMerchantName":
        return `Apply the merchant name "${operationData.merchantName}" to all ${summary.count} matching transactions?`;
      default:
        return `Apply this operation to ${summary.count} transactions?`;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getOperationTitle()}>
      <div className={styles.content}>
        <div className={styles.description}>{getOperationDescription()}</div>

        <div className={styles.summary}>
          <div className={styles.summaryHeader}>
            <h4>Operation Summary</h4>
          </div>

          <div className={styles.summaryStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Transactions:</span>
              <span className={styles.statValue}>{summary.count}</span>
            </div>

            <div className={styles.stat}>
              <span className={styles.statLabel}>Total Amount:</span>
              <span className={styles.statValue}>
                {formatCurrencyForSummary(summary.totalAmount)}
              </span>
            </div>

            {summary.dateRange && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Date Range:</span>
                <span className={styles.statValue}>
                  {formatDateRangeForSummary(summary.dateRange)}
                </span>
              </div>
            )}
          </div>

          {summary.preview && summary.preview.length > 0 && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>
                <h5>Sample Transactions</h5>
              </div>
              <div className={styles.previewList}>
                {summary.preview.map((tx, index) => (
                  <div key={index} className={styles.previewItem}>
                    <div className={styles.previewDate}>
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                    <div className={styles.previewMerchant}>{tx.merchant}</div>
                    <div className={styles.previewAmount}>
                      {formatCurrencyForSummary(parseFloat(tx.amount))}
                    </div>
                    {operation === "applyCategory" && (
                      <div className={styles.previewCategory}>
                        Current: {tx.currentCategory || "Uncategorized"}
                        {tx.currentSubCategory && ` > ${tx.currentSubCategory}`}
                      </div>
                    )}
                  </div>
                ))}
                {summary.count > 3 && (
                  <div className={styles.previewMore}>
                    ... and {summary.count - 3} more transactions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.warning}>
          <strong>⚠️ Warning:</strong> This action will update all matching
          transactions. This cannot be undone easily.
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Apply to All {summary.count} Transactions
        </Button>
      </div>
    </Modal>
  );
};

export default BulkOperationModal;
