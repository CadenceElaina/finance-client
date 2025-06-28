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
}) => {
  const { data } = useFinancialData();
  const accounts = data?.accounts || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [accountId, setAccountId] = useState(initialAccountId || "");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");

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
    setParentCategory("");
    setSubCategory("");
    setDescription("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      date,
      amount: parseFloat(amount),
      category: subCategory || parentCategory,
      description,
      type,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleParentCategoryChange = (e) => {
    setParentCategory(e.target.value);
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
            <label htmlFor="account">Account</label>
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
                <label htmlFor="parentCategory">Category</label>
                <select
                  id="parentCategory"
                  value={parentCategory}
                  onChange={handleParentCategoryChange}
                  required
                >
                  <option value="">Select Category</option>
                  {(type === "income"
                    ? incomeCategories.map((c) => c.name)
                    : Object.keys(expenseCategories)
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {type === "expense" &&
                parentCategory &&
                expenseCategories[parentCategory] && (
                  <div className={styles.formField}>
                    <label htmlFor="subCategory">Sub-Category</label>
                    <select
                      id="subCategory"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      required
                    >
                      <option value="">Select Sub-Category</option>
                      {expenseCategories[parentCategory].map((subCat) => (
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
