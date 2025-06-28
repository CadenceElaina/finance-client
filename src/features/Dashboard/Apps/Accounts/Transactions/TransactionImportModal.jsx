import React, { useState } from "react";
import Modal from "../../../../../components/ui/Modal/Modal";
import Button from "../../../../../components/ui/Button/Button";
import Papa from "papaparse";
import styles from "./Transactions.module.css";
import { suggestCategory } from "./utils/suggestionUtils";
import { cleanMerchantName, inferTransactionType } from "./utils/dataCleaning";
import { incomeCategories, expenseCategories } from "./utils/categories";

// Helper: map CSV columns flexibly
const mapCsvRow = (row, colMap) => {
  // Fallbacks for missing columns
  return {
    date: row[colMap.date] || row["Date"] || "",
    merchant:
      row[colMap.merchant] ||
      row["Appears On Your Statement As"] ||
      row["Description"] ||
      "",
    location: [
      row[colMap.address] || row["Address"],
      row[colMap.city] || row["City/State"],
      row[colMap.zip] || row["Zip Code"],
    ]
      .filter(Boolean)
      .join(", "),
    extended_details:
      row[colMap.extended_details] || row["Extended Details"] || "",
    description: row[colMap.description] || row["Description"] || "",
    category: row[colMap.category] || row["Category"] || "",
    amount: row[colMap.amount] || row["Amount"] || "",
    reference: row[colMap.reference] || row["Reference"] || undefined,
    // country intentionally omitted
  };
};

