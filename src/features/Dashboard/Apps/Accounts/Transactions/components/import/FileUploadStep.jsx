import React from "react";
import Button from "../../../../../../../components/ui/Button/Button";
import styles from "./FileUploadStep.module.css";

const FileUploadStep = ({
  importableAccounts,
  selectedAccountId,
  onAccountChange,
  onFileChange,
  error,
}) => {
  const selectedAccount = importableAccounts.find(
    (acc) => (acc.id || acc.name) === selectedAccountId
  );

  return (
    <div className={styles.container}>
      <div className={styles.formField}>
        <label htmlFor="import-account">Select Account to Import Into</label>
        <select
          id="import-account"
          value={selectedAccountId}
          onChange={onAccountChange}
          required
        >
          <option value="">Select an account...</option>
          {importableAccounts?.map((acc) => (
            <option key={acc.id || acc.name} value={acc.id || acc.name}>
              {acc.name} - {acc.category} ({acc.subType})
            </option>
          ))}
        </select>
      </div>

      {selectedAccountId && (
        <p className={styles.accountTypeInfo}>
          {selectedAccount?.category === "Debt"
            ? "For debt accounts, positive amounts are new charges, and negative amounts are payments."
            : "For cash accounts, positive amounts are deposits, and negative amounts are expenses."}
        </p>
      )}

      <div className={styles.fileInputContainer}>
        <label htmlFor="csv-upload" className={styles.fileInputLabel}>
          Browse Files
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={onFileChange}
          disabled={!selectedAccountId}
          className={styles.importFileInput}
        />
        <span className={styles.fileInputText}>
          {selectedAccountId
            ? "Select a CSV file to upload."
            : "Please select an account first."}
        </span>
      </div>

      {error && <div className={styles.importError}>{error}</div>}
    </div>
  );
};

export default FileUploadStep;
