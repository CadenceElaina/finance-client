import React, { useState, useEffect } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { incomeCategories, expenseCategories } from "./utils/categories";
import Modal from "../../../../../components/ui/Modal/Modal";
import Button from "../../../../../components/ui/Button/Button";
import styles from "./Transactions.module.css";

const TransactionForm = ({
  onSubmit,
  initialAccountId,
  openTransactionImportModal,
  isLoading = false,
}) => {
  const { data } = useFinancialData();
  const accounts = data?.accounts || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [accountId, setAccountId] = useState(initialAccountId || "");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (initialAccountId && initialAccountId !== "all") {
      setAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  const resetForm = () => {
    setType("expense");
    setAccountId(initialAccountId || "");
    setToAccountId("");
    setDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setCategory("");
    setSubCategory("");
    setDescription("");
    setMerchantName("");
    setLocation("");
    setNotes("");
    setIsRecurring(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      account_id: accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      transaction_date: date,
      amount: parseFloat(amount),
      category_id: subCategory || category,
      subCategory: type === "expense" ? subCategory : "",
      description,
      merchant_name: merchantName,
      location,
      notes,
      type,
      is_recurring: isRecurring,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubCategory("");
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Add Transaction</Button>
      <Button
        onClick={openTransactionImportModal}
        variant="secondary"
        style={{ marginLeft: 8 }}
      >
        Import Transactions
      </Button>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Transaction"
      >
        <form onSubmit={handleSubmit} className={styles.transactionForm}>
          <div className={styles.formField}>
            <label>Type</label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  value="expense"
                  checked={type === "expense"}
                  onChange={(e) => setType(e.target.value)}
                />
                Expense
              </label>
              <label>
                <input
                  type="radio"
                  value="income"
                  checked={type === "income"}
                  onChange={(e) => setType(e.target.value)}
                />
                Income
              </label>
              <label>
                <input
                  type="radio"
                  value="transfer"
                  checked={type === "transfer"}
                  onChange={(e) => setType(e.target.value)}
                />
                Transfer
              </label>
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="account">
              {type === "transfer" ? "From Account" : "Account"}
            </label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {type === "transfer" && (
            <div className={styles.formField}>
              <label htmlFor="toAccount">To Account</label>
              <select
                id="toAccount"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                <option value="">Select Account</option>
                {accounts
                  .filter((acc) => acc.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className={styles.formField}>
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="merchantName">Merchant</label>
            <input
              id="merchantName"
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g., Starbucks"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 123 Main St, City, State"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0"
              step="0.01"
            />
          </div>

          {type !== "transfer" && (
            <>
              <div className={styles.formField}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Select Category</option>
                  {(type === "income"
                    ? incomeCategories
                    : Object.keys(expenseCategories)
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {type === "expense" &&
                category &&
                expenseCategories[category] && (
                  <div className={styles.formField}>
                    <label htmlFor="subCategory">Sub-Category</label>
                    <select
                      id="subCategory"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                    >
                      <option value="">Select Sub-Category</option>
                      {expenseCategories[category].map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </>
          )}

          <div className={styles.formField}>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Weekly grocery shopping"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="notes">Notes</label>
            <input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          <div className={styles.formField}>
            <label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              This is a recurring transaction
            </label>
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TransactionForm;
