// src/features/Dashboard/Apps/Accounts/Overview/OverviewTab.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import Table from "../../../../../components/ui/Table/Table";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";

import Button from "../../../../../components/ui/Button/Button";
import SnapshotRow from "../../../../../components/ui/Snapshot/SnapshotRow";
import AccountGoalUpdateModal from "../../../../../components/ui/Modal/AccountGoalUpdateModal";
import { useEditableTable } from "../../../../../hooks/useEditableTable";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useToast } from "../../../../../hooks/useToast";
import { detectAccountDebtChanges } from "../../../../../utils/debtPaymentSync";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../../components/ui/Table/Table.module.css";
import accountsStyles from "../Accounts.module.css";
import { Plus, X } from "lucide-react";
import { DEMO_ACCOUNTS, DEMO_PORTFOLIOS } from "../../../../../utils/constants";

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

const TAX_STATUS_OPTIONS = [
  { value: "Taxable", label: "Taxable" },
  { value: "Tax-deferred", label: "Tax-deferred" },
  { value: "Tax-free", label: "Tax-free" },
  { value: "N/A", label: "N/A" },
];

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

const generatePortfolioId = (name) => {
  return `portfolio-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
};

const viewColumns = [
  { key: "name", label: "Account Name" },
  { key: "accountProvider", label: "Provider" },
  { key: "category", label: "Category" },
  { key: "subType", label: "Type" },
  { key: "taxStatus", label: "Tax Status" },
  { key: "portfolioName", label: "Portfolio" },
  { key: "monthlyPayment", label: "Monthly Payment" },
  { key: "interestRate", label: "Interest Rate" },
  { key: "value", label: "Balance" },
];

const editColumns = [
  { key: "name", label: "Account Name" },
  { key: "accountProvider", label: "Provider" },
  { key: "category", label: "Category" },
  { key: "subType", label: "Type" },
  { key: "taxStatus", label: "Tax Status" },
  { key: "portfolioName", label: "Portfolio" },
  { key: "monthlyPayment", label: "Monthly Payment" },
  { key: "interestRate", label: "Interest Rate" },
  { key: "value", label: "Balance" },
  { key: "actions", label: "Actions" },
];

const OverviewTab = ({ smallApp, onAccountClick }) => {
  const financialDataResult = useFinancialData();
  const { showSuccess, showInfo, showWarning } = useToast();

  const [activeNotification, setActiveNotification] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newAccount, setNewAccount] = useState({ ...EMPTY_ACCOUNT });
  const newAccountNameRef = useRef(null);
  const [originalAccounts, setOriginalAccounts] = useState([]);

  const {
    data,
    saveData,
    accountChangeNotifications,
    applyGoalUpdateFromNotification,
    resetAccountsToDemo,
    clearAccountsData,
  } = financialDataResult || {};

  const accounts = data?.accounts || [];
  const portfolios = data?.portfolios || [];

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

  useEffect(() => {
    if (
      accountChangeNotifications &&
      accountChangeNotifications.length > 0 &&
      !activeNotification
    ) {
      setActiveNotification(accountChangeNotifications[0]);
    }
  }, [accountChangeNotifications, activeNotification]);

  const displayAccounts = useMemo(() => {
    const sourceAccounts = editMode ? editRows : accounts;

    const enrichedAccounts = sourceAccounts.map((account) => ({
      ...account,
      portfolioName: account.portfolioId
        ? portfolios.find((p) => p.id === account.portfolioId)?.name ||
          "Unknown"
        : "N/A",
    }));

    if (categoryFilter === "all") {
      return enrichedAccounts;
    }

    return enrichedAccounts.filter(
      (account) => account.category === categoryFilter
    );
  }, [editMode, editRows, accounts, portfolios, categoryFilter]);

  if (!financialDataResult || !data) {
    return (
      <div
        style={{
          padding: "var(--space-md)",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Loading financial data...
      </div>
    );
  }

  const handleEnterEditMode = () => {
    setOriginalAccounts([...accounts]);
    enterEditMode();
  };

  const handleCancelEdit = () => {
    setOriginalAccounts([]);
    cancelEdit();
  };

  const handleSave = () => {
    if (!editRows || editRows.length === 0) {
      showInfo("No changes to save");
      return;
    }

    let addedAccounts = 0;
    let modifiedAccounts = 0;
    let createdPortfolios = [];
    let removedAccountDetails = [];

    const editRowIds = new Set(editRows.map((acc) => acc.id));
    const removedAccounts = originalAccounts.filter(
      (acc) => !editRowIds.has(acc.id)
    );

    removedAccounts.forEach((removedAccount) => {
      const details = {
        name: removedAccount.name,
        category: removedAccount.category,
        impacts: [],
      };

      if (
        removedAccount.category === "Investments" &&
        removedAccount.portfolioName
      ) {
        details.impacts.push(
          `removed from ${removedAccount.portfolioName} portfolio`
        );
      }

      if (
        removedAccount.category === "Debt" &&
        removedAccount.monthlyPayment > 0
      ) {
        details.impacts.push(
          `$${removedAccount.monthlyPayment}/month debt payment removed from budget`
        );
      }

      const linkedGoals = (data.goals || []).filter(
        (goal) => goal.fundingAccountId === removedAccount.id
      );
      if (linkedGoals.length > 0) {
        const goalNames = linkedGoals.map((g) => g.name).join(", ");
        details.impacts.push(
          `unlinked from goal${linkedGoals.length > 1 ? "s" : ""}: ${goalNames}`
        );
      }

      removedAccountDetails.push(details);
    });

    const originalAccountIds = new Set(originalAccounts.map((acc) => acc.id));

    editRows.forEach((account) => {
      const isNewAccount = !originalAccountIds.has(account.id);

      if (isNewAccount) {
        addedAccounts++;
      } else {
        const originalAccount = originalAccounts.find(
          (orig) => orig.id === account.id
        );
        if (originalAccount) {
          const fieldsToCompare = [
            "name",
            "accountProvider",
            "category",
            "subType",
            "taxStatus",
            "value",
            "interestRate",
            "monthlyPayment",
            "portfolioId",
            "portfolioName",
          ];

          const hasChanges = fieldsToCompare.some((field) => {
            const oldValue = originalAccount[field];
            const newValue = account[field];

            if (
              field === "value" ||
              field === "interestRate" ||
              field === "monthlyPayment"
            ) {
              return parseFloat(oldValue || 0) !== parseFloat(newValue || 0);
            }

            return oldValue !== newValue;
          });

          if (hasChanges) {
            modifiedAccounts++;
          }
        }
      }
    });

    const updatedPortfolios = [...portfolios];
    const processedAccounts = editRows.map((account) => {
      if (account._needsNewPortfolio) {
        const newPortfolio = {
          id: account.portfolioId,
          name: account.portfolioName,
        };

        const alreadyExists = updatedPortfolios.find(
          (p) => p.id === newPortfolio.id
        );
        if (!alreadyExists) {
          updatedPortfolios.push(newPortfolio);
          createdPortfolios.push(newPortfolio.name);
        }

        const cleanAccount = { ...account };
        delete cleanAccount._needsNewPortfolio;
        return cleanAccount;
      }

      if (
        account.category === "Investments" &&
        account.portfolioName &&
        !account.portfolioId
      ) {
        const existingPortfolio = updatedPortfolios.find(
          (p) => p.name.toLowerCase() === account.portfolioName.toLowerCase()
        );

        if (existingPortfolio) {
          return {
            ...account,
            portfolioId: existingPortfolio.id,
            portfolioName: existingPortfolio.name,
          };
        } else {
          const newPortfolio = {
            id: generatePortfolioId(account.portfolioName),
            name: account.portfolioName.trim(),
          };
          updatedPortfolios.push(newPortfolio);
          createdPortfolios.push(newPortfolio.name);

          return {
            ...account,
            portfolioId: newPortfolio.id,
            portfolioName: newPortfolio.name,
          };
        }
      }

      if (account.category === "Investments" && account.portfolioId) {
        const portfolio = updatedPortfolios.find(
          (p) => p.id === account.portfolioId
        );
        return {
          ...account,
          portfolioName:
            portfolio?.name || account.portfolioName || "Unknown Portfolio",
        };
      }

      return account;
    });

    const removedPortfolios = [];
    const finalPortfolios = updatedPortfolios.filter((portfolio) => {
      const hasAccounts = processedAccounts.some(
        (account) => account.portfolioId === portfolio.id
      );

      if (!hasAccounts) {
        if (!createdPortfolios.includes(portfolio.name)) {
          removedPortfolios.push(portfolio.name);
        }
        console.log(`Removing empty portfolio: ${portfolio.name}`);
        return false;
      }
      return true;
    });

    const accountChanges = detectAccountDebtChanges(
      originalAccounts,
      processedAccounts
    );

    const updatedGoals = (data.goals || []).map((goal) => {
      const removedAccountIds = removedAccounts.map((acc) => acc.id);
      if (removedAccountIds.includes(goal.fundingAccountId)) {
        return {
          ...goal,
          fundingAccountId: null,
          linkedAccountAmount: 0,
          useEntireAccount: false,
        };
      }
      return goal;
    });

    const finalData = {
      ...data,
      accounts: processedAccounts,
      portfolios: finalPortfolios,
      goals: updatedGoals,
    };

    saveData(finalData);
    exitEditMode();

    let successMessage = "Accounts saved successfully!";
    let notifications = [];

    if (addedAccounts > 0) {
      notifications.push(
        `• Added ${addedAccounts} new account${addedAccounts > 1 ? "s" : ""}`
      );
    }
    if (modifiedAccounts > 0) {
      notifications.push(
        `• Modified ${modifiedAccounts} existing account${
          modifiedAccounts > 1 ? "s" : ""
        }`
      );
    }

    if (removedAccountDetails.length > 0) {
      notifications.push(
        `• Removed ${removedAccountDetails.length} account${
          removedAccountDetails.length > 1 ? "s" : ""
        }:`
      );
      removedAccountDetails.forEach((details) => {
        let removalText = `  - ${details.name}`;
        if (details.impacts.length > 0) {
          removalText += ` (${details.impacts.join(", ")})`;
        }
        notifications.push(removalText);
      });
    }

    if (createdPortfolios.length > 0) {
      notifications.push(
        `• Created ${createdPortfolios.length} new portfolio${
          createdPortfolios.length > 1 ? "s" : ""
        }: ${createdPortfolios.join(", ")}`
      );
    }
    if (removedPortfolios.length > 0) {
      notifications.push(
        `• Removed ${removedPortfolios.length} empty portfolio${
          removedPortfolios.length > 1 ? "s" : ""
        }: ${removedPortfolios.join(", ")}`
      );
    }

    const impactedApps = [];
    if (accountChanges.length > 0) {
      impactedApps.push("Budget (debt payments synced)");
    }
    if (createdPortfolios.length > 0 || addedAccounts > 0) {
      impactedApps.push("Goals (new accounts available for linking)");
    }
    if (
      removedAccountDetails.some((d) =>
        d.impacts.some((i) => i.includes("goal"))
      )
    ) {
      impactedApps.push("Goals (accounts unlinked)");
    }

    if (notifications.length > 0) {
      successMessage += "\n\n" + notifications.join("\n");
    }

    if (impactedApps.length > 0) {
      successMessage += `\n\nImpacted apps: ${impactedApps.join(", ")}`;
    }

    if (accountChanges.length > 0) {
      const changesSummary = accountChanges
        .map(
          (change) =>
            `${change.accountName}: $${change.oldAmount} → $${change.newAmount}`
        )
        .join("\n");

      successMessage += `\n\nDebt payment updates:\n${changesSummary}`;
    }

    showSuccess(successMessage);
    setOriginalAccounts([]);
  };

  const handleResetToDemo = () => {
    resetAccountsToDemo();
    exitEditMode();
    setOriginalAccounts([]);
    showWarning(
      `Reset to demo data!\n` +
        `• ${DEMO_ACCOUNTS.length} accounts restored\n` +
        `• ${DEMO_PORTFOLIOS.length} portfolios restored\n` +
        `All custom data has been replaced with demo data.`
    );
  };

  const handleClearAll = () => {
    const clearedAccounts = accounts.length;
    const clearedPortfolios = portfolios.length;
    clearAccountsData();
    exitEditMode();
    setOriginalAccounts([]);
    showWarning(
      `Cleared all account data!\n` +
        `• ${clearedAccounts} accounts removed\n` +
        `• ${clearedPortfolios} portfolios removed\n` +
        `All account and portfolio data has been cleared.`
    );
  };

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

  const totalCash = accounts
    .filter((acc) => acc.category === "Cash")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalInvestments = accounts
    .filter((acc) => acc.category === "Investments")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalDebt = accounts
    .filter((acc) => acc.category === "Debt")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

  const netWorth = totalCash + totalInvestments + totalDebt;

  const snapshotItems = [
    {
      label: "Net Worth",
      value: `$${netWorth.toLocaleString()}`,
      valueClass: netWorth >= 0 ? "positive" : "negative",
    },
    {
      label: "Cash",
      value: `$${totalCash.toLocaleString()}`,
      valueClass: "positive",
    },
    {
      label: "Investments",
      value: `$${totalInvestments.toLocaleString()}`,
      valueClass: "positive",
    },
    {
      label: "Debt",
      value: `$${Math.abs(totalDebt).toLocaleString()}`,
      valueClass: totalDebt < 0 ? "negative" : "neutral",
    },
  ];

  const handleAddAccount = () => {
    if (!newAccount.name.trim() || !newAccount.accountProvider.trim()) {
      showInfo("Please fill in account name and provider");
      return;
    }

    let accountToAdd = { ...newAccount };

    if (
      newAccount.category === "Investments" &&
      newAccount.portfolioName &&
      !newAccount.portfolioId
    ) {
      const existingPortfolio = portfolios.find(
        (p) => p.name.toLowerCase() === newAccount.portfolioName.toLowerCase()
      );

      if (existingPortfolio) {
        accountToAdd.portfolioId = existingPortfolio.id;
        accountToAdd.portfolioName = existingPortfolio.name;
      } else {
        accountToAdd.portfolioId = generatePortfolioId(
          newAccount.portfolioName
        );
        accountToAdd.portfolioName = newAccount.portfolioName.trim();
        accountToAdd._needsNewPortfolio = true;
      }
    }

    accountToAdd.id = `acc-${Date.now()}`;
    accountToAdd.value = parseFloat(accountToAdd.value) || 0;
    accountToAdd.interestRate = parseFloat(accountToAdd.interestRate) || 0;
    accountToAdd.monthlyPayment = parseFloat(accountToAdd.monthlyPayment) || 0;

    addEditRow(accountToAdd);
    setNewAccount({ ...EMPTY_ACCOUNT });

    if (newAccountNameRef.current) {
      newAccountNameRef.current.focus();
    }
  };

  const handleRemoveAccount = (accountId) => {
    if (window.confirm("Are you sure you want to remove this account?")) {
      removeEditRow(accountId);
    }
  };

  const renderAccountRow = (account, index) => {
    if (editMode) {
      return (
        <tr key={account.id || index}>
          <td>
            <input
              type="text"
              value={editRows[index]?.name || ""}
              onChange={(e) => updateEditRow(index, "name", e.target.value)}
              className={tableStyles.tableInput}
              placeholder="Account name"
            />
          </td>
          <td>
            <input
              type="text"
              value={editRows[index]?.accountProvider || ""}
              onChange={(e) =>
                updateEditRow(index, "accountProvider", e.target.value)
              }
              className={tableStyles.tableInput}
              placeholder="Provider"
            />
          </td>
          <td>
            <select
              value={editRows[index]?.category || ""}
              onChange={(e) => {
                updateEditRow(index, "category", e.target.value);
                updateEditRow(index, "subType", "");
                if (e.target.value !== "Investments") {
                  updateEditRow(index, "portfolioId", null);
                  updateEditRow(index, "portfolioName", "");
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
              value={editRows[index]?.subType || ""}
              onChange={(e) => updateEditRow(index, "subType", e.target.value)}
              className={tableStyles.tableSelect}
            >
              <option value="">Select Type</option>
              {(ACCOUNT_SUBTYPES[editRows[index]?.category] || []).map(
                (type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )
              )}
            </select>
          </td>
          <td>
            <select
              value={editRows[index]?.taxStatus || ""}
              onChange={(e) =>
                updateEditRow(index, "taxStatus", e.target.value)
              }
              className={tableStyles.tableSelect}
            >
              {TAX_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </td>
          <td>
            {editRows[index]?.category === "Investments" ? (
              <input
                type="text"
                value={editRows[index]?.portfolioName || ""}
                onChange={(e) =>
                  updateEditRow(index, "portfolioName", e.target.value)
                }
                className={tableStyles.tableInput}
                placeholder="Portfolio name"
              />
            ) : (
              <span className={tableStyles.mutedText}>N/A</span>
            )}
          </td>
          <td>
            {editRows[index]?.category === "Debt" ? (
              <input
                type="number"
                value={editRows[index]?.monthlyPayment || ""}
                onChange={(e) =>
                  updateEditRow(
                    index,
                    "monthlyPayment",
                    parseFloat(e.target.value) || 0
                  )
                }
                className={tableStyles.tableInput}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            ) : (
              <span className={tableStyles.mutedText}>N/A</span>
            )}
          </td>
          <td>
            {editRows[index]?.category === "Debt" ||
            editRows[index]?.category === "Cash" ? (
              <input
                type="number"
                value={editRows[index]?.interestRate || ""}
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
              />
            ) : (
              <span className={tableStyles.mutedText}>N/A</span>
            )}
          </td>
          <td className={tableStyles.alignRight}>
            {editRows[index]?.category === "Investments" ? (
              <span
                className={tableStyles.calculatedField}
                title="Investment account balance is calculated from cash and securities"
              >
                $
                {(
                  (editRows[index]?.cashBalance || 0) +
                  (editRows[index]?.securities || []).reduce(
                    (sum, sec) => sum + (sec.value || 0),
                    0
                  )
                ).toLocaleString()}
              </span>
            ) : (
              <input
                type="number"
                value={editRows[index]?.value || ""}
                onChange={(e) =>
                  updateEditRow(index, "value", parseFloat(e.target.value) || 0)
                }
                className={tableStyles.tableInput}
                placeholder="0.00"
                step="0.01"
              />
            )}
          </td>
          <td className={tableStyles.alignCenter}>
            <button
              onClick={() => handleRemoveAccount(index)}
              className={`${tableStyles.actionButton} ${tableStyles.removeButton}`}
              title="Remove account"
              aria-label={`Remove ${account.name}`}
            >
              <X className={tableStyles.buttonIcon} />
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr
        key={account.id || index}
        onClick={() => onAccountClick(account.id)}
        style={{ cursor: "pointer" }}
      >
        <td>{account.name}</td>
        <td>{account.accountProvider}</td>
        <td>{account.category}</td>
        <td>{account.subType}</td>
        <td>{account.taxStatus}</td>
        <td className={tableStyles.mutedText}>
          {account.category === "Investments"
            ? account.portfolioName || "None"
            : "N/A"}
        </td>
        <td className={tableStyles.alignRight}>
          {account.category === "Debt" && account.monthlyPayment ? (
            `$${account.monthlyPayment.toLocaleString()}`
          ) : account.category === "Debt" ? (
            "$0"
          ) : (
            <span className={tableStyles.mutedText}>N/A</span>
          )}
        </td>
        <td className={tableStyles.alignRight}>
          {(account.category === "Debt" ||
            (account.category === "Cash" &&
              ["Savings", "Money Market", "CD"].includes(account.subType))) &&
          account.interestRate ? (
            `${account.interestRate}%`
          ) : (
            <span className={tableStyles.mutedText}>N/A</span>
          )}
        </td>
        <td className={tableStyles.alignRight}>
          <span
            className={
              account.value >= 0 ? tableStyles.positive : tableStyles.negative
            }
          >
            {account.value >= 0 ? "$" : "($"}
            {Math.abs(account.value).toLocaleString()}
            {account.value < 0 ? ")" : ""}
          </span>
        </td>
      </tr>
    );
  };

  const newAccountRow = editMode ? (
    <tr
      style={{
        background: "var(--surface-dark)",
        borderTop: "2px solid var(--border-light)",
      }}
    >
      <td>
        <input
          ref={newAccountNameRef}
          type="text"
          value={newAccount.name}
          onChange={(e) =>
            setNewAccount((prev) => ({ ...prev, name: e.target.value }))
          }
          className={tableStyles.tableInput}
          placeholder="Account name"
        />
      </td>
      <td>
        <input
          type="text"
          value={newAccount.accountProvider}
          onChange={(e) =>
            setNewAccount((prev) => ({
              ...prev,
              accountProvider: e.target.value,
            }))
          }
          className={tableStyles.tableInput}
          placeholder="Provider"
        />
      </td>
      <td>
        <select
          value={newAccount.category}
          onChange={(e) => {
            setNewAccount((prev) => ({
              ...prev,
              category: e.target.value,
              subType: "",
              portfolioId: e.target.value === "Investments" ? null : null,
              portfolioName: e.target.value === "Investments" ? "" : "",
              value: e.target.value === "Investments" ? 0 : "",
            }));
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
          value={newAccount.subType}
          onChange={(e) =>
            setNewAccount((prev) => ({ ...prev, subType: e.target.value }))
          }
          className={tableStyles.tableSelect}
        >
          <option value="">Select Type</option>
          {(ACCOUNT_SUBTYPES[newAccount.category] || []).map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          value={newAccount.taxStatus}
          onChange={(e) =>
            setNewAccount((prev) => ({ ...prev, taxStatus: e.target.value }))
          }
          className={tableStyles.tableSelect}
        >
          {TAX_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        {newAccount.category === "Investments" ? (
          <input
            type="text"
            value={newAccount.portfolioName}
            onChange={(e) =>
              setNewAccount((prev) => ({
                ...prev,
                portfolioName: e.target.value,
              }))
            }
            className={tableStyles.tableInput}
            placeholder="Portfolio name"
          />
        ) : (
          <span className={tableStyles.mutedText}>N/A</span>
        )}
      </td>
      <td>
        {newAccount.category === "Debt" ? (
          <input
            type="number"
            value={newAccount.monthlyPayment}
            onChange={(e) =>
              setNewAccount((prev) => ({
                ...prev,
                monthlyPayment: e.target.value,
              }))
            }
            className={tableStyles.tableInput}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        ) : (
          <span className={tableStyles.mutedText}>N/A</span>
        )}
      </td>
      <td>
        {newAccount.category === "Debt" || newAccount.category === "Cash" ? (
          <input
            type="number"
            value={newAccount.interestRate}
            onChange={(e) =>
              setNewAccount((prev) => ({
                ...prev,
                interestRate: e.target.value,
              }))
            }
            className={tableStyles.tableInput}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        ) : (
          <span className={tableStyles.mutedText}>N/A</span>
        )}
      </td>
      <td className={tableStyles.alignRight}>
        {newAccount.category === "Investments" ? (
          <span
            className={tableStyles.calculatedField}
            title="Investment account balance is calculated from cash and securities"
          >
            $0.00
          </span>
        ) : (
          <input
            type="number"
            value={newAccount.value}
            onChange={(e) =>
              setNewAccount((prev) => ({ ...prev, value: e.target.value }))
            }
            className={tableStyles.tableInput}
            placeholder="0.00"
            step="0.01"
          />
        )}
      </td>
      <td className={tableStyles.alignCenter}>
        <button
          onClick={handleAddAccount}
          disabled={
            !newAccount.name ||
            !newAccount.accountProvider ||
            (newAccount.category !== "Investments" &&
              (!newAccount.value || newAccount.value === ""))
          }
          className={`${tableStyles.actionButton} ${tableStyles.addButton}`}
          title="Add account"
          aria-label="Add new account"
        >
          <Plus className={tableStyles.buttonIcon} />
        </button>
      </td>
    </tr>
  ) : null;

  const columns = editMode ? editColumns : viewColumns;

  return (
    <div className={accountsStyles.accountsContentWrapper}>
      <SnapshotRow items={snapshotItems} small={smallApp} />

      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Accounts Overview"
              editMode={editMode}
              onEnterEdit={handleEnterEditMode}
              onCancelEdit={handleCancelEdit}
              editable={true}
            />
            {categorySelectMenu}
          </div>
        }
      >
        <Table
          columns={columns}
          data={displayAccounts}
          renderRow={renderAccountRow}
          extraRow={<>{newAccountRow}</>}
          smallApp={smallApp}
          editMode={editMode}
          disableSortingInEditMode={true}
          className={tableStyles.accountsTable}
        />

        {editMode && (
          <div className={sectionStyles.editActions}>
            <Button onClick={handleSave} variant="primary" size="small">
              Save
            </Button>
            <Button onClick={handleResetToDemo} variant="warning" size="small">
              Reset to Demo
            </Button>
            <Button onClick={handleClearAll} variant="danger" size="small">
              Clear
            </Button>
          </div>
        )}

        {displayAccounts.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-md)",
              color: "var(--text-secondary)",
            }}
          >
            No accounts found. Click the pencil icon to add accounts.
          </div>
        )}
      </Section>

      {activeNotification && (
        <AccountGoalUpdateModal
          notification={activeNotification}
          isOpen={!!activeNotification}
          onClose={() => setActiveNotification(null)}
          onConfirm={(updateAmount, updateType) => {
            applyGoalUpdateFromNotification(
              activeNotification.id,
              updateAmount,
              updateType
            );
            setActiveNotification(null);
          }}
          onOpenPlanApp={() => {
            console.log("Open plan app requested");
          }}
        />
      )}
    </div>
  );
};

export default OverviewTab;
