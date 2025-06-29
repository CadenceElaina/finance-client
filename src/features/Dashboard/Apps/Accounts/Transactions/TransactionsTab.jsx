import React, { useState, useMemo, useEffect } from "react";
import styles from "./Transactions.module.css";
import TransactionForm from "./TransactionForm";
import TransactionsTable from "./TransactionsTable";
import TransactionImportModal from "./TransactionImportModal";
import MerchantManagementTab from "./components/MerchantManagementTab";
import Modal from "../../../../../components/ui/Modal/Modal";
import { getColumnDefinitions } from "./utils/columnDefinitions";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useAuth } from "../../../../../contexts/AuthContext";
import Button from "../../../../../components/ui/Button/Button";

const TransactionsTab = ({ accountId: initialAccountId }) => {
  const { data, saveData } = useFinancialData();
  const { user } = useAuth();
  const { accounts, transactions = [] } = data;

  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId || "all"
  );
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerchantModalOpen, setMerchantModalOpen] = useState(false);

  // Time period filtering
  const [timePeriodType, setTimePeriodType] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );

  useEffect(() => {
    setSelectedAccountId(initialAccountId || "all");
  }, [initialAccountId]);

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach((tx) => {
      if (tx.transaction_date) {
        const year = new Date(tx.transaction_date).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by account
    if (selectedAccountId !== "all") {
      filtered = filtered.filter((t) => t.account_id === selectedAccountId);
    }

    // Filter by time period
    const year = selectedYear;
    let start, end;

    switch (timePeriodType) {
      case "month":
        start = new Date(year, selectedMonth - 1, 1);
        end = new Date(year, selectedMonth, 0, 23, 59, 59);
        break;
      case "quarter": {
        const quarterStart = (selectedQuarter - 1) * 3;
        start = new Date(year, quarterStart, 1);
        end = new Date(year, quarterStart + 3, 0, 23, 59, 59);
        break;
      }
      case "year":
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59);
        break;
      default:
        start = null;
        end = null;
    }

    if (start && end) {
      filtered = filtered.filter((tx) => {
        if (!tx.transaction_date) return false;
        const txDate = new Date(tx.transaction_date);
        return txDate >= start && txDate <= end;
      });
    }

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    );
  }, [
    transactions,
    selectedAccountId,
    timePeriodType,
    selectedYear,
    selectedMonth,
    selectedQuarter,
  ]);

  const handleAddTransaction = async (transaction) => {
    setIsLoading(true);
    try {
      const newTransaction = {
        ...transaction,
        id: `manual-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedTransactions = [...transactions, newTransaction];

      // Use the enhanced save logic that handles authentication and storage preference
      await saveData({ ...data, transactions: updatedTransactions });
    } catch (error) {
      console.error("Failed to save transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportTransactions = async (importedTransactions) => {
    setIsLoading(true);
    try {
      const newTransactions = importedTransactions.map((t, i) => ({
        ...t,
        id: t.id || `import-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const updatedTransactions = [...transactions, ...newTransactions];

      // Use the enhanced save logic that handles authentication and storage preference
      await saveData({ ...data, transactions: updatedTransactions });
    } catch (error) {
      console.error("Failed to import transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTransactions = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all transactions? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        await saveData({ ...data, transactions: [] });
      } catch (error) {
        console.error("Failed to clear transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const columns = useMemo(() => getColumnDefinitions(), []);

  // Get storage status for UI feedback
  const storageStatus = user ? "server" : "local";

  const renderTabContent = () => {
    return (
      <>
        {/* Compact Filtering Controls above table */}
        <div className={styles.tableHeaderSection}>
          <div className={styles.tableFilters}>
            <div className={styles.filterGroup}>
              <label htmlFor="account-select">Account:</label>
              <select
                id="account-select"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Accounts</option>
                {accounts?.map((acc) => (
                  <option key={acc.id || acc.name} value={acc.id || acc.name}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="time-period-type">Time Period:</label>
              <select
                id="time-period-type"
                value={timePeriodType}
                onChange={(e) => setTimePeriodType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="year-select">Year:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={styles.filterSelect}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {timePeriodType === "month" && (
              <div className={styles.filterGroup}>
                <label htmlFor="month-select">Month:</label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className={styles.filterSelect}
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>
            )}

            {timePeriodType === "quarter" && (
              <div className={styles.filterGroup}>
                <label htmlFor="quarter-select">Quarter:</label>
                <select
                  id="quarter-select"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                  className={styles.filterSelect}
                >
                  <option value={1}>Q1 (Jan-Mar)</option>
                  <option value={2}>Q2 (Apr-Jun)</option>
                  <option value={3}>Q3 (Jul-Sep)</option>
                  <option value={4}>Q4 (Oct-Dec)</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.transactionCount}>
            {filteredTransactions.length} transactions
          </div>
        </div>

        <TransactionsTable
          transactions={filteredTransactions}
          columns={columns}
          accounts={accounts}
        />
      </>
    );
  };

  return (
    <div className={styles.transactionsContainer}>
      <div className={styles.header}>
        <h2>Transactions</h2>
        <div className={styles.controls}>
          <TransactionForm
            onSubmit={handleAddTransaction}
            initialAccountId={selectedAccountId}
            openTransactionImportModal={() => setImportModalOpen(true)}
            isLoading={isLoading}
          />
          <Button
            variant="primary"
            onClick={() => setMerchantModalOpen(true)}
            className={styles.merchantButton}
          >
            Merchants
          </Button>
          <Button
            variant="danger"
            onClick={handleClearTransactions}
            disabled={isLoading || transactions.length === 0}
            title={
              transactions.length === 0
                ? "No transactions to clear"
                : `Clear all ${transactions.length} transactions`
            }
          >
            Clear All
          </Button>
          <div className={styles.storageIndicator}>
            <span
              className={`${styles.storageStatus} ${styles[storageStatus]}`}
            >
              {storageStatus === "server" ? "🔒 Server" : "💾 Local"}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      <TransactionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportTransactions}
        accounts={accounts}
        existingTransactions={transactions}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isMerchantModalOpen}
        onClose={() => setMerchantModalOpen(false)}
        title="Merchant Management"
      >
        <MerchantManagementTab />
      </Modal>
    </div>
  );
};

export default TransactionsTab;
