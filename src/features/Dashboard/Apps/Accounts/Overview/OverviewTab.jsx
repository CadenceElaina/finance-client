// src/features/Dashboard/Apps/Accounts/Overview/OverviewTab.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../../hooks/useEditableTable";
import Table from "../../../../../components/ui/Table/Table";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../../components/ui/ControlPanel/ControlPanel";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import AccountGoalUpdateModal from "../../../../../components/ui/Modal/AccountGoalUpdateModal";
import accountsStyles from "../Accounts.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../../components/ui/Table/Table.module.css";

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

// Add this function to detect open apps (you may need to adjust based on your architecture)
const useIsAppOpen = (appId) => {
  // This is a simplified detection - you may need to adapt based on your app management
  // One way is to check if there's a Plan app window in the DOM
  useEffect(() => {
    const checkPlanApp = () => {
      const planAppElements = document.querySelectorAll('[data-app-id="plan"]');
      return planAppElements.length > 0;
    };

    setIsPlanAppOpen(checkPlanApp());

    // Optional: Set up a mutation observer to watch for app changes
    const observer = new MutationObserver(() => {
      setIsPlanAppOpen(checkPlanApp());
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-app-id"],
    });

    return () => observer.disconnect();
  }, []);

  const [isPlanAppOpen, setIsPlanAppOpen] = useState(false);
  return isPlanAppOpen;
};

