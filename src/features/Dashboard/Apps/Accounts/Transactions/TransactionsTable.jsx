import React from "react";
import Table from "../../../../../components/ui/Table/Table";

import styles from "./Transactions.module.css";

const TransactionsTable = ({
  transactions,
  columns,
  accounts,
  selectedAccountId,
  onAccountChange,
}) => {
  return (
    <div>
      <div className={styles.tableControls}>
        <select
          value={selectedAccountId}
          onChange={(e) => onAccountChange(e.target.value)}
          className={styles.accountSelector}
        >
          <option value="all">All Accounts</option>
          {accounts?.map((acc) => (
            <option key={acc.id || acc.name} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>
      <Table
        data={transactions}
        columns={columns}
        defaultSortColumn="date"
        renderRow={(row, idx) => (
          <tr key={row.id || idx}>
            {columns.map((col) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        )}
      />
    </div>
  );
};

export default TransactionsTable;
