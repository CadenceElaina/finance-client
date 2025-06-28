import React, { useState, useMemo, useCallback } from "react";
import Modal from "../../../../../components/ui/Modal/Modal";
import Button from "../../../../../components/ui/Button/Button";
import Papa from "papaparse";
import styles from "./Transactions.module.css";
import { suggestCategory } from "./utils/suggestionUtils";
import {
  cleanMerchantName,
  formatDescription,
  formatLocation,
  inferTransactionType,
  detectRecurring,
} from "./utils/dataCleaning";
import { incomeCategories, expenseCategories } from "./utils/categories";
import {
  recordMerchantChoice,
  isKnownMerchant,
  getMerchantPreference,
  isValidMerchantChoice,
  getMerchantNamedDefaults,
} from "./utils/merchantHistory";
import { getFinalMerchantName } from "./utils/customMerchantNames";
import NamedDefaultsManager from "./components/NamedDefaultsManager";
import MerchantManager from "./components/MerchantManager";
import InlineMerchantEditor from "./components/InlineMerchantEditor";

const mapCsvRow = (row) => {
  const get = (key, fallback = "") => {
    const lowerKey = key.toLowerCase();
    const realKey = Object.keys(row).find((k) => k.toLowerCase() === lowerKey);
    return realKey ? row[realKey] : fallback;
  };

  return {
    date: get("Date"),
    merchant: get("Appears On Your Statement As", get("Description")),
    address: get("Address"),
    cityState: get("City/State"),
    zipCode: get("Zip Code"),
    extended_details: get("Extended Details"),
    description: get("Description"),
    category: get("Category"),
    amount: get("Amount"),
    reference: get("Reference"),
  };
};