const OverviewTab = ({ smallApp }) => {
  const {
    data,
    saveData,
    clearAccountsData,
    resetAccountsToDemo,
    accountChangeNotifications, // Make sure this is included
    applyGoalUpdateFromNotification,
    dismissAccountChangeNotification,
    clearAllAccountChangeNotifications,
  } = useFinancialData();

  const accounts = data.accounts || [];
  const portfolios = data.portfolios || [];

  // Modal state for account change notifications
  const [activeNotification, setActiveNotification] = useState(null);

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

  // Add this line to detect if Plan app is open
  const isPlanAppOpen = useIsAppOpen("plan");

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
      // View mode - display only
      return (
        <tr key={account.id || index}>
          <td>{account.name}</td>
          <td>{account.accountProvider}</td>
          <td>{account.category}</td>
          <td>{account.subType}</td>
          <td className={tableStyles.alignRight}>
            $
            {account.value?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }) || "0.00"}
          </td>
          <td>{account.taxStatus}</td>
          <td>{account.interestRate ? `${account.interestRate}%` : "-"}</td>
          <td>
            {account.monthlyPayment
              ? `$${account.monthlyPayment.toLocaleString()}`
              : "-"}
          </td>
          <td>{account.portfolioName || "-"}</td>
        </tr>
      );
    }

    // Edit mode - inputs
    return (
      <tr key={account.id || index}>
        <td>
          <input
            type="text"
            value={account.name || ""}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="text"
            value={account.accountProvider || ""}
            onChange={(e) =>
              updateEditRow(index, "accountProvider", e.target.value)
            }
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <select
            value={account.category || "Cash"}
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
            value={account.subType || ""}
            onChange={(e) => updateEditRow(index, "subType", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="number"
            value={account.value || ""}
            onChange={(e) =>
              updateEditRow(index, "value", parseFloat(e.target.value) || 0)
            }
            className={tableStyles.tableInput}
            step="0.01"
            min="-999999999"
            max="999999999"
          />
        </td>
        <td>
          <input
            type="text"
            value={account.taxStatus || ""}
            onChange={(e) => updateEditRow(index, "taxStatus", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="number"
            value={account.interestRate || ""}
            onChange={(e) =>
              updateRow(index, "interestRate", parseFloat(e.target.value) || "")
            }
            className={tableStyles.tableInput}
            step="0.01"
            min="0"
            max="100"
          />
        </td>
        <td>
          <input
            type="number"
            value={account.monthlyPayment || ""}
            onChange={(e) =>
              updateRow(
                index,
                "monthlyPayment",
                parseFloat(e.target.value) || ""
              )
            }
            className={tableStyles.tableInput}
            step="0.01"
            min="0"
          />
        </td>
        <td>
          <select
            value={account.portfolioId || ""}
            onChange={(e) =>
              updateEditRow(index, "portfolioId", e.target.value || null)
            }
            className={tableStyles.tableSelect}
          >
            <option value="">No Portfolio</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </td>
        <td>
          <button
            onClick={() => removeEditRow(index)}
            className={tableStyles.removeButton}
            title="Remove"
          >
            Remove
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

  // Handle opening Plan app (you'll need to implement this based on your app architecture)
  const handleOpenPlanApp = () => {
    // This would need to be implemented based on how your apps communicate
    // For now, we'll just close the modal and show an alert
    alert("This would open the Plan app and navigate to the Goals tab");
    setActiveNotification(null);
  };

  // Handle confirming goal update from notification
  const handleConfirmGoalUpdate = (amountToAdd) => {
    if (activeNotification) {
      applyGoalUpdateFromNotification(activeNotification.id, amountToAdd);
      setActiveNotification(null);
    }
  };

  // Handle dismissing notification
  const handleDismissNotification = (notificationId) => {
    dismissAccountChangeNotification(notificationId);
    if (activeNotification?.id === notificationId) {
      setActiveNotification(null);
    }
  };

  /*  console.log("Account Change Notifications:", accountChangeNotifications);
  console.log("Notifications length:", accountChangeNotifications.length); */

  return (
    <div className={accountsStyles.overviewContentContainer}>
      <SnapshotRow items={snapshotItems} small={smallApp} />

      {/* Account Change Notifications - Filter out completed goals */}
      {accountChangeNotifications.filter(
        (notification) => notification.goal.status !== "completed"
      ).length > 0 && (
        <Section
          header={
            <div className={sectionStyles.sectionHeaderRow}>
              <EditableTableHeader
                title={`Goal Updates Available (${
                  accountChangeNotifications.filter(
                    (notification) => notification.goal.status !== "completed"
                  ).length
                })`}
                editMode={false}
                editable={false}
              />
              <button
                onClick={clearAllAccountChangeNotifications}
                style={{
                  background: "var(--surface-light)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "var(--space-xs) var(--space-sm)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-xs)",
                }}
              >
                Dismiss All
              </button>
            </div>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-xs)",
              padding: "var(--space-sm)",
            }}
          >
            {accountChangeNotifications
              .filter(
                (notification) => notification.goal.status !== "completed"
              )
              .map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    background: "var(--surface-dark)",
                    border: "1px solid var(--color-primary)",
                    borderRadius: "var(--border-radius-md)",
                    padding: "var(--space-sm)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{notification.goal.name}</strong> can be updated -
                    <span style={{ marginLeft: "var(--space-xs)" }}>
                      {notification.accountName}: $
                      {notification.oldValue.toLocaleString()} → $
                      {notification.newValue.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                    <button
                      onClick={() => setActiveNotification(notification)}
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--border-radius-sm)",
                        padding: "var(--space-xs) var(--space-sm)",
                        cursor: "pointer",
                      }}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDismissNotification(notification.id)}
                      style={{
                        background: "var(--surface-light)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--border-radius-sm)",
                        padding: "var(--space-xs) var(--space-sm)",
                        cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* Existing accounts table */}
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="All Accounts"
              editMode={editMode}
              onEnterEdit={enterEditMode}
              onCancelEdit={cancelEdit}
              editable={true}
            />
            <div className={tableStyles.filterRow}>
              <label className={tableStyles.filterLabel}>
                Portfolio:
                <select
                  value={portfolioFilter}
                  onChange={(e) => setPortfolioFilter(e.target.value)}
                  className={tableStyles.filterSelect}
                >
                  <option value="all">All Portfolios</option>
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
          editMode={editMode} // Pass editMode prop to Table
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
                    step="0.01"
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
                  <input
                    type="number"
                    name="interestRate"
                    value={newAccount.interestRate}
                    onChange={handleNewAccountChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="monthlyPayment"
                    value={newAccount.monthlyPayment}
                    onChange={handleNewAccountChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                    step="0.01"
                  />
                </td>
                <td>
                  <select
                    name="portfolioId"
                    value={newAccount.portfolioId || ""}
                    onChange={handleNewAccountChange}
                    className={tableStyles.tableSelect}
                  >
                    <option value="">No Portfolio</option>
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
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

      {/* Account Goal Update Modal */}
      <AccountGoalUpdateModal
        notification={activeNotification}
        isOpen={!!activeNotification}
        onClose={() => setActiveNotification(null)}
        onConfirm={handleConfirmGoalUpdate}
        onOpenPlanApp={handleOpenPlanApp}
        isPlanAppOpen={isPlanAppOpen} // Pass the new prop
      />
    </div>
  );
};

export default OverviewTab;
