import React from "react";
import Table from "../../../../../components/ui/Table/Table";

const TransactionsTable = ({ transactions, columns }) => {
  return (
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
  );
};

export default TransactionsTable;
