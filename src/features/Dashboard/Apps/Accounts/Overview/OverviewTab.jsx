// src/features/Dashboard/Apps/Accounts/OverviewTab.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import Table from "../../../../../components/ui/Table/Table";
import tableStyles from "../../../../../components/ui/Table/Table.module.css";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../../components/ui/ControlPanel/ControlPanel";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import accountsStyles from "../Accounts.module.css";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../../hooks/useEditableTable";

const EMPTY_ACCOUNT = {
  name: "",
  accountProvider: "",
  category: "Cash",
  subType: "",
  value: "",
  taxStatus: "",
  interestRate: "",
  monthlyPayment: "",
  portfolioId: null,
};

const CATEGORIES = [
  { value: "Cash", label: "Cash" },
  { value: "Investments", label: "Investments" },
  { value: "Debt", label: "Debt" },
];

const OverviewTab = ({ smallApp }) => {
  const { data, saveData, clearAccountsData, resetAccountsToDemo } =
    useFinancialData();

  const accounts = data.accounts || [];
  const portfolios = data.portfolios || [];

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    exitEditMode,
    updateEditRow,
    addEditRow,
    removeEditRow,
  } = useEditableTable(accounts);

  const [portfolioFilter, setPortfolioFilter] = useState("all");
  const [newAccount, setNewAccount] = useState({ ...EMPTY_ACCOUNT });
  const newAccountNameRef = useRef(null);

  // Handle saving from control panel
  const handleSave = () => {
    // Check for new portfolios that need to be created
    const existingPortfolioNames = portfolios
      .map((p) => p.name?.toLowerCase())
      .filter(Boolean);
    const newPortfolios = [...portfolios];
    const portfolioNameToId = {};

    // Map existing portfolios
    portfolios.forEach((p) => {
      if (p.name) {
        portfolioNameToId[p.name.toLowerCase()] = p.id;
      }
    });

    // Create new portfolios if needed
    editRows.forEach((account) => {
      if (account.portfolioName && account.portfolioName.trim()) {
        const portfolioNameLower = account.portfolioName.toLowerCase();
        if (!existingPortfolioNames.includes(portfolioNameLower)) {
          const newPortfolioId = `portfolio-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          newPortfolios.push({
            id: newPortfolioId,
            name: account.portfolioName,
          });
          portfolioNameToId[portfolioNameLower] = newPortfolioId;
          existingPortfolioNames.push(portfolioNameLower);
        }
      }
    });

    // Update accounts with portfolio assignments
    const updatedAccounts = editRows.map((account) => ({
      ...account,
      value: parseFloat(account.value) || 0,
      interestRate: account.interestRate
        ? parseFloat(account.interestRate)
        : null,
      monthlyPayment: account.monthlyPayment
        ? parseFloat(account.monthlyPayment)
        : null,
      portfolioId: account.portfolioName
        ? portfolioNameToId[account.portfolioName.toLowerCase()]
        : null,
    }));

    const updatedData = {
      ...data,
      accounts: updatedAccounts,
      portfolios: newPortfolios,
    };

    saveData(updatedData);
    exitEditMode();
  };

  // Handle reset to demo accounts
  const handleResetToDemo = () => {
    if (editMode) {
      resetAccountsToDemo();
      exitEditMode();
    } else {
      resetAccountsToDemo();
    }
  };

  // Handle clear all accounts
  const handleClearAll = () => {
    if (editMode) {
      clearAccountsData();
      exitEditMode();
    } else {
      clearAccountsData();
    }
  };

  // Add portfolio names to accounts for display
  const accountsWithPortfolios = useMemo(() => {
    return (editMode ? editRows : accounts).map((account) => ({
      ...account,
      portfolioName: account.portfolioId
        ? portfolios.find((p) => p.id === account.portfolioId)?.name ||
          "Unknown Portfolio"
        : "",
    }));
  }, [editMode, editRows, accounts, portfolios]);

  // Filtering for display - only by portfolio
  const displayAccounts =
    portfolioFilter === "all"
      ? accountsWithPortfolios
      : accountsWithPortfolios.filter(
          (account) => account.portfolioId === portfolioFilter
        );

  // Calculations for snapshot
  const totalCash = accounts
    .filter((acc) => acc.category === "Cash")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalInvestments = accounts
    .filter((acc) => acc.category === "Investments")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalDebt = accounts
    .filter((acc) => acc.category === "Debt")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

  const snapshotItems = [
    {
      label: "Net Worth",
      value: `$${(totalCash + totalInvestments + totalDebt).toLocaleString(
        undefined,
        { minimumFractionDigits: 2 }
      )}`,
      valueClass: "positive",
    },
    {
      label: "Cash",
      value: `$${totalCash.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Assets",
      value: `$${(totalCash + totalInvestments).toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "positive",
    },
    {
      label: "Liabilities",
      value: `$${Math.abs(totalDebt).toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      valueClass: "negative",
    },
  ];

  const handleNewAccountChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({
      ...prev,
      [name]:
        name === "value" || name === "interestRate" || name === "monthlyPayment"
          ? value === ""
            ? ""
            : parseFloat(value) || ""
          : value,
    }));
  };

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.accountProvider) {
      const account = {
        id: `acc-${Date.now()}`,
        ...newAccount,
        value: parseFloat(newAccount.value) || 0,
        interestRate: newAccount.interestRate
          ? parseFloat(newAccount.interestRate)
          : null,
        monthlyPayment: newAccount.monthlyPayment
          ? parseFloat(newAccount.monthlyPayment)
          : null,
        portfolioName: newAccount.portfolioName || "",
      };

      if (editMode) {
        addEditRow(account);
      } else {
        // If not in edit mode, directly update data
        const updatedData = {
          ...data,
          accounts: [...accounts, account],
        };
        saveData(updatedData);
      }

      setNewAccount({ ...EMPTY_ACCOUNT });
      newAccountNameRef.current?.focus();
    }
  };

  const renderAccountRow = (account, index) => {
    if (!editMode) {
      // View mode - plain text, no action column
      return (
        <tr key={account.id}>
          <td>{account.name}</td>
          <td>{account.accountProvider}</td>
          <td>{account.category}</td>
          <td>{account.subType}</td>
          <td>
            <span
              className={
                account.value >= 0
                  ? accountsStyles.positive
                  : accountsStyles.negative
              }
            >
              $
              {Math.abs(account.value || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </td>
          <td>{account.taxStatus}</td>
          <td>
            {account.category === "Debt"
              ? account.interestRate
                ? `${account.interestRate}%`
                : "N/A"
              : "N/A"}
          </td>
          <td>
            {account.category === "Debt"
              ? account.monthlyPayment
                ? `$${parseFloat(account.monthlyPayment).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                    }
                  )}`
                : "N/A"
              : "N/A"}
          </td>
          <td>{account.portfolioName || "-"}</td>
        </tr>
      );
    }

    // Edit mode - inputs
    return (
      <tr key={account.id}>
        <td>
          <input
            type="text"
            value={account.name}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="text"
            value={account.accountProvider}
            onChange={(e) =>
              updateEditRow(index, "accountProvider", e.target.value)
            }
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <select
            value={account.category}
            onChange={(e) => updateEditRow(index, "category", e.target.value)}
            className={tableStyles.tableSelect}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </td>
        <td>
          <input
            type="text"
            value={account.subType}
            onChange={(e) => updateEditRow(index, "subType", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="number"
            value={account.value}
            onChange={(e) =>
              updateEditRow(index, "value", parseFloat(e.target.value) || 0)
            }
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="text"
            value={account.taxStatus}
            onChange={(e) => updateEditRow(index, "taxStatus", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          {account.category === "Debt" ? (
            <input
              type="number"
              value={account.interestRate || ""}
              onChange={(e) =>
                updateEditRow(
                  index,
                  "interestRate",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className={tableStyles.tableInput}
              min="0"
              step="0.01"
              placeholder="%"
            />
          ) : (
            <span>-</span>
          )}
        </td>
        <td>
          {account.category === "Debt" ? (
            <input
              type="number"
              value={account.monthlyPayment || ""}
              onChange={(e) =>
                updateEditRow(
                  index,
                  "monthlyPayment",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className={tableStyles.tableInput}
              min="0"
              step="0.01"
              placeholder="$"
            />
          ) : (
            <span>-</span>
          )}
        </td>
        <td>
          <input
            type="text"
            value={account.portfolioName || ""}
            onChange={(e) =>
              updateEditRow(index, "portfolioName", e.target.value)
            }
            className={tableStyles.tableInput}
            placeholder="Portfolio name"
          />
        </td>
        <td>
          <button
            onClick={() => removeEditRow(index)}
            className={tableStyles.removeButton}
            title="Remove"
          >
            ✕
          </button>
        </td>
      </tr>
    );
  };

  // Define columns based on edit mode
  const viewColumns = [
    { key: "name", label: "Account" },
    { key: "accountProvider", label: "Institution" },
    { key: "category", label: "Category" },
    { key: "subType", label: "Type" },
    { key: "value", label: "Value" },
    { key: "taxStatus", label: "Tax Status" },
    { key: "interestRate", label: "Interest Rate" },
    { key: "monthlyPayment", label: "Monthly Payment" },
    { key: "portfolioName", label: "Portfolio" },
  ];

  const editColumns = [...viewColumns, { key: "action", label: "Actions" }];

  const columns = editMode ? editColumns : viewColumns;

  return (
    <div className={accountsStyles.overviewContentContainer}>
      <SnapshotRow items={snapshotItems} small={smallApp} />

      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Accounts"
              editMode={editMode}
              onEnterEdit={enterEditMode}
              onCancelEdit={cancelEdit}
              editable={true}
            />
            {/* Portfolio filter only */}
            <div className={sectionStyles.filterRow}>
              <label className={sectionStyles.filterLabel}>
                Portfolio:
                <select
                  value={portfolioFilter}
                  onChange={(e) => setPortfolioFilter(e.target.value)}
                  className={sectionStyles.filterSelect}
                >
                  <option value="all">All Accounts</option>
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        }
      >
        <Table
          columns={columns}
          data={displayAccounts}
          renderRow={renderAccountRow}
          defaultSortColumn="value"
          extraRow={
            editMode ? (
              <tr>
                <td>
                  <input
                    ref={newAccountNameRef}
                    type="text"
                    name="name"
                    value={newAccount.name}
                    onChange={handleNewAccountChange}
                    placeholder="Account name"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="accountProvider"
                    value={newAccount.accountProvider}
                    onChange={handleNewAccountChange}
                    placeholder="Institution"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <select
                    name="category"
                    value={newAccount.category}
                    onChange={handleNewAccountChange}
                    className={tableStyles.tableSelect}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name="subType"
                    value={newAccount.subType}
                    onChange={handleNewAccountChange}
                    placeholder="Type"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="value"
                    value={newAccount.value}
                    onChange={handleNewAccountChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="taxStatus"
                    value={newAccount.taxStatus}
                    onChange={handleNewAccountChange}
                    placeholder="Tax status"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  {newAccount.category === "Debt" ? (
                    <input
                      type="number"
                      name="interestRate"
                      value={newAccount.interestRate}
                      onChange={handleNewAccountChange}
                      placeholder="%"
                      className={tableStyles.tableInput}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td>
                  {newAccount.category === "Debt" ? (
                    <input
                      type="number"
                      name="monthlyPayment"
                      value={newAccount.monthlyPayment}
                      onChange={handleNewAccountChange}
                      placeholder="$"
                      className={tableStyles.tableInput}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    name="portfolioName"
                    value={newAccount.portfolioName || ""}
                    onChange={handleNewAccountChange}
                    placeholder="Portfolio name"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <button
                    onClick={handleAddAccount}
                    className={tableStyles.addButton}
                    title="Add"
                  >
                    +
                  </button>
                </td>
              </tr>
            ) : null
          }
          smallApp={smallApp}
        />

        {/* Control Panel - only show in edit mode */}
        {editMode && (
          <ControlPanel
            onSave={handleSave}
            saveLabel="Save Accounts"
            onReset={handleResetToDemo}
            onClear={handleClearAll}
            resetLabel="Reset to Demo"
          />
        )}
      </Section>
    </div>
  );
};

export default OverviewTab;
