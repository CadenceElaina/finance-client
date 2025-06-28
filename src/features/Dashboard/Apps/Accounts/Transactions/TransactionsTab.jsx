import React, { useState, useMemo, useEffect } from "react";
import styles from "./Transactions.module.css";
import TransactionForm from "./TransactionForm";
import TransactionsTable from "./TransactionsTable";
import { getColumnDefinitions } from "./utils/columnDefinitions";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const TransactionsTab = ({
  accountId: initialAccountId,
  openTransactionImportModal,
}) => {
  const { data, saveData } = useFinancialData();
  const { accounts, transactions = [] } = data;
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId || "all"
  );

  useEffect(() => {
    setSelectedAccountId(initialAccountId || "all");
  }, [initialAccountId]);

  const handleAddTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      // accountId is already in the transaction object from the form
    };
    const updatedTransactions = [...transactions, newTransaction];
    saveData({ ...data, transactions: updatedTransactions });
  };

  const filteredTransactions = useMemo(() => {
    if (selectedAccountId === "all") {
      return transactions;
    }
    return transactions.filter((t) => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const columns = useMemo(() => getColumnDefinitions("$"), []);

  return (
    <div className={styles.transactionsContainer}>
      <div className={styles.header}>
        <h2>Transactions</h2>
        <div className={styles.controls}>
          <TransactionForm
            onSubmit={handleAddTransaction}
            initialAccountId={selectedAccountId}
            openTransactionImportModal={openTransactionImportModal}
          />
        </div>
      </div>
      <TransactionsTable
        transactions={filteredTransactions}
        columns={columns}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
      />
    </div>
  );
};

export default TransactionsTab;
