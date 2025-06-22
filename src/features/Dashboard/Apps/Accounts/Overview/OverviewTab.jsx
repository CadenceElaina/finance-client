// src/features/Dashboard/Apps/Accounts/Overview/OverviewTab.jsx
import React, { useState, useRef, useMemo, useEffect } from "react";
import { useToast } from "../../../../../hooks/useToast";
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
  subType: "Checking",
  value: "",
  taxStatus: "Taxable",
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

const ACCOUNT_SUBTYPES = {
  Cash: [
    { value: "Checking", label: "Checking" },
    { value: "Savings", label: "Savings" },
    { value: "Money Market", label: "Money Market" },
    { value: "CD", label: "Certificate of Deposit" },
    { value: "Other Cash", label: "Other Cash" },
  ],
  Investments: [
    { value: "401(k)", label: "401(k)" },
    { value: "403(b)", label: "403(b)" },
    { value: "TSP", label: "Thrift Savings Plan (TSP)" },
    { value: "Roth IRA", label: "Roth IRA" },
    { value: "Traditional IRA", label: "Traditional IRA" },
    { value: "SEP IRA", label: "SEP IRA" },
    { value: "SIMPLE IRA", label: "SIMPLE IRA" },
    { value: "Taxable Brokerage", label: "Taxable Brokerage" },
    { value: "529 Plan", label: "529 Education Plan" },
    { value: "HSA", label: "Health Savings Account" },
    { value: "Other Investment", label: "Other Investment" },
  ],
  Debt: [
    { value: "Credit Card", label: "Credit Card" },
    { value: "Personal Loan", label: "Personal Loan" },
    { value: "Student Loan", label: "Student Loan" },
    { value: "Auto Loan", label: "Auto Loan" },
    { value: "Mortgage", label: "Mortgage" },
    { value: "HELOC", label: "Home Equity Line of Credit" },
    { value: "Other Debt", label: "Other Debt" },
  ],
};