const TransactionImportModal = ({ isOpen, onClose, onImport, accounts }) => {
  const [step, setStep] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [approved, setApproved] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [error, setError] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [preferencesUpdateKey, setPreferencesUpdateKey] = useState(0);
  const [showingDefaultsFor, setShowingDefaultsFor] = useState(null); // Track which transaction is showing defaults
  const [showMerchantManager, setShowMerchantManager] = useState(false);
  const [editingMerchantFor, setEditingMerchantFor] = useState(null); // Track which merchant is being edited

  const importableAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    // Filter accounts that can receive imported transactions
    // Cash accounts: checking, savings, cash
    // Debt accounts: credit cards, loans, etc.
    const allowedCategories = ["Cash", "Debt"];
    const allowedSubTypes = [
      "checking",
      "savings",
      "cash",
      "money market",
      "credit card",
      "mortgage",
      "personal loan",
      "auto loan",
      "student loan",
      "line of credit",
      "other debt",
    ];

    return accounts.filter((acc) => {
      const category = acc.category?.toLowerCase();
      const subType = acc.subType?.toLowerCase();

      // Include if category matches or subType matches
      return (
        allowedCategories.some((cat) => cat.toLowerCase() === category) ||
        allowedSubTypes.includes(subType)
      );
    });
  }, [accounts]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedAccountId) return;

    const selectedAccount = importableAccounts.find(
      (acc) =>
        (acc.id && acc.id === selectedAccountId) ||
        acc.name === selectedAccountId
    );

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const txs = results.data.map((row, index) => {
          const original = mapCsvRow(row);
          const location = formatLocation(
            original.address,
            original.cityState,
            original.zipCode
          );

          // Use custom merchant name if user has set one, otherwise use cleaned name
          const finalMerchantName = getFinalMerchantName(
            original.merchant,
            location,
            cleanMerchantName
          );

          const suggested = suggestCategory(
            original.description,
            finalMerchantName,
            original.extended_details
          );
          const type =
            suggested.transactionType ||
            inferTransactionType(
              original,
              selectedAccount?.subType?.toLowerCase(),
              selectedAccount?.category?.toLowerCase()
            );
          const id = original.reference || `import-${Date.now()}-${index}`;

          return {
            id,
            original,
            suggested, // Store the suggestion metadata
            proposed: {
              merchant_name: finalMerchantName,
              location,
              description: formatDescription(original),
              type,
              isRecurring: detectRecurring(
                original.description,
                original.merchant
              ),
              category: suggested.parent,
              subCategory: suggested.sub,
              notes: "",
              isAutoSuggested: true, // Track if this is an auto-suggestion
            },
            approved: false,
          };
        });
        setTransactions(txs);
        setApproved([]);
        setUndoStack([]);
        setStep(2);
      },
      error: (err) => setError(`Failed to parse file: ${err.message}`),
    });
  };

  const handleApprove = (id) => {
    setApproved((prev) => [...prev, id]);
    setUndoStack((prev) => [
      { id, tx: transactions.find((t) => t.id === id) },
      ...prev,
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [{ id }] = undoStack;
    setApproved((prev) => prev.filter((aid) => aid !== id));
    setUndoStack((prev) => prev.slice(1));
  };

  const handleApproveAll = () => {
    // Only approve transactions that are valid
    const validTransactionIds = transactions
      .filter((tx) => isTransactionValid(tx))
      .map((tx) => tx.id);

    setApproved((prev) => {
      const newApproved = [...new Set([...prev, ...validTransactionIds])];
      return newApproved;
    });

    const newlyApproved = transactions.filter(
      (tx) => isTransactionValid(tx) && !approved.includes(tx.id)
    );

    setUndoStack((prev) => [
      ...newlyApproved.map((tx) => ({ id: tx.id, tx })).reverse(),
      ...prev,
    ]);
  };

  const handleApproveAllWithDefaults = () => {
    // Approve transactions that have merchant defaults (old system) or named defaults (new system) and are valid
    const transactionsWithDefaults = transactions.filter((tx) => {
      if (approved.includes(tx.id)) return false; // Skip already approved

      // Check old system defaults
      const merchantPreference = getMerchantPreference(
        tx.proposed.merchant_name
      );
      const hasValidOldDefault =
        merchantPreference &&
        merchantPreference.confidence >= 0.7 &&
        merchantPreference.parent &&
        merchantPreference.parent !== "Select Category" &&
        (tx.proposed.type === "income" ||
          (merchantPreference.sub &&
            merchantPreference.sub !== "Select Sub-Category"));

      // Check new system named defaults
      const namedDefaults = getMerchantNamedDefaults(tx.proposed.merchant_name);
      const hasNamedDefaults = namedDefaults.length > 0;

      return (hasValidOldDefault || hasNamedDefaults) && isTransactionValid(tx);
    });

    const transactionIds = transactionsWithDefaults.map((tx) => tx.id);

    setApproved((prev) => {
      const newApproved = [...new Set([...prev, ...transactionIds])];
      return newApproved;
    });

    setUndoStack((prev) => [
      ...transactionsWithDefaults.map((tx) => ({ id: tx.id, tx })).reverse(),
      ...prev,
    ]);
  };

  const handleUnapprove = (id) => {
    setApproved((prev) => prev.filter((aid) => aid !== id));
    // Add to undo stack for potential re-approval
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      setUndoStack((prev) => [{ id, tx }, ...prev]);
    }
  };

  const handleReset = () => {
    setApproved([]);
    setUndoStack([]);
  };

  const handleTransactionChange = (id, field, value) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const updatedTx = {
            ...tx,
            proposed: {
              ...tx.proposed,
              [field]: value,
              ...(field === "category" && { subCategory: "" }),
              // Mark as manually modified when user changes category/subcategory
              isAutoSuggested:
                field === "category" || field === "subCategory"
                  ? false
                  : tx.proposed.isAutoSuggested,
            },
          };

          // Record merchant choice when category or subCategory changes manually
          if (
            (field === "category" || field === "subCategory") &&
            tx.proposed.merchant_name &&
            !tx.proposed.isAutoSuggested
          ) {
            const selectedAccount = importableAccounts.find(
              (acc) =>
                (acc.id && acc.id === selectedAccountId) ||
                acc.name === selectedAccountId
            );

            // For category changes, record immediately if valid
            if (field === "category" && value) {
              if (
                isValidMerchantChoice(
                  tx.proposed.merchant_name,
                  value,
                  "",
                  updatedTx.proposed.type
                )
              ) {
                recordMerchantChoice(
                  tx.proposed.merchant_name,
                  value,
                  "",
                  selectedAccount?.category?.toLowerCase() || "",
                  updatedTx.proposed.type
                );
              }
            }
            // For subcategory changes, record with both category and subcategory if valid
            else if (
              field === "subCategory" &&
              value &&
              updatedTx.proposed.category
            ) {
              if (
                isValidMerchantChoice(
                  tx.proposed.merchant_name,
                  updatedTx.proposed.category,
                  value,
                  updatedTx.proposed.type
                )
              ) {
                recordMerchantChoice(
                  tx.proposed.merchant_name,
                  updatedTx.proposed.category,
                  value,
                  selectedAccount?.category?.toLowerCase() || "",
                  updatedTx.proposed.type
                );
              }
            }
          }

          return updatedTx;
        }
        return tx;
      })
    );
  };

  const handleFinalize = () => {
    const selectedAccount = importableAccounts.find(
      (acc) =>
        (acc.id && acc.id === selectedAccountId) ||
        acc.name === selectedAccountId
    );

    const importedTransactions = transactions
      .filter((tx) => approved.includes(tx.id))
      .map((tx) => {
        // Record merchant choice for approved transactions if valid
        if (
          tx.proposed.merchant_name &&
          isValidMerchantChoice(
            tx.proposed.merchant_name,
            tx.proposed.category,
            tx.proposed.subCategory,
            tx.proposed.type
          )
        ) {
          recordMerchantChoice(
            tx.proposed.merchant_name,
            tx.proposed.category,
            tx.proposed.subCategory || "",
            selectedAccount?.category?.toLowerCase() || "",
            tx.proposed.type
          );
        }

        return {
          account_id: selectedAccountId,
          transaction_date: tx.original.date,
          amount: parseFloat(tx.original.amount),
          merchant_name: tx.proposed.merchant_name,
          location: tx.proposed.location,
          description: tx.proposed.description,
          type: tx.proposed.type,
          category_id: tx.proposed.category,
          subCategory: tx.proposed.subCategory,
          is_recurring: tx.proposed.isRecurring,
          notes: tx.proposed.notes,
        };
      });
    onImport(importedTransactions);
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setTransactions([]);
    setApproved([]);
    setUndoStack([]);
    setError("");
    setSelectedAccountId("");
    setSearchTerm("");
    setShowingDefaultsFor(null);
    setShowMerchantManager(false);
    setEditingMerchantFor(null);
    onClose();
  };

  const progress = transactions.length
    ? Math.round((approved.length / transactions.length) * 100)
    : 0;

  const isTransactionValid = useCallback((tx) => {
    const { merchant_name, description, type, category, subCategory } =
      tx.proposed;
    const requiredFields = [merchant_name, description, type, category];

    // Sub-category is required for expenses
    if (type === "expense") {
      requiredFields.push(subCategory);
    }

    return requiredFields.every((field) => field && field.trim().length > 0);
  }, []);

  // Filter transactions based on search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter((tx) => {
      return (
        tx.proposed.merchant_name?.toLowerCase().includes(term) ||
        tx.proposed.description?.toLowerCase().includes(term) ||
        tx.proposed.category?.toLowerCase().includes(term) ||
        tx.proposed.subCategory?.toLowerCase().includes(term) ||
        tx.original.extended_details?.toLowerCase().includes(term) ||
        parseFloat(tx.original.amount).toString().includes(term)
      );
    });
  }, [transactions, searchTerm]);

  const remaining = useMemo(
    () => filteredTransactions.filter((tx) => !approved.includes(tx.id)),
    [filteredTransactions, approved]
  );
  const approvedTxs = useMemo(
    () => filteredTransactions.filter((tx) => approved.includes(tx.id)),
    [filteredTransactions, approved]
  );

  // Count transactions with defaults for the approve button
  const transactionsWithDefaults = useMemo(() => {
    return transactions.filter((tx) => {
      if (approved.includes(tx.id)) return false;

      // Check old system defaults
      const merchantPreference = getMerchantPreference(
        tx.proposed.merchant_name
      );
      const hasValidOldDefault =
        merchantPreference &&
        merchantPreference.confidence >= 0.7 &&
        merchantPreference.parent &&
        merchantPreference.parent !== "Select Category" &&
        (tx.proposed.type === "income" ||
          (merchantPreference.sub &&
            merchantPreference.sub !== "Select Sub-Category"));

      // Check new system named defaults
      const namedDefaults = getMerchantNamedDefaults(tx.proposed.merchant_name);
      const hasNamedDefaults = namedDefaults.length > 0;

      return (hasValidOldDefault || hasNamedDefaults) && isTransactionValid(tx);
    });
  }, [transactions, approved, isTransactionValid, preferencesUpdateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate how many transactions are valid and can be approved
  const validTransactions = useMemo(
    () => transactions.filter((tx) => isTransactionValid(tx)),
    [transactions, isTransactionValid]
  );
  const remainingValidCount = useMemo(
    () => validTransactions.filter((tx) => !approved.includes(tx.id)).length,
    [validTransactions, approved]
  );

  const handleNamedDefaultSelected = (transactionId, defaultData) => {
    // Apply the selected default to the transaction
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === transactionId) {
          return {
            ...tx,
            proposed: {
              ...tx.proposed,
              category: defaultData.category,
              subCategory: defaultData.subCategory,
              notes: defaultData.notes || tx.proposed.notes,
              isAutoSuggested: false, // Mark as manually selected
            },
          };
        }
        return tx;
      })
    );

    // Hide the defaults manager
    setShowingDefaultsFor(null);
  };

  const handleToggleDefaultsManager = (transactionId) => {
    setShowingDefaultsFor(
      showingDefaultsFor === transactionId ? null : transactionId
    );
  };

  const handleDefaultsChanged = () => {
    // Force a re-render when defaults are created/removed
    setPreferencesUpdateKey((prev) => prev + 1);
  };

  const handleMerchantNameUpdate = (transactionId, newName) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === transactionId) {
          return {
            ...tx,
            proposed: {
              ...tx.proposed,
              merchant_name: newName,
              isAutoSuggested: false, // Mark as manually modified
            },
          };
        }
        return tx;
      })
    );
    setEditingMerchantFor(null);
    // Force refresh to update any cached data
    setPreferencesUpdateKey((prev) => prev + 1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetState}
      title="Import Transactions"
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
              {importableAccounts?.map((acc) => (
                <option key={acc.id || acc.name} value={acc.id || acc.name}>
                  {acc.name} - {acc.category} ({acc.subType})
                </option>
              ))}
            </select>
            {selectedAccountId && (
              <p className={styles.accountTypeInfo}>
                {importableAccounts.find(
                  (acc) => (acc.id || acc.name) === selectedAccountId
                )?.category === "Debt"
                  ? "For debt accounts: positive amounts = new charges/expenses, negative amounts = payments/credits"
                  : "For cash accounts: positive amounts = deposits/income, negative amounts = withdrawals/expenses"}
              </p>
            )}
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
                onClick={handleApproveAllWithDefaults}
                disabled={transactionsWithDefaults.length === 0}
                title={
                  transactionsWithDefaults.length > 0
                    ? `Approve ${transactionsWithDefaults.length} transaction${
                        transactionsWithDefaults.length !== 1 ? "s" : ""
                      } with learned defaults`
                    : "No transactions with learned defaults to approve"
                }
              >
                Approve All with Defaults ({transactionsWithDefaults.length})
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
                disabled={approved.length === 0}
              >
                Reset
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowMerchantManager(true)}
                style={{ marginLeft: "8px" }}
              >
                Manage Merchants
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div
            className={styles.searchContainer}
            style={{
              margin: "16px 0",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              border: "1px solid #e9ecef",
            }}
          >
            <label
              htmlFor="transaction-search"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Search Transactions:
            </label>
            <input
              id="transaction-search"
              type="text"
              placeholder="Search by merchant, description, category, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            {searchTerm && (
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
              >
                Showing {remaining.length + approvedTxs.length} of{" "}
                {transactions.length} transactions
              </div>
            )}
          </div>

          <div className={styles.reviewGrid}>
            <div className={styles.reviewPanelToReview}>
              <h5 className={styles.reviewPanelTitle}>To Review</h5>
              {remaining.length === 0 ? (
                <div className={styles.reviewPanelEmpty}>
                  All transactions approved!
                </div>
              ) : (
                remaining.map((tx) => (
                  <div key={tx.id} className={styles.transactionReviewItem}>
                    <div className={styles.reviewTablesRow}>
                      {/* Initial Data */}
                      <div className={styles.reviewTableCol}>
                        <div className={styles.reviewTableTitle}>Initial</div>
                        <table className={styles.reviewTable}>
                          <tbody>
                            <tr>
                              <td>Date:</td>
                              <td>{tx.original.date}</td>
                            </tr>
                            <tr>
                              <td>Merchant:</td>
                              <td>{tx.original.merchant}</td>
                            </tr>
                            <tr>
                              <td>Description:</td>
                              <td>{tx.original.description}</td>
                            </tr>
                            <tr>
                              <td>Extended Details:</td>
                              <td>{tx.original.extended_details}</td>
                            </tr>
                            <tr>
                              <td>Location:</td>
                              <td>
                                {formatLocation(
                                  tx.original.address,
                                  tx.original.cityState,
                                  tx.original.zipCode
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Amount:</td>
                              <td>{tx.original.amount}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.reviewArrowCol}>
                        <span className={styles.reviewArrow}>&rarr;</span>
                      </div>
                      {/* Suggested/Editable Data */}
                      <div className={styles.reviewTableCol}>
                        <div className={styles.reviewTableTitle}>Suggested</div>
                        <table className={styles.reviewTable}>
                          <tbody>
                            <tr>
                              <td>
                                Merchant:
                                <span className={styles.required}>*</span>
                              </td>
                              <td>
                                {editingMerchantFor === tx.id ? (
                                  <InlineMerchantEditor
                                    rawMerchant={tx.original.merchant}
                                    location={tx.proposed.location}
                                    currentName={tx.proposed.merchant_name}
                                    onUpdate={(newName) =>
                                      handleMerchantNameUpdate(tx.id, newName)
                                    }
                                    onCancel={() => setEditingMerchantFor(null)}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
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
                                      className={`${styles.reviewInput} ${
                                        !tx.proposed.merchant_name
                                          ? styles.invalid
                                          : ""
                                      }`}
                                      required
                                      style={{ flex: 1 }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingMerchantFor(tx.id)
                                      }
                                      style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        background: "#f8f9fa",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "3px",
                                        cursor: "pointer",
                                        color: "#6c757d",
                                      }}
                                      title="Edit merchant name with suggestions"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Location:</td>
                              <td>
                                <input
                                  type="text"
                                  value={tx.proposed.location}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Description:
                                <span className={styles.required}>*</span>
                              </td>
                              <td>
                                <textarea
                                  value={tx.proposed.description}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className={`${styles.reviewInput} ${
                                    !tx.proposed.description
                                      ? styles.invalid
                                      : ""
                                  }`}
                                  rows={2}
                                  required
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Type:<span className={styles.required}>*</span>
                              </td>
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
                                  className={`${styles.reviewInput} ${
                                    !tx.proposed.type ? styles.invalid : ""
                                  }`}
                                  required
                                >
                                  <option value="">Select Type</option>
                                  <option value="income">Income</option>
                                  <option value="expense">Expense</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Category:
                                <span className={styles.required}>*</span>
                                {tx.proposed.isAutoSuggested && (
                                  <div
                                    style={{
                                      fontSize: "10px",
                                      color: "#0066cc",
                                      marginTop: "2px",
                                    }}
                                  >
                                    🤖 Auto-suggested
                                  </div>
                                )}
                              </td>
                              <td>
                                <select
                                  value={tx.proposed.category}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "category",
                                      e.target.value
                                    )
                                  }
                                  className={`${styles.reviewInput} ${
                                    !tx.proposed.category ? styles.invalid : ""
                                  }`}
                                  required
                                >
                                  <option value="">Select Category</option>
                                  {(tx.proposed.type === "income"
                                    ? incomeCategories
                                    : Object.keys(expenseCategories)
                                  ).map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                                {isKnownMerchant(tx.proposed.merchant_name) && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#0066cc",
                                      marginTop: "4px",
                                    }}
                                  >
                                    💡 This merchant has learned preferences
                                  </div>
                                )}
                                {tx.suggested && tx.suggested.source && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#666",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {tx.suggested.source ===
                                      "merchant_history" &&
                                      "🎯 Based on your previous choices"}
                                    {tx.suggested.source ===
                                      "merchant_pattern" &&
                                      "🏪 Based on merchant type"}
                                    {tx.suggested.source === "keywords" &&
                                      "🔍 Based on description keywords"}
                                    {tx.suggested.source === "default" &&
                                      "📝 Default suggestion"}
                                    {tx.suggested.confidence &&
                                      ` (${Math.round(
                                        tx.suggested.confidence * 100
                                      )}% confidence)`}
                                  </div>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Sub-Category:
                                {tx.proposed.type === "expense" && (
                                  <span className={styles.required}>*</span>
                                )}
                              </td>
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
                                    !tx.proposed.category ||
                                    tx.proposed.type === "income"
                                  }
                                  className={`${styles.reviewInput} ${
                                    !tx.proposed.subCategory &&
                                    tx.proposed.type === "expense"
                                      ? styles.invalid
                                      : ""
                                  }`}
                                  required={tx.proposed.type === "expense"}
                                  style={{
                                    display:
                                      tx.proposed.type === "income"
                                        ? "none"
                                        : "block",
                                  }}
                                >
                                  <option value="">Select Sub-Category</option>
                                  {tx.proposed.category &&
                                    expenseCategories[
                                      tx.proposed.category
                                    ]?.map((sub) => (
                                      <option key={sub} value={sub}>
                                        {sub}
                                      </option>
                                    ))}
                                </select>
                                {tx.proposed.type === "income" && (
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "#666",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Income categories don't have sub-categories
                                  </span>
                                )}
                              </td>
                            </tr>
                            {tx.proposed.merchant_name && (
                              <tr>
                                <td>Saved Defaults:</td>
                                <td>
                                  {(() => {
                                    const namedDefaults =
                                      getMerchantNamedDefaults(
                                        tx.proposed.merchant_name
                                      );
                                    return (
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleDefaultsManager(tx.id)
                                          }
                                          style={{
                                            fontSize: "12px",
                                            padding: "4px 8px",
                                            background:
                                              showingDefaultsFor === tx.id
                                                ? "#0056b3"
                                                : namedDefaults.length > 0
                                                ? "#28a745"
                                                : "#007bff",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {showingDefaultsFor === tx.id
                                            ? "Hide Defaults"
                                            : namedDefaults.length > 0
                                            ? `Use ${
                                                namedDefaults.length
                                              } Saved Default${
                                                namedDefaults.length !== 1
                                                  ? "s"
                                                  : ""
                                              }`
                                            : "Create New Default"}
                                        </button>
                                        {namedDefaults.length > 0 &&
                                          showingDefaultsFor !== tx.id && (
                                            <div
                                              style={{
                                                fontSize: "10px",
                                                color: "#666",
                                                marginTop: "2px",
                                              }}
                                            >
                                              {namedDefaults.length} saved
                                              default
                                              {namedDefaults.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                              available
                                            </div>
                                          )}
                                      </div>
                                    );
                                  })()}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td>Recurring:</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={tx.proposed.isRecurring}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "isRecurring",
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Notes:</td>
                              <td>
                                <input
                                  type="text"
                                  value={tx.proposed.notes}
                                  onChange={(e) =>
                                    handleTransactionChange(
                                      tx.id,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  className={styles.reviewInput}
                                  placeholder="Optional notes..."
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Named Defaults Manager */}
                        {showingDefaultsFor === tx.id &&
                          tx.proposed.merchant_name && (
                            <NamedDefaultsManager
                              merchantName={tx.proposed.merchant_name}
                              onDefaultSelected={(defaultData) =>
                                handleNamedDefaultSelected(tx.id, defaultData)
                              }
                              onDefaultsChanged={handleDefaultsChanged}
                              transactionType={tx.proposed.type}
                            />
                          )}
                      </div>
                    </div>
                    <div className={styles.reviewApproveBtnRow}>
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(tx.id)}
                        size="small"
                        disabled={!isTransactionValid(tx)}
                        title={
                          !isTransactionValid(tx)
                            ? "Please fill in all required fields"
                            : ""
                        }
                      >
                        Approve
                      </Button>
                    </div>
                    {/* Named Defaults Manager */}
                    {tx.proposed.merchant_name && (
                      <div className={styles.namedDefaultsContainer}>
                        <Button
                          variant="link"
                          onClick={() => handleToggleDefaultsManager(tx.id)}
                          className={styles.namedDefaultsToggle}
                        >
                          {showingDefaultsFor === tx.id
                            ? "Hide Named Defaults"
                            : "Show Named Defaults"}
                        </Button>
                        {showingDefaultsFor === tx.id && (
                          <NamedDefaultsManager
                            merchantName={tx.proposed.merchant_name}
                            onSelectDefault={(defaultData) =>
                              handleNamedDefaultSelected(tx.id, defaultData)
                            }
                            onClose={() => setShowingDefaultsFor(null)}
                            key={preferencesUpdateKey} // Re-render when preferences change
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className={styles.reviewPanelApproved}>
              <h5 className={styles.reviewPanelTitle}>Approved</h5>
              <div className={styles.approvedList}>
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <div>
                          <div className={styles.approvedText}>
                            {tx.proposed.merchant_name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {tx.proposed.category}
                            {tx.proposed.subCategory &&
                              ` → ${tx.proposed.subCategory}`}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className={styles.approvedAmount}>
                            {tx.original.amount}
                          </span>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleUnapprove(tx.id)}
                            title="Return to review list"
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              minWidth: "auto",
                            }}
                          >
                            ↶ Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className={styles.reviewFooter}>
            <Button onClick={resetState} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              variant="primary"
              disabled={approved.length === 0}
            >
              Import ({approved.length}) Approved
            </Button>
          </div>
        </div>
      )}

      {/* Merchant Manager Modal */}
      {showMerchantManager && (
        <MerchantManager
          onClose={() => {
            setShowMerchantManager(false);
            // Refresh transactions to reflect any merchant name changes
            setPreferencesUpdateKey((prev) => prev + 1);
          }}
        />
      )}
    </Modal>
  );
};

export default TransactionImportModal;
