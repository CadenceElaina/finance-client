import React from "react";
import Table from "../../../../../components/ui/Table/Table";
import styles from "./Transactions.module.css";

const TransactionsTable = ({ transactions, columns, accounts }) => {
  const getAccountName = (accountId) => {
    const account = accounts.find(
      (acc) => (acc.id && acc.id === accountId) || acc.name === accountId
    );
    return account ? account.name : "N/A";
  };

  const formatCellValue = (row, col) => {
    let cellValue = row[col.key];

    // Handle special formatting based on column key
    switch (col.key) {
      case "account":
        return getAccountName(row.account_id);
      case "amount":
        if (typeof cellValue === "number") {
          const isIncome = row.type === "income";
          const formatted = Math.abs(cellValue).toFixed(2);
          const sign = isIncome ? "+" : "-";
          return (
            <span
              className={`${styles.amount} ${
                isIncome ? styles.income : styles.expense
              }`}
            >
              {sign}${formatted}
            </span>
          );
        }
        return cellValue;
      case "type":
        return (
          <span className={`${styles.transactionType} ${styles[row.type]}`}>
            {cellValue
              ? cellValue.charAt(0).toUpperCase() + cellValue.slice(1)
              : ""}
          </span>
        );
      case "is_recurring":
        return cellValue ? (
          <span className={styles.recurringBadge} title="Recurring transaction">
            ✓
          </span>
        ) : (
          ""
        );
      case "transaction_date":
        if (cellValue) {
          const date = new Date(cellValue);
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
        return cellValue;
      default:
        // Use formatter if provided
        if (col.formatter) {
          return col.formatter(cellValue, row);
        }
        // Truncate long text values
        if (typeof cellValue === "string" && cellValue.length > 25) {
          return <span title={cellValue}>{cellValue.substring(0, 25)}...</span>;
        }
        return cellValue || "";
    }
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <Table
          data={transactions}
          columns={columns}
          defaultSortColumn="date"
          className={styles.transactionsTable}
          renderRow={(row, idx) => (
            <tr key={row.id || idx} className={styles.transactionRow}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${styles.tableCell} ${styles[`cell_${col.key}`]}`}
                  style={col.width ? { width: col.width } : {}}
                  align={col.align || "left"}
                >
                  {formatCellValue(row, col)}
                </td>
              ))}
            </tr>
          )}
        />
      </div>

      {transactions.length === 0 && (
        <div className={styles.emptyState}>
          <p>No transactions found for the selected account.</p>
          <p>Import transactions or add them manually to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