const OverviewTab = ({ smallApp }) => {
  const {
    data,
    saveData,
    clearAccountsData,
    resetAccountsToDemo,
    accountChangeNotifications,
    applyGoalUpdateFromNotification,
    dismissAccountChangeNotification,
    clearAllAccountChangeNotifications,
  } = useFinancialData();

  const { showSuccess, showInfo } = useToast(); // Use specific toast methods

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

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newAccount, setNewAccount] = useState({ ...EMPTY_ACCOUNT });
  const newAccountNameRef = useRef(null);

  // FIX: Add the missing state declaration
  const [originalDebtPayments, setOriginalDebtPayments] = useState({});

  // Add this line to detect if Plan app is open
  const isPlanAppOpen = useIsAppOpen("plan");

  // Update enterEditMode to track original debt payments
  const handleEnterEditMode = () => {
    const debtPayments = {};
    accounts.forEach((account) => {
      if (account.category === "Debt") {
        debtPayments[account.id] = {
          name: account.name,
          monthlyPayment: account.monthlyPayment || 0,
        };
      }
    });
    setOriginalDebtPayments(debtPayments);
    enterEditMode();
  };

  // Update cancelEdit to clear tracking
  const handleCancelEdit = () => {
    setOriginalDebtPayments({});
    cancelEdit();
  };

  // Update the handleSave function
  const handleSave = () => {
    // Find changed debt payment accounts
    const originalDebtAccounts = accounts.filter(
      (acc) => acc.category === "Debt"
    );
    const editedDebtAccounts = editRows.filter(
      (acc) => acc.category === "Debt"
    );

    let expenseChanges = [];

    // Track changes to debt account monthly payments
    editedDebtAccounts.forEach((editedAcc) => {
      const origAcc = originalDebtAccounts.find((o) => o.id === editedAcc.id);
      if (origAcc && origAcc.monthlyPayment !== editedAcc.monthlyPayment) {
        const oldPayment = origAcc.monthlyPayment || 0;
        const newPayment = editedAcc.monthlyPayment || 0;

        if (oldPayment !== newPayment) {
          expenseChanges.push({
            name: editedAcc.name,
            oldAmount: oldPayment,
            newAmount: newPayment,
            type:
              newPayment === 0
                ? "removed"
                : oldPayment === 0
                ? "added"
                : "updated",
          });
        }
      }
    });

    // Check for new debt accounts with monthly payments
    const newDebtAccounts = editRows.filter(
      (editedAcc) =>
        editedAcc.category === "Debt" &&
        editedAcc.monthlyPayment > 0 &&
        !accounts.find((origAcc) => origAcc.id === editedAcc.id)
    );

    newDebtAccounts.forEach((newAcc) => {
      expenseChanges.push({
        name: newAcc.name,
        oldAmount: 0,
        newAmount: newAcc.monthlyPayment,
        type: "added",
      });
    });

    // Check for removed debt accounts
    const removedDebtAccounts = originalDebtAccounts.filter(
      (origAcc) =>
        origAcc.monthlyPayment > 0 &&
        !editRows.find((editedAcc) => editedAcc.id === origAcc.id)
    );

    removedDebtAccounts.forEach((removedAcc) => {
      expenseChanges.push({
        name: removedAcc.name,
        oldAmount: removedAcc.monthlyPayment,
        newAmount: 0,
        type: "removed",
      });
    });

    // Save the data first
    const updatedData = {
      ...data,
      accounts: editRows,
    };
    saveData(updatedData);
    exitEditMode();
    setOriginalDebtPayments({});

    // Show a single notification for expense changes
    if (expenseChanges.length > 0) {
      let message;
      if (expenseChanges.length === 1) {
        const change = expenseChanges[0];
        if (change.type === "added") {
          message = `Expense added: ${change.name} payment ($${change.newAmount}/month)`;
        } else if (change.type === "removed") {
          message = `Expense removed: ${change.name} payment (was $${change.oldAmount}/month)`;
        } else {
          message = `Expense updated: ${change.name} payment ($${change.oldAmount} → $${change.newAmount}/month)`;
        }
      } else {
        message =
          "Expenses updated:\n" +
          expenseChanges
            .map((change, i) => {
              if (change.type === "added") {
                return `${i + 1}. ${change.name} payment added ($${
                  change.newAmount
                }/month)`;
              } else if (change.type === "removed") {
                return `${i + 1}. ${change.name} payment removed (was $${
                  change.oldAmount
                }/month)`;
              } else {
                return `${i + 1}. ${change.name} payment ($${
                  change.oldAmount
                } → $${change.newAmount}/month)`;
              }
            })
            .join("\n");
      }
      showInfo(message, { autoClose: 6000 });
    } else {
      showSuccess("Accounts saved successfully!");
    }
  };

  // Handle reset to demo accounts
  const handleResetToDemo = () => {
    if (
      window.confirm(
        "Reset all accounts to demo data? This will clear your current accounts."
      )
    ) {
      resetAccountsToDemo();
      exitEditMode();
    }
  };

  // Handle clear all accounts
  const handleClearAll = () => {
    if (window.confirm("Clear all accounts? This action cannot be undone.")) {
      clearAccountsData();
      exitEditMode();
    }
  };

  // Update filtering for display - by category instead of portfolio
  const displayAccounts = useMemo(() => {
    const accountsWithPortfolios = editMode ? editRows : accounts;

    if (categoryFilter === "all") {
      return accountsWithPortfolios.map((account) => ({
        ...account,
        portfolioName:
          account.portfolioId &&
          portfolios.find((p) => p.id === account.portfolioId)?.name
            ? portfolios.find((p) => p.id === account.portfolioId)?.name
            : "N/A",
      }));
    }

    return accountsWithPortfolios
      .filter((account) => account.category === categoryFilter)
      .map((account) => ({
        ...account,
        portfolioName:
          account.portfolioId &&
          portfolios.find((p) => p.id === account.portfolioId)?.name
            ? portfolios.find((p) => p.id === account.portfolioId)?.name
            : "N/A",
      }));
  }, [editMode, editRows, accounts, portfolios, categoryFilter]);

  // Category select menu (use consistent styling)
  const categorySelectMenu = (
    <div className={sectionStyles.selectGroup}>
      <label htmlFor="category-select" className={sectionStyles.selectLabel}>
        Category:
      </label>
      <select
        id="category-select"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className={sectionStyles.baseSelect}
      >
        <option value="all">All Categories</option>
        <option value="Cash">Cash</option>
        <option value="Investments">Investments</option>
        <option value="Debt">Debt</option>
      </select>
    </div>
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

  const [showNewPortfolioInput, setShowNewPortfolioInput] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");

  const handleNewAccountChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      // When category changes, reset fields appropriately
      const defaultSubType = ACCOUNT_SUBTYPES[value]?.[0]?.value || "";
      setNewAccount((prev) => ({
        ...prev,
        category: value,
        subType: defaultSubType,
        // Reset fields based on category
        taxStatus: value === "Debt" ? "N/A" : "",
        portfolioId: value === "Investments" ? prev.portfolioId : null,
        // Clear debt-specific fields if not debt category
        ...(value !== "Debt" && {
          interestRate: "",
          monthlyPayment: "",
        }),
        // Set appropriate tax status defaults
        ...(value === "Cash" && { taxStatus: "Taxable" }),
        ...(value === "Investments" && { taxStatus: "" }),
      }));
    } else if (name === "portfolioId" && value === "__new__") {
      // Handle new portfolio creation
      const portfolioName = prompt("Enter new portfolio name:");
      if (portfolioName && portfolioName.trim()) {
        const newPortfolioId = `portfolio-${Date.now()}`;
        const newPortfolio = {
          id: newPortfolioId,
          name: portfolioName.trim(),
        };

        // Add the new portfolio to the data
        const updatedData = {
          ...data,
          portfolios: [...portfolios, newPortfolio],
        };
        saveData(updatedData);

        // Set the new portfolio as selected
        setNewAccount((prev) => ({
          ...prev,
          portfolioId: newPortfolioId,
        }));
      }
    } else {
      setNewAccount((prev) => ({
        ...prev,
        [name]:
          name === "value" ||
          name === "interestRate" ||
          name === "monthlyPayment"
            ? value === ""
              ? ""
              : parseFloat(value) || 0
            : value,
      }));
    }
  };

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) {
      alert("Please enter an account name");
      return;
    }

    if (!newAccount.subType) {
      alert("Please select an account type");
      return;
    }

    let accountValue = parseFloat(newAccount.value) || 0;

    // For debt accounts, make the value negative
    if (newAccount.category === "Debt" && accountValue > 0) {
      accountValue = -accountValue;
    }

    const accountWithId = {
      ...newAccount,
      id: `acc-${Date.now()}`,
      value: accountValue,
      interestRate:
        newAccount.category === "Debt"
          ? parseFloat(newAccount.interestRate) || 0
          : null,
      monthlyPayment:
        newAccount.category === "Debt"
          ? parseFloat(newAccount.monthlyPayment) || 0
          : null,
      taxStatus: newAccount.category === "Debt" ? "N/A" : newAccount.taxStatus,
      portfolioId:
        newAccount.category === "Investments" ? newAccount.portfolioId : null,
    };

    addEditRow(accountWithId);
    setNewAccount({ ...EMPTY_ACCOUNT });

    if (newAccountNameRef.current) {
      newAccountNameRef.current.focus();
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
            {account.category === "Debt" && account.value < 0
              ? `-$${Math.abs(account.value).toLocaleString()}`
              : `$${(account.value || 0).toLocaleString()}`}
          </td>
          <td>{account.taxStatus}</td>
          <td>
            {account.interestRate
              ? `${account.interestRate}%`
              : account.category === "Debt"
              ? "0%"
              : "-"}
          </td>
          <td>
            {account.monthlyPayment
              ? `$${account.monthlyPayment}`
              : account.category === "Debt"
              ? "$0"
              : "-"}
          </td>
          <td>{account.portfolioName || "-"}</td>
        </tr>
      );
    }

    // Edit mode
    const isDebtAccount = account.category === "Debt";
    const isInvestmentAccount = account.category === "Investments";
    const availableSubTypes = ACCOUNT_SUBTYPES[account.category] || [];

    return (
      <tr key={account.id || index}>
        <td>
          <input
            type="text"
            value={account.name || ""}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
            placeholder="Account name"
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
            placeholder="Institution"
          />
        </td>
        <td>
          <select
            value={account.category || "Cash"}
            onChange={(e) => {
              const newCategory = e.target.value;
              const defaultSubType =
                ACCOUNT_SUBTYPES[newCategory]?.[0]?.value || "";

              // Update multiple fields when category changes
              updateEditRow(index, "category", newCategory);
              updateEditRow(index, "subType", defaultSubType);

              // Handle tax status
              if (newCategory === "Debt") {
                updateEditRow(index, "taxStatus", "N/A");
                updateEditRow(index, "portfolioId", null);
              } else if (newCategory === "Cash") {
                updateEditRow(index, "taxStatus", "Taxable");
                updateEditRow(index, "portfolioId", null);
                updateEditRow(index, "interestRate", null);
                updateEditRow(index, "monthlyPayment", null);
              } else if (newCategory === "Investments") {
                updateEditRow(index, "taxStatus", "");
                updateEditRow(index, "interestRate", null);
                updateEditRow(index, "monthlyPayment", null);
              }
            }}
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
          <select
            value={account.subType || ""}
            onChange={(e) => updateEditRow(index, "subType", e.target.value)}
            className={tableStyles.tableSelect}
          >
            <option value="">Select Type</option>
            {availableSubTypes.map((subType) => (
              <option key={subType.value} value={subType.value}>
                {subType.label}
              </option>
            ))}
          </select>
        </td>
        <td>
          <input
            type="number"
            value={Math.abs(account.value) || ""}
            onChange={(e) => {
              let inputValue = parseFloat(e.target.value) || 0;
              // For debt accounts, store as negative
              if (isDebtAccount && inputValue > 0) {
                inputValue = -inputValue;
              }
              updateEditRow(index, "value", inputValue);
            }}
            className={tableStyles.tableInput}
            placeholder={isDebtAccount ? "Enter positive amount" : "0"}
            step="0.01"
            min="0"
          />
        </td>
        <td>
          {isDebtAccount ? (
            <span
              className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
            >
              N/A
            </span>
          ) : (
            <select
              value={account.taxStatus || ""}
              onChange={(e) =>
                updateEditRow(index, "taxStatus", e.target.value)
              }
              className={tableStyles.tableSelect}
            >
              <option value="">Select Status</option>
              <option value="Taxable">Taxable</option>
              <option value="Tax-deferred">Tax-deferred</option>
              <option value="Tax-free">Tax-free</option>
              <option value="N/A">N/A</option>
            </select>
          )}
        </td>
        <td>
          {isDebtAccount ? (
            <input
              type="number"
              value={account.interestRate || ""}
              onChange={(e) =>
                updateEditRow(
                  index,
                  "interestRate",
                  parseFloat(e.target.value) || 0
                )
              }
              className={tableStyles.tableInput}
              placeholder="0.00"
              step="0.01"
              min="0"
              max="100"
              title="Changes will be reflected in your budget when you save"
            />
          ) : (
            <span
              className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
            >
              -
            </span>
          )}
        </td>
        <td>
          {isDebtAccount ? (
            <input
              type="number"
              value={account.monthlyPayment || ""}
              onChange={(e) =>
                updateEditRow(
                  index,
                  "monthlyPayment",
                  parseFloat(e.target.value) || 0
                )
              }
              className={tableStyles.tableInput}
              placeholder="0"
              step="0.01"
              min="0"
              title="Changes will be reflected in your budget when you save"
            />
          ) : (
            <span
              className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
            >
              -
            </span>
          )}
        </td>
        <td>
          {isInvestmentAccount ? (
            <select
              value={account.portfolioId || ""}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  const portfolioName = prompt("Enter new portfolio name:");
                  if (portfolioName && portfolioName.trim()) {
                    const newPortfolioId = `portfolio-${Date.now()}`;
                    const newPortfolio = {
                      id: newPortfolioId,
                      name: portfolioName.trim(),
                    };

                    // Add the new portfolio to the data
                    const updatedData = {
                      ...data,
                      portfolios: [...portfolios, newPortfolio],
                    };
                    saveData(updatedData);

                    // Set the new portfolio for this account
                    updateEditRow(index, "portfolioId", newPortfolioId);
                  }
                } else {
                  updateEditRow(index, "portfolioId", e.target.value);
                }
              }}
              className={tableStyles.tableSelect}
            >
              <option value="">No Portfolio</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
              <option value="__new__">+ Create New Portfolio</option>
            </select>
          ) : (
            <span
              className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
            >
              -
            </span>
          )}
        </td>
        <td>
          <button
            onClick={() => removeEditRow(index)}
            className={tableStyles.removeButton}
            title="Remove account"
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
      {/* Account change notification modal */}
      <AccountGoalUpdateModal
        notification={activeNotification}
        isOpen={!!activeNotification}
        onClose={() => setActiveNotification(null)}
        onConfirm={(notificationId, amountToAdd) =>
          handleApplyGoalUpdate(notificationId, amountToAdd)
        }
        onOpenPlanApp={() => {
          /* Handle opening plan app if needed */
        }}
      />

      {/* Snapshot Row */}
      <SnapshotRow items={snapshotItems} small={smallApp} />

      {/* Account Change Notifications */}
      {accountChangeNotifications.length > 0 && (
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

      {/* Accounts Table */}
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="All Accounts"
              editMode={editMode}
              onEnterEdit={handleEnterEditMode}
              onCancelEdit={handleCancelEdit}
              editable={true}
            />
            <div className={sectionStyles.sectionHeaderRight}>
              {categorySelectMenu}
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
                  <select
                    name="subType"
                    value={newAccount.subType}
                    onChange={handleNewAccountChange}
                    className={tableStyles.tableSelect}
                  >
                    <option value="">Select Type</option>
                    {(ACCOUNT_SUBTYPES[newAccount.category] || []).map(
                      (subType) => (
                        <option key={subType.value} value={subType.value}>
                          {subType.label}
                        </option>
                      )
                    )}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    name="value"
                    value={newAccount.value}
                    onChange={handleNewAccountChange}
                    placeholder={
                      newAccount.category === "Debt"
                        ? "Enter positive amount"
                        : "0"
                    }
                    className={tableStyles.tableInput}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>
                  {newAccount.category === "Debt" ? (
                    <span
                      className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
                    >
                      N/A
                    </span>
                  ) : (
                    <select
                      name="taxStatus"
                      value={newAccount.taxStatus}
                      onChange={handleNewAccountChange}
                      className={tableStyles.tableSelect}
                    >
                      <option value="">Select Status</option>
                      <option value="Taxable">Taxable</option>
                      <option value="Tax-deferred">Tax-deferred</option>
                      <option value="Tax-free">Tax-free</option>
                      <option value="N/A">N/A</option>
                    </select>
                  )}
                </td>
                <td>
                  {newAccount.category === "Debt" ? (
                    <input
                      type="number"
                      name="interestRate"
                      value={newAccount.interestRate}
                      onChange={handleNewAccountChange}
                      placeholder="0.00"
                      className={tableStyles.tableInput}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  ) : (
                    <span
                      className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
                    >
                      -
                    </span>
                  )}
                </td>
                <td>
                  {newAccount.category === "Debt" ? (
                    <input
                      type="number"
                      name="monthlyPayment"
                      value={newAccount.monthlyPayment}
                      onChange={handleNewAccountChange}
                      placeholder="0"
                      className={tableStyles.tableInput}
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <span
                      className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
                    >
                      -
                    </span>
                  )}
                </td>
                <td>
                  {newAccount.category === "Investments" ? (
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
                      <option value="__new__">+ Create New Portfolio</option>
                    </select>
                  ) : (
                    <span
                      className={`${tableStyles.tableInput} ${tableStyles.disabledInput}`}
                    >
                      -
                    </span>
                  )}
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
            onSave={handleSave} // Use the fixed handler
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
