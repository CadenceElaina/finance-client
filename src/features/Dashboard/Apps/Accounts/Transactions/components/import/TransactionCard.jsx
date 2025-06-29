import React from "react";
import Button from "../../../../../../../components/ui/Button/Button";
import styles from "./TransactionCard.module.css";
import { formatLocation, formatDescription } from "../../utils/dataCleaning";
import { incomeCategories, expenseCategories } from "../../utils/categories";
import { getCustomMerchantName } from "../../utils/customMerchantNames";

import MerchantInput from "./MerchantInput";
import DefaultManager from "./DefaultManager";

const TransactionCard = ({
  transaction,
  onTransactionChange,
  onApprove,
  isTransactionValid,
  allTransactions = [],
  currentTransactionIndex = -1,
  onBulkUpdate = null,
  onMerchantPreferenceUpdate = null,
  onApplyDefault = null,
}) => {
  const { original, proposed } = transaction;

  // Check if user has created a custom merchant mapping
  const customMerchant = getCustomMerchantName(
    original.merchant,
    formatLocation(original.address, original.cityState, original.zipCode)
  );

  // Generate improved description suggestion
  const suggestedDescription = formatDescription(original);

  // Auto-fill description if it's empty and we have a suggestion
  React.useEffect(() => {
    if (
      !proposed.description &&
      suggestedDescription &&
      suggestedDescription !== "Transaction"
    ) {
      onTransactionChange("description", suggestedDescription);
    }
  }, [proposed.description, suggestedDescription, onTransactionChange]);

  return (
    <div className={styles.transactionReviewItem}>
      <div className={styles.reviewTablesRow}>
        {/* Initial Data */}
        <div className={styles.reviewTableCol}>
          <div className={styles.reviewTableTitle}>Initial (Raw CSV Data)</div>
          <table className={styles.reviewTable}>
            <tbody>
              <tr>
                <td>Date:</td>
                <td>{original.date}</td>
              </tr>
              <tr>
                <td>Merchant:</td>
                <td>{original.merchant}</td>
              </tr>
              <tr>
                <td>Description:</td>
                <td>{original.description || "N/A"}</td>
              </tr>
              <tr>
                <td>Extended Details:</td>
                <td>{original.extended_details || "N/A"}</td>
              </tr>
              <tr>
                <td>Location:</td>
                <td>
                  {formatLocation(
                    original.address,
                    original.cityState,
                    original.zipCode
                  ) || "N/A"}
                </td>
              </tr>
              <tr>
                <td>Category:</td>
                <td>{original.category || "N/A"}</td>
              </tr>
              <tr>
                <td>Amount:</td>
                <td className={styles.amount}>${original.amount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.reviewArrowCol}>
          <span className={styles.reviewArrow}>&rarr;</span>
        </div>

        {/* Suggested/Editable Data */}
        <div className={styles.reviewTableCol}>
          <div className={styles.reviewTableTitle}>
            {customMerchant ? "Your Custom Merchant" : "Suggested"}
            {customMerchant && (
              <div className={styles.customMerchantIndicator}>
                🏷️ Custom Mapping
              </div>
            )}
          </div>
          <table className={styles.reviewTable}>
            <tbody>
              <tr>
                <td>
                  <span className={styles.required}>*</span> Merchant:
                </td>
                <td>
                  <MerchantInput
                    value={proposed.merchant_name}
                    onChange={(newValue) =>
                      onTransactionChange("merchant_name", newValue)
                    }
                    onSelect={(selectedName) =>
                      onTransactionChange("merchant_name", selectedName)
                    }
                    transaction={transaction}
                    allTransactions={allTransactions}
                    currentTransactionIndex={currentTransactionIndex}
                    onBulkUpdate={onBulkUpdate}
                    onMerchantPreferenceUpdate={onMerchantPreferenceUpdate}
                    onApplyDefault={onApplyDefault}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.required}>*</span> Description:
                </td>
                <td>
                  <textarea
                    value={proposed.description || ""}
                    onChange={(e) =>
                      onTransactionChange("description", e.target.value)
                    }
                    className={`${styles.reviewInput} ${
                      !proposed.description ? styles.invalid : ""
                    }`}
                    rows={2}
                    placeholder="Enter description..."
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.required}>*</span> Type:
                </td>
                <td>
                  <select
                    value={proposed.type || ""}
                    onChange={(e) =>
                      onTransactionChange("type", e.target.value)
                    }
                    className={`${styles.reviewInput} ${
                      !proposed.type ? styles.invalid : ""
                    }`}
                  >
                    <option value="">Select Type</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.required}>*</span> Category:
                </td>
                <td>
                  <select
                    value={proposed.category || ""}
                    onChange={(e) =>
                      onTransactionChange("category", e.target.value)
                    }
                    className={`${styles.reviewInput} ${
                      !proposed.category ? styles.invalid : ""
                    }`}
                  >
                    <option value="">Select Category</option>
                    {(proposed.type === "income"
                      ? incomeCategories
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
                <td>
                  {proposed.type === "expense" && (
                    <span className={styles.required}>*</span>
                  )}{" "}
                  Sub-Category:
                </td>
                <td>
                  <select
                    value={proposed.subCategory || ""}
                    onChange={(e) =>
                      onTransactionChange("subCategory", e.target.value)
                    }
                    disabled={!proposed.category || proposed.type === "income"}
                    className={`${styles.reviewInput} ${
                      !proposed.subCategory && proposed.type === "expense"
                        ? styles.invalid
                        : ""
                    }`}
                  >
                    <option value="">Select Sub-Category</option>
                    {proposed.category &&
                      expenseCategories[proposed.category]?.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Recurring:</td>
                <td>
                  <select
                    value={proposed.isRecurring ? "true" : "false"}
                    onChange={(e) =>
                      onTransactionChange(
                        "isRecurring",
                        e.target.value === "true"
                      )
                    }
                    className={styles.reviewInput}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Notes:</td>
                <td>
                  <input
                    type="text"
                    value={proposed.notes || ""}
                    onChange={(e) =>
                      onTransactionChange("notes", e.target.value)
                    }
                    className={styles.reviewInput}
                    placeholder="Optional notes..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.defaultsSection}>
          <DefaultManager
            transaction={transaction}
            onTransactionChange={onTransactionChange}
            onApplyDefault={onApplyDefault}
          />
        </div>
        <Button
          variant="primary"
          onClick={onApprove}
          size="small"
          disabled={!isTransactionValid}
          title={
            !isTransactionValid
              ? "Please fill in all required fields"
              : "Approve this transaction"
          }
        >
          Approve
        </Button>
      </div>
    </div>
  );
};

export default TransactionCard;
