// src/components/ui/Table/Table.jsx
import React, { useState, useMemo, useEffect } from "react";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import styles from "./Table.module.css";

// Helper to format date as short readable string (e.g., "Jan 15, 2023")
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Improved sort function: alphabetical for strings, numeric for numbers
const getSortFn =
  (colKey, asc = true) =>
  (a, b) => {
    let aVal = a[colKey];
    let bVal = b[colKey];

    // For dates, compare as Date objects
    if (colKey.toLowerCase().includes("date")) {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
      if (isNaN(aVal.getTime()))
        aVal = asc ? new Date(-8640000000000000) : new Date(8640000000000000);
      if (isNaN(bVal.getTime()))
        bVal = asc ? new Date(-8640000000000000) : new Date(8640000000000000);
      return asc ? aVal - bVal : bVal - aVal;
    }

    // Numeric sort if both are numbers
    if (typeof aVal === "number" && typeof bVal === "number") {
      return asc ? aVal - bVal : bVal - aVal;
    }

    // Alphabetical sort for strings (case-insensitive)
    if (typeof aVal === "string" && typeof bVal === "string") {
      return asc
        ? aVal.localeCompare(bVal, undefined, { sensitivity: "base" })
        : bVal.localeCompare(aVal, undefined, { sensitivity: "base" });
    }

    // Fallback for mixed types or null/undefined
    if (aVal == null) return asc ? -1 : 1;
    if (bVal == null) return asc ? 1 : -1;
    return 0;
  };

const Table = ({
  columns = [],
  data = [],
  renderRow,
  className = "",
  smallApp = false,
  extraRow,
  defaultSortColumn = null,
  editMode = false, // New prop to indicate edit mode
  ...props
}) => {
  // Find the value column for default sorting
  const getDefaultSort = () => {
    if (defaultSortColumn) {
      return { key: defaultSortColumn, direction: "desc" };
    }

    // Auto-detect value column
    const valueColumn = columns.find(
      (col) =>
        col.key &&
        (col.key.toLowerCase().includes("value") ||
          col.key.toLowerCase().includes("cost") ||
          col.key.toLowerCase().includes("price"))
    );

    if (valueColumn) {
      return { key: valueColumn.key, direction: "desc" };
    }

    return { key: null, direction: null };
  };

  // State for sorting: { key: colKey, direction: 'asc' | 'desc' | null }
  const [sort, setSort] = useState(getDefaultSort);

  // Reset to default sort when data or columns change, but NOT during edit mode
  useEffect(() => {
    if (!editMode) {
      const currentDefault = getDefaultSort();
      // Only reset if we don't have a current sort or if the current sort column no longer exists
      if (!sort.key || !columns.find((col) => col.key === sort.key)) {
        setSort(currentDefault);
      }
    }
  }, [columns, data.length, editMode]); // Add editMode to dependencies

  // Sorted data - don't sort during edit mode
  const sortedData = useMemo(() => {
    let currentData = [...data];

    // Only sort if not in edit mode
    if (!editMode && sort.key && sort.direction) {
      currentData.sort(getSortFn(sort.key, sort.direction === "asc"));
    }

    return currentData;
  }, [data, sort, editMode]); // Add editMode to dependencies

  // Handle sort icon click - disable during edit mode
  const handleSort = (colKey) => {
    if (editMode) return; // Don't allow sorting during edit mode

    setSort((prev) => {
      if (prev.key !== colKey) {
        return { key: colKey, direction: "asc" };
      } else if (prev.direction === "asc") {
        return { key: colKey, direction: "desc" };
      } else if (prev.direction === "desc") {
        return { key: null, direction: null };
      } else {
        return { key: colKey, direction: "asc" };
      }
    });
  };

  return (
    <div
      className={`${styles.tableContainer} ${
        smallApp ? styles.smallApp : ""
      } ${className}`}
    >
      <table className={styles.table} {...props}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                onClick={() => handleSort(col.key)}
                style={{
                  cursor: editMode ? "default" : "pointer", // Change cursor during edit mode
                  opacity: editMode ? 0.6 : 1, // Visual indication that sorting is disabled
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {col.label}
                  {!editMode &&
                    sort.key === col.key &&
                    sort.direction === "asc" && (
                      <ArrowUp size={16} style={{ verticalAlign: "middle" }} />
                    )}
                  {!editMode &&
                    sort.key === col.key &&
                    sort.direction === "desc" && (
                      <ArrowDown
                        size={16}
                        style={{ verticalAlign: "middle" }}
                      />
                    )}
                  {!editMode &&
                    sort.key === col.key &&
                    sort.direction === null && (
                      <X size={14} style={{ verticalAlign: "middle" }} />
                    )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) =>
            typeof renderRow === "function" ? (
              renderRow(row, idx)
            ) : (
              <tr key={row.id || idx}>
                {columns.map((col) => {
                  let value = row[col.key];
                  if (col.key.toLowerCase().includes("date")) {
                    value = formatDate(value);
                  }
                  return (
                    <td key={col.key}>
                      {col.render ? col.render(value, row, idx) : value}
                    </td>
                  );
                })}
              </tr>
            )
          )}
          {extraRow}
        </tbody>
      </table>
      {sortedData.length === 0 && (
        <div className={styles.noResults}>No matching results found.</div>
      )}
    </div>
  );
};

export default Table;
