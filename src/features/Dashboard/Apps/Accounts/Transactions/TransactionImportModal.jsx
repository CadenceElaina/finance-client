import React, { useMemo, useCallback, useReducer } from "react";
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
import {
  recordMerchantChoice,
  getMerchantPreference,
  isValidMerchantChoice,
  getMerchantNamedDefaults,
} from "./utils/merchantHistory";
import { getFinalMerchantName } from "./utils/customMerchantNames";
import { processTransactionWithSmartRecognition } from "./utils/merchantPreferences";
import MerchantManagementTab from "./components/MerchantManagementTab";

// Import components
import FileUploadStep from "./components/import/FileUploadStep";
import ControlBar from "./components/import/ControlBar";
import TransactionCard from "./components/import/TransactionCard";

// State management with reducer for cleaner code
const initialState = {
  step: 1,
  transactions: [],
  approved: new Set(),
  undoStack: [],
  error: "",
  selectedAccountId: "",
  searchTerm: "",
  showMerchantManager: false,
  preferencesUpdateKey: 0,
};

const transactionReducer = (state, action) => {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_TRANSACTIONS":
      return {
        ...state,
        transactions: action.payload,
        approved: new Set(),
        undoStack: [],
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ACCOUNT":
      return { ...state, selectedAccountId: action.payload };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload };
    case "APPROVE_TRANSACTION": {
      const newApproved = new Set(state.approved);
      newApproved.add(action.payload.id);
      return {
        ...state,
        approved: newApproved,
        undoStack: [action.payload, ...state.undoStack.slice(0, 9)], // Keep max 10 undo actions
      };
    }
    case "UNAPPROVE_TRANSACTION": {
      const updatedApproved = new Set(state.approved);
      updatedApproved.delete(action.payload);
      return { ...state, approved: updatedApproved };
    }
    case "BULK_APPROVE": {
      const bulkApproved = new Set([...state.approved, ...action.payload.ids]);
      return {
        ...state,
        approved: bulkApproved,
        undoStack: [
          { type: "bulk", transactions: action.payload.transactions },
          ...state.undoStack.slice(0, 4),
        ],
      };
    }
    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const [lastAction, ...restUndo] = state.undoStack;
      const revertedApproved = new Set(state.approved);

      if (lastAction.type === "bulk") {
        lastAction.transactions.forEach((tx) => revertedApproved.delete(tx.id));
      } else {
        revertedApproved.delete(lastAction.id);
      }

      return {
        ...state,
        approved: revertedApproved,
        undoStack: restUndo,
      };
    }
    case "RESET_APPROVAL":
      return { ...state, approved: new Set(), undoStack: [] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id
            ? {
                ...tx,
                proposed: {
                  ...tx.proposed,
                  [action.payload.field]: action.payload.value,
                  ...(action.payload.field === "category" && {
                    subCategory: "",
                  }),
                  isAutoSuggested: ["category", "subCategory"].includes(
                    action.payload.field
                  )
                    ? false
                    : tx.proposed.isAutoSuggested,
                },
              }
            : tx
        ),
      };
    case "TOGGLE_MERCHANT_MANAGER":
      return { ...state, showMerchantManager: !state.showMerchantManager };
    case "UPDATE_PREFERENCES":
      return { ...state, preferencesUpdateKey: state.preferencesUpdateKey + 1 };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

// Utility functions
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

