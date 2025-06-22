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
  editMode = false,
  disableSortingInEditMode = true, // New prop to control sorting behavior in edit mode
  ...props
}) => {
  // Find the default sort column
  const getDefaultSort = () => {
    if (defaultSortColumn) {
      return { key: defaultSortColumn, direction: "desc" };
    }

    // Auto-detect value/cost column for descending sort
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

  // State for sorting
  const [sort, setSort] = useState(getDefaultSort);

  // Reset to default sort when data or columns change, but NOT during edit mode
  useEffect(() => {
    if (!editMode) {
      setSort(getDefaultSort());
    }
  }, [columns, data.length, editMode, defaultSortColumn]);

  // Sorted data - don't sort during edit mode if disabled
  const sortedData = useMemo(() => {
    if (editMode && disableSortingInEditMode) {
      return data; // Return data as-is during edit mode
    }

    if (!sort.key || !sort.direction) {
      return data;
    }

    return [...data].sort(getSortFn(sort.key, sort.direction === "asc"));
  }, [data, sort, editMode, disableSortingInEditMode]);

  // Handle sort icon click - disable during edit mode if specified
  const handleSort = (colKey) => {
    if (editMode && disableSortingInEditMode) return;

    if (!colKey) return;

    setSort((prevSort) => {
      if (prevSort.key !== colKey) {
        return { key: colKey, direction: "desc" };
      }

      const nextDirection =
        prevSort.direction === "desc"
          ? "asc"
          : prevSort.direction === "asc"
          ? null
          : "desc";

      return { key: colKey, direction: nextDirection };
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
                  cursor:
                    editMode && disableSortingInEditMode
                      ? "default"
                      : "pointer",
                  opacity: editMode && disableSortingInEditMode ? 0.6 : 1,
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
                  {!(editMode && disableSortingInEditMode) &&
                    sort.key === col.key &&
                    sort.direction === "asc" && (
                      <ArrowUp size={16} style={{ verticalAlign: "middle" }} />
                    )}
                  {!(editMode && disableSortingInEditMode) &&
                    sort.key === col.key &&
                    sort.direction === "desc" && (
                      <ArrowDown
                        size={16}
                        style={{ verticalAlign: "middle" }}
                      />
                    )}
                  {!(editMode && disableSortingInEditMode) &&
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
                  let cellValue = row[col.key];

                  // Apply formatter if it exists
                  if (col.formatter && typeof col.formatter === "function") {
                    cellValue = col.formatter(cellValue, row);
                  }

                  // Format dates
                  if (col.key && col.key.toLowerCase().includes("date")) {
                    cellValue = formatDate(cellValue);
                  }

                  return <td key={col.key || col.label}>{cellValue}</td>;
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