const TransactionImportModal = ({ isOpen, onClose, onImport, accounts }) => {
  const [step, setStep] = useState(1);
  const [transactions, setTransactions] = useState([]); // {id, original, proposed, approved}
  const [approved, setApproved] = useState([]); // array of transaction ids
  const [undoStack, setUndoStack] = useState([]); // stack of {id, tx}
  const [error, setError] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [colMap, setColMap] = useState({}); // for future: allow user to map columns

  // Parse CSV and map columns
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const selectedAccount = accounts.find(
      (acc) => acc.id === selectedAccountId
    );
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Optionally: auto-detect column mapping here
        const txs = results.data.map((row, index) => {
          const orig = mapCsvRow(row, colMap);
          const suggested = suggestCategory(orig.description);
          const type = inferTransactionType(orig, selectedAccount?.type);
          // Use reference as id if present, else fallback
          const id = orig.reference || `import-${Date.now()}-${index}`;
          return {
            id,
            original: orig,
            proposed: {
              merchant_name: cleanMerchantName(orig.merchant),
              description: orig.description || "",
              details: orig.extended_details || "",
              type,
              parentCategory: suggested.parent,
              subCategory: suggested.sub,
              tags: [],
              notes: "",
            },
            approved: false,
          };
        });
        setTransactions(txs);
        setApproved([]);
        setUndoStack([]);
        setStep(2);
      },
      error: (err) => setError("Failed to parse file: " + err.message),
    });
  };

  // Approve a transaction
  const handleApprove = (id) => {
    setApproved((prev) => [...prev, id]);
    setUndoStack((prev) => [
      { id, tx: transactions.find((t) => t.id === id) },
      ...prev,
    ]);
  };
  // Undo approval
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [{ id }, ...rest] = undoStack;
    setApproved((prev) => prev.filter((aid) => aid !== id));
    setUndoStack(rest);
  };
  // Approve all
  const handleApproveAll = () => {
    setApproved(transactions.map((tx) => tx.id));
    setUndoStack(transactions.map((tx) => ({ id: tx.id, tx })).reverse());
  };
  // Reset
  const handleReset = () => {
    setApproved([]);
    setUndoStack([]);
  };

  // Edit proposed fields
  const handleTransactionChange = (id, field, value) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              proposed: {
                ...tx.proposed,
                [field]: value,
                ...(field === "parentCategory" ? { subCategory: "" } : {}),
              },
            }
          : tx
      )
    );
  };

  // Finalize import
  const handleFinalize = () => {
    const mapped = transactions.map((tx) => ({
      accountId: selectedAccountId,
      transaction_date: tx.original.date,
      amount: parseFloat(tx.original.amount),
      ...tx.proposed,
    }));
    onImport(mapped);
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setTransactions([]);
    setApproved([]);
    setUndoStack([]);
    setError("");
    setSelectedAccountId("");
    onClose();
  };

  // Progress
  const progress = transactions.length
    ? Math.round((approved.length / transactions.length) * 100)
    : 0;
  const remaining = transactions.filter((tx) => !approved.includes(tx.id));
  const approvedTxs = transactions.filter((tx) => approved.includes(tx.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetState}
      title="Import Transactions"
      // Use a custom class for modalContent to override background and width
      modalClassName="themedModal"
      contentClassName="themedModalContent"
    >
      {step === 1 && (
        <div className={styles.importStepOneContainer}>
          <div className={styles.formField}>
            <label htmlFor="import-account">Account</label>
            <select
              id="import-account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              required
            >
              <option value="">Select Account</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <p className={styles.importStepOneText}>
            Upload a CSV file of your transactions.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            disabled={!selectedAccountId}
            className={styles.importFileInput}
          />
          {error && <div className={styles.importError}>{error}</div>}
        </div>
      )}
      {step === 2 && (
        <div className={`${styles.reviewContainer} themedModalContent`}>
          <div className={styles.reviewHeaderRow}>
            <h4 className={styles.reviewTitle}>
              Review & Categorize Transactions
            </h4>
            <div className={styles.reviewProgressWrapper}>
              <div className={styles.reviewProgressBarBg}>
                <div
                  className={styles.reviewProgressBarFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.reviewProgressText}>
                {progress}% complete ({approved.length}/{transactions.length})
              </div>
            </div>
            <div className={styles.reviewHeaderActions}>
              <Button
                variant="secondary"
                onClick={handleApproveAll}
                disabled={approved.length === transactions.length}
              >
                Approve All
              </Button>
              <Button
                variant="secondary"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
              >
                Undo
              </Button>
              <Button
                variant="danger"
                onClick={handleReset}
                disabled={approved.length === 0 && undoStack.length === 0}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className={styles.reviewGrid}>
            {/* To Review Panel */}
            <div className={styles.reviewPanelToReview}>
              <h5 className={styles.reviewPanelTitle}>To Review</h5>
              {remaining.length === 0 ? (
                <div className={styles.reviewPanelEmpty}>
                  All transactions approved!
                </div>
              ) : (
                remaining.map((tx) => (
                  <div key={tx.id} className={styles.transactionReviewItem}>
                    <div className={styles.transactionReviewRow}>
                      <div className={styles.reviewTableCol}>
                        <div className={styles.reviewTableTitle}>Initial</div>
                        <table className={styles.reviewTable}>
                          <tbody>
                            <tr>
                              <td>Date</td>
                              <td>{tx.original.date}</td>
                            </tr>
                            <tr>
                              <td>Merchant</td>
                              <td>{tx.original.merchant}</td>
                            </tr>
                            <tr>
                              <td>Location</td>
                              <td>{tx.original.location}</td>
                            </tr>
                            <tr>
                              <td>Details</td>
                              <td>{tx.original.extended_details}</td>
                            </tr>
                            <tr>
                              <td>Description</td>
                              <td>{tx.original.description}</td>
                            </tr>
                            <tr>
                              <td>Category</td>
                              <td>{tx.original.category}</td>
                            </tr>
                            <tr>
                              <td>Amount</td>
                              <td>{tx.original.amount}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.reviewArrowCol}>
                        <span className={styles.reviewArrow}>&rarr;</span>
                      </div>
                      <div className={styles.reviewTableCol}>
                        <div className={styles.reviewTableTitle}>Suggested</div>
                        <table className={styles.reviewTable}>
                          <tbody>
                            <tr>
                              <td>Date</td>
                              <td>{tx.original.date}</td>
                            </tr>
                            <tr>
                              <td>Merchant</td>
                              <td>
                                <input
                                  type="text"
                                  value={tx.proposed.merchant_name}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "merchant_name",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Description</td>
                              <td>
                                <input
                                  type="text"
                                  value={tx.proposed.description}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Details</td>
                              <td>
                                <input
                                  type="text"
                                  value={tx.proposed.details}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "details",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Type</td>
                              <td>
                                <select
                                  value={tx.proposed.type}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "type",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                  <option value="transfer">Transfer</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td>Category</td>
                              <td>
                                <select
                                  value={tx.proposed.parentCategory}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "parentCategory",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                >
                                  <option value="">Select Category</option>
                                  {(tx.proposed.type === "income"
                                    ? incomeCategories.map((c) => c.name)
                                    : Object.keys(expenseCategories)
                                  ).map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td>Sub-Category</td>
                              <td>
                                <select
                                  value={tx.proposed.subCategory}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "subCategory",
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    !tx.proposed.parentCategory ||
                                    tx.proposed.type === "income"
                                  }
                                  className={styles.reviewInput}
                                >
                                  <option value="">Select Sub-Category</option>
                                  {tx.proposed.parentCategory &&
                                    expenseCategories[
                                      tx.proposed.parentCategory
                                    ]?.map((sub) => (
                                      <option key={sub} value={sub}>
                                        {sub}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td>Amount</td>
                              <td>{tx.original.amount}</td>
                            </tr>
                            <tr>
                              <td>Notes</td>
                              <td>
                                <textarea
                                  value={tx.proposed.notes}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className={styles.transactionReviewApproveRow}>
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(tx.id)}
                        size="small"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Approved Panel */}
            <div className={styles.reviewPanelApproved}>
              <h5 className={styles.reviewPanelTitle}>Approved</h5>
              <div className={styles.reviewPanelApprovedList}>
                {approvedTxs.length === 0 ? (
                  <div className={styles.reviewPanelEmptyApproved}>
                    No transactions approved yet.
                  </div>
                ) : (
                  approvedTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className={styles.transactionReviewItemApproved}
                    >
                      <div className={styles.transactionReviewItemApprovedText}>
                        <span className={styles.transactionReviewMerchant}>
                          {tx.proposed.merchant_name}
                        </span>
                        <span className={styles.transactionReviewAmount}>
                          {tx.original.amount}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className={styles.reviewFooterRow}>
            <Button onClick={resetState} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              variant="primary"
              disabled={
                approved.length !== transactions.length ||
                transactions.length === 0
              }
            >
              Import ({transactions.length})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TransactionImportModal;