const TransactionImportModal = ({
  isOpen,
  onClose,
  onImport,
  accounts,
  existingTransactions = [],
}) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);

  // Memoized derived state
  const importableAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];
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
      return (
        allowedCategories.some((cat) => cat.toLowerCase() === category) ||
        allowedSubTypes.includes(subType)
      );
    });
  }, [accounts]);

  const isTransactionValid = useCallback((tx) => {
    const { merchant_name, description, type, category, subCategory } =
      tx.proposed;
    const requiredFields = [merchant_name, description, type, category];
    if (type === "expense") {
      requiredFields.push(subCategory);
    }
    return requiredFields.every((field) => field && field.trim().length > 0);
  }, []);

  // Filtered and processed transactions
  const filteredTransactions = useMemo(() => {
    if (!state.searchTerm.trim()) return state.transactions;
    const term = state.searchTerm.toLowerCase();
    return state.transactions.filter(
      (tx) =>
        Object.values(tx.proposed).some((val) =>
          String(val).toLowerCase().includes(term)
        ) ||
        Object.values(tx.original).some((val) =>
          String(val).toLowerCase().includes(term)
        )
    );
  }, [state.transactions, state.searchTerm]);

  const { remaining, approved: approvedTxs } = useMemo(() => {
    return {
      remaining: filteredTransactions.filter(
        (tx) => !state.approved.has(tx.id)
      ),
      approved: filteredTransactions.filter((tx) => state.approved.has(tx.id)),
    };
  }, [filteredTransactions, state.approved]);

  const stats = useMemo(() => {
    const validTransactions = state.transactions.filter(isTransactionValid);
    const transactionsWithDefaults = state.transactions.filter((tx) => {
      if (state.approved.has(tx.id)) return false;
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
      const namedDefaults = getMerchantNamedDefaults(tx.proposed.merchant_name);
      return (
        (hasValidOldDefault || namedDefaults.length > 0) &&
        isTransactionValid(tx)
      );
    });

    return {
      total: state.transactions.length,
      approved: state.approved.size,
      remaining: state.transactions.length - state.approved.size,
      valid: validTransactions.length,
      withDefaults: transactionsWithDefaults.length,
      progress: state.transactions.length
        ? Math.round((state.approved.size / state.transactions.length) * 100)
        : 0,
    };
  }, [state.transactions, state.approved, isTransactionValid]);

  // Event handlers
  const isDuplicateTransaction = useCallback((newTx, existingTxs) => {
    return existingTxs.some((existing) => {
      const newDate = new Date(newTx.original.date);
      const existingDate = new Date(existing.transaction_date);
      newDate.setHours(0, 0, 0, 0);
      existingDate.setHours(0, 0, 0, 0);
      const isSameDate = newDate.getTime() === existingDate.getTime();
      const isSameAmount =
        Math.abs(
          parseFloat(existing.amount) - parseFloat(newTx.original.amount)
        ) < 0.01;
      const isSameMerchant =
        existing.merchant_name?.toLowerCase() ===
        newTx.proposed.merchant_name?.toLowerCase();
      const isSameDescription =
        existing.description?.toLowerCase() ===
        newTx.proposed.description?.toLowerCase();
      return (
        isSameDate && isSameAmount && (isSameMerchant || isSameDescription)
      );
    });
  }, []);

  const handleFile = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file || !state.selectedAccountId) return;

      const selectedAccount = importableAccounts.find(
        (acc) =>
          (acc.id && acc.id === state.selectedAccountId) ||
          acc.name === state.selectedAccountId
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

            const initialTransaction = {
              id,
              original,
              suggested,
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
                isAutoSuggested: true,
              },
              approved: false,
            };
            return processTransactionWithSmartRecognition(
              initialTransaction,
              true
            );
          });

          const uniqueTransactions = txs.filter(
            (tx) => !isDuplicateTransaction(tx, existingTransactions)
          );
          const duplicateCount = txs.length - uniqueTransactions.length;

          dispatch({ type: "SET_TRANSACTIONS", payload: uniqueTransactions });
          dispatch({
            type: "SET_ERROR",
            payload:
              duplicateCount > 0
                ? `Found and filtered out ${duplicateCount} duplicate transaction${
                    duplicateCount > 1 ? "s" : ""
                  }.`
                : "",
          });
          dispatch({ type: "SET_STEP", payload: 2 });
        },
        error: (err) =>
          dispatch({
            type: "SET_ERROR",
            payload: `Failed to parse file: ${err.message}`,
          }),
      });
    },
    [
      state.selectedAccountId,
      importableAccounts,
      isDuplicateTransaction,
      existingTransactions,
    ]
  );

  const handleApprove = useCallback(
    (id) => {
      const transaction = state.transactions.find((t) => t.id === id);
      if (transaction) {
        dispatch({
          type: "APPROVE_TRANSACTION",
          payload: { id, tx: transaction },
        });
      }
    },
    [state.transactions]
  );

  const handleUnapprove = useCallback((id) => {
    dispatch({ type: "UNAPPROVE_TRANSACTION", payload: id });
  }, []);

  const handleBulkApprove = useCallback(
    (filterFunc) => {
      const eligibleTransactions = state.transactions.filter(filterFunc);
      const newIds = eligibleTransactions
        .map((tx) => tx.id)
        .filter((id) => !state.approved.has(id));

      if (newIds.length > 0) {
        dispatch({
          type: "BULK_APPROVE",
          payload: {
            ids: newIds,
            transactions: eligibleTransactions.filter((tx) =>
              newIds.includes(tx.id)
            ),
          },
        });
      }
    },
    [state.transactions, state.approved]
  );

  const handleApproveAllValid = useCallback(() => {
    handleBulkApprove(
      (tx) => isTransactionValid(tx) && !state.approved.has(tx.id)
    );
  }, [handleBulkApprove, isTransactionValid, state.approved]);

  const handleApproveAllWithDefaults = useCallback(() => {
    handleBulkApprove((tx) => {
      if (state.approved.has(tx.id)) return false;
      const merchantPreference = getMerchantPreference(
        tx.proposed.merchant_name
      );
      const hasValidOldDefault =
        merchantPreference?.confidence >= 0.7 &&
        merchantPreference.parent &&
        merchantPreference.parent !== "Select Category" &&
        (tx.proposed.type === "income" ||
          (merchantPreference.sub &&
            merchantPreference.sub !== "Select Sub-Category"));
      const namedDefaults = getMerchantNamedDefaults(tx.proposed.merchant_name);
      return (
        (hasValidOldDefault || namedDefaults.length > 0) &&
        isTransactionValid(tx)
      );
    });
  }, [handleBulkApprove, isTransactionValid, state.approved]);

  const handleTransactionChange = useCallback((id, field, value) => {
    dispatch({ type: "UPDATE_TRANSACTION", payload: { id, field, value } });
  }, []);

  const handleMerchantPreferenceUpdate = useCallback(() => {
    dispatch({ type: "UPDATE_PREFERENCES" });
  }, []);

  const handleBulkUpdate = useCallback((updatedTransactions) => {
    // Apply bulk updates to multiple transactions
    updatedTransactions.forEach(({ id, updates }) => {
      Object.entries(updates).forEach(([field, value]) => {
        dispatch({ type: "UPDATE_TRANSACTION", payload: { id, field, value } });
      });
    });
  }, []);

  const handleApplyDefault = useCallback((transactionId, defaultData) => {
    Object.entries(defaultData).forEach(([field, value]) => {
      if (value && field !== "name") {
        dispatch({
          type: "UPDATE_TRANSACTION",
          payload: { id: transactionId, field, value },
        });
      }
    });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    onClose();
  }, [onClose]);

  const handleFinalize = useCallback(() => {
    const selectedAccount = importableAccounts.find(
      (acc) =>
        (acc.id && acc.id === state.selectedAccountId) ||
        acc.name === state.selectedAccountId
    );

    const importedTransactions = state.transactions
      .filter((tx) => state.approved.has(tx.id))
      .map((tx) => {
        // Record merchant choice for learning
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
          account_id: state.selectedAccountId,
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
    handleReset();
  }, [state, importableAccounts, onImport, handleReset]);

  // Render methods
  const renderContent = () => {
    if (state.step === 1) {
      return (
        <FileUploadStep
          importableAccounts={importableAccounts}
          selectedAccountId={state.selectedAccountId}
          onAccountChange={(e) =>
            dispatch({ type: "SET_ACCOUNT", payload: e.target.value })
          }
          onFileChange={handleFile}
          error={state.error}
        />
      );
    }

    if (state.step === 2) {
      return (
        <div className={`${styles.reviewContainer} themedModalContent`}>
          <ControlBar
            progress={stats.progress}
            approvedCount={stats.approved}
            totalCount={stats.total}
            onApproveAllValid={handleApproveAllValid}
            remainingValidCount={stats.valid - stats.approved}
            onApproveAllWithDefaults={handleApproveAllWithDefaults}
            transactionsWithDefaultsCount={stats.withDefaults}
            onUndo={() => dispatch({ type: "UNDO" })}
            canUndo={state.undoStack.length > 0}
            onReset={() => dispatch({ type: "RESET_APPROVAL" })}
            canReset={stats.approved > 0}
            onManageMerchants={() =>
              dispatch({ type: "TOGGLE_MERCHANT_MANAGER" })
            }
          />

          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search transactions..."
              value={state.searchTerm}
              onChange={(e) =>
                dispatch({ type: "SET_SEARCH", payload: e.target.value })
              }
              className={styles.searchInput}
            />
          </div>

          <div className={styles.reviewGrid}>
            <div className={styles.reviewPanelToReview}>
              <h5 className={styles.reviewPanelTitle}>
                To Review ({remaining.length})
              </h5>
              {remaining.length === 0 ? (
                <div className={styles.reviewPanelEmpty}>
                  All transactions approved!
                </div>
              ) : (
                remaining.map((tx, index) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    onTransactionChange={(field, value) =>
                      handleTransactionChange(tx.id, field, value)
                    }
                    onApprove={() => handleApprove(tx.id)}
                    isTransactionValid={isTransactionValid(tx)}
                    allTransactions={state.transactions}
                    currentTransactionIndex={index}
                    onBulkUpdate={handleBulkUpdate}
                    onMerchantPreferenceUpdate={handleMerchantPreferenceUpdate}
                    onApplyDefault={(defaultData) =>
                      handleApplyDefault(tx.id, defaultData)
                    }
                    onManageMerchants={() =>
                      dispatch({ type: "TOGGLE_MERCHANT_MANAGER" })
                    }
                  />
                ))
              )}
            </div>

            <div className={styles.reviewPanelApproved}>
              <h5 className={styles.reviewPanelTitle}>
                Approved ({approvedTxs.length})
              </h5>
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
                      <div className={styles.approvedItemContent}>
                        <div>
                          <div className={styles.approvedText}>
                            {tx.proposed.merchant_name}
                          </div>
                          <div className={styles.approvedSubText}>
                            {tx.proposed.category}
                            {tx.proposed.subCategory &&
                              ` → ${tx.proposed.subCategory}`}
                          </div>
                        </div>
                        <div className={styles.approvedItemActions}>
                          <span className={styles.approvedAmount}>
                            ${tx.original.amount}
                          </span>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleUnapprove(tx.id)}
                            title="Return to review list"
                            className={styles.reviewButton}
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
            <Button onClick={handleReset} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              variant="primary"
              disabled={stats.approved === 0}
            >
              Import ({stats.approved}) Approved
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Import Transactions"
      modalClassName="themedModal"
      contentClassName="themedModalContent"
    >
      {renderContent()}
      {state.showMerchantManager && (
        <Modal
          isOpen={state.showMerchantManager}
          onClose={() => {
            dispatch({ type: "TOGGLE_MERCHANT_MANAGER" });
            dispatch({ type: "UPDATE_PREFERENCES" });
          }}
          title="Merchant Management"
          modalClassName="themedModal"
        >
          <MerchantManagementTab />
        </Modal>
      )}
    </Modal>
  );
};

export default TransactionImportModal;
