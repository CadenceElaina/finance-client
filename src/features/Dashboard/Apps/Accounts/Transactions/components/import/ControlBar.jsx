import React from "react";
import Button from "../../../../../../../components/ui/Button/Button";
import styles from "./ControlBar.module.css";

const ControlBar = ({
  progress,
  approvedCount,
  totalCount,
  onApproveAllValid,
  remainingValidCount,
  onApproveAllWithDefaults,
  transactionsWithDefaultsCount,
  onUndo,
  canUndo,
  onReset,
  canReset,
  onManageMerchants,
}) => {
  return (
    <div className={styles.reviewHeaderRow}>
      <div className={styles.reviewProgressWrapper}>
        <div className={styles.reviewProgressBarBg}>
          <div
            className={styles.reviewProgressBarFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles.reviewProgressText}>
          {progress}% complete ({approvedCount}/{totalCount})
        </div>
      </div>
      <div className={styles.reviewHeaderActions}>
        <Button
          variant="secondary"
          onClick={onApproveAllValid}
          disabled={remainingValidCount === 0}
          title={
            remainingValidCount > 0
              ? `Approve ${remainingValidCount} valid transaction${
                  remainingValidCount !== 1 ? "s" : ""
                }`
              : "No valid transactions to approve"
          }
        >
          Approve All Valid ({remainingValidCount})
        </Button>
        <Button
          variant="secondary"
          onClick={onApproveAllWithDefaults}
          disabled={transactionsWithDefaultsCount === 0}
          title={
            transactionsWithDefaultsCount > 0
              ? `Approve ${transactionsWithDefaultsCount} transaction${
                  transactionsWithDefaultsCount !== 1 ? "s" : ""
                } with learned defaults`
              : "No transactions with learned defaults to approve"
          }
        >
          Approve All with Defaults ({transactionsWithDefaultsCount})
        </Button>
        <Button variant="secondary" onClick={onUndo} disabled={!canUndo}>
          Undo
        </Button>
        <Button variant="danger" onClick={onReset} disabled={!canReset}>
          Reset
        </Button>
        <Button
          variant="secondary"
          onClick={onManageMerchants}
          style={{ marginLeft: "8px" }}
        >
          Manage Merchants
        </Button>
      </div>
    </div>
  );
};

export default ControlBar;
