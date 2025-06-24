// src/features/Dashboard/Apps/Accounts/Overview/OverviewTab.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import Table from "../../../../../components/ui/Table/Table";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";

import TwoColumnLayout from "../../../../../components/ui/Section/TwoColumnLayout";
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
import { DEMO_ACCOUNTS, DEMO_PORTFOLIOS, BASE_CASH_ACCOUNT } from "../../../../../utils/constants";

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

// Add this helper function near the top with other utility functions

const findMatchingPortfolio = (inputValue, portfolios) => {
  if (!inputValue) return null;

  // Find exact match first (case insensitive)
  const exactMatch = portfolios.find(
    (p) => p.name.toLowerCase() === inputValue.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Find partial match
  const partialMatch = portfolios.find(
    (p) =>
      p.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      inputValue.toLowerCase().includes(p.name.toLowerCase())
  );
  return partialMatch;
};

const generatePortfolioId = (name) => {
  // Generate a simple ID based on the name
  return `portfolio-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
};

// Update the column definitions to match the new order

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

const OverviewTab = ({ smallApp }) => {
  // SAFETY CHECK: Add early return if financial data context is not ready
  const financialDataResult = useFinancialData();

  if (!financialDataResult) {
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

  const {
    data,
    saveData,
    clearAccountsData,
    resetAccountsToDemo,
    accountChangeNotifications,
    applyGoalUpdateFromNotification,
    dismissAccountChangeNotification,
    clearAllAccountChangeNotifications,
  } = financialDataResult;

  // SAFETY CHECK: Ensure data exists
  if (!data) {
    return (
      <div
        style={{
          padding: "var(--space-md)",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Initializing accounts...
      </div>
    );
  }

  const { showSuccess, showInfo, showWarning } = useToast(); // FIXED: Added showWarning

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
    removeEditRow, // FIXED: Now properly imported
  } = useEditableTable(accounts);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newAccount, setNewAccount] = useState({ ...EMPTY_ACCOUNT });
  const newAccountNameRef = useRef(null);
  const [originalAccounts, setOriginalAccounts] = useState([]);

  // Auto-open notification modal when new notifications arrive
  useEffect(() => {
    if (
      accountChangeNotifications &&
      accountChangeNotifications.length > 0 &&
      !activeNotification
    ) {
      setActiveNotification(accountChangeNotifications[0]);
    }
  }, [accountChangeNotifications, activeNotification]);

  // Update enterEditMode to track original accounts
  const handleEnterEditMode = () => {
    setOriginalAccounts([...accounts]);
    enterEditMode();
  };

  // Update cancelEdit to clear tracking
  const handleCancelEdit = () => {
    setOriginalAccounts([]);
    cancelEdit();
  };

  // Update the handleSave function to provide detailed removal notifications

  const handleSave = () => {
    if (!editRows || editRows.length === 0) {
      showInfo("No changes to save");
      return;
    }

    // FIXED: Track detailed changes for better notifications
    let addedAccounts = 0;
    let modifiedAccounts = 0;
    let createdPortfolios = [];
    let removedAccountDetails = []; // Track detailed removal info

    // FIXED: Analyze removed accounts for detailed notifications
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

      // Check portfolio impact
      if (
        removedAccount.category === "Investments" &&
        removedAccount.portfolioName
      ) {
        details.impacts.push(
          `removed from ${removedAccount.portfolioName} portfolio`
        );
      }

      // Check debt payment impact
      if (
        removedAccount.category === "Debt" &&
        removedAccount.monthlyPayment > 0
      ) {
        details.impacts.push(
          `$${removedAccount.monthlyPayment}/month debt payment removed from budget`
        );
      }

      // Check goal impact
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

    // Count new vs modified accounts by comparing IDs, not array positions
    const originalAccountIds = new Set(originalAccounts.map((acc) => acc.id));

    editRows.forEach((account) => {
      const isNewAccount = !originalAccountIds.has(account.id);

      if (isNewAccount) {
        addedAccounts++;
      } else {
        // Check if the account was actually modified
        const originalAccount = originalAccounts.find(
          (orig) => orig.id === account.id
        );
        if (originalAccount) {
          // Compare relevant fields to see if anything changed
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

            // Handle numeric comparisons
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

    // Process portfolios - create new ones if needed during save
    const updatedPortfolios = [...portfolios];
    const processedAccounts = editRows.map((account) => {
      // Handle accounts that need new portfolios created
      if (account._needsNewPortfolio) {
        // Create new portfolio
        const newPortfolio = {
          id: account.portfolioId, // Use the pre-generated ID
          name: account.portfolioName,
        };

        // Check if portfolio was already added (in case of duplicates)
        const alreadyExists = updatedPortfolios.find(
          (p) => p.id === newPortfolio.id
        );
        if (!alreadyExists) {
          updatedPortfolios.push(newPortfolio);
          createdPortfolios.push(newPortfolio.name);
        }

        // Clean up the flag
        const cleanAccount = { ...account };
        delete cleanAccount._needsNewPortfolio;
        return cleanAccount;
      }

      if (
        account.category === "Investments" &&
        account.portfolioName &&
        !account.portfolioId
      ) {
        // Check if this portfolio name already exists
        const existingPortfolio = updatedPortfolios.find(
          (p) => p.name.toLowerCase() === account.portfolioName.toLowerCase()
        );

        if (existingPortfolio) {
          // Use existing portfolio
          return {
            ...account,
            portfolioId: existingPortfolio.id,
            portfolioName: existingPortfolio.name, // Use the exact case from existing
          };
        } else {
          // Create new portfolio
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

      // For Investment accounts, ensure portfolioName is set correctly
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

    // FIXED: Clean up empty portfolios and track which ones were removed
    const removedPortfolios = [];
    const finalPortfolios = updatedPortfolios.filter((portfolio) => {
      const hasAccounts = processedAccounts.some(
        (account) => account.portfolioId === portfolio.id
      );

      if (!hasAccounts) {
        // Only track as removed if it's not a newly created empty portfolio
        if (!createdPortfolios.includes(portfolio.name)) {
          removedPortfolios.push(portfolio.name);
        }
        console.log(`Removing empty portfolio: ${portfolio.name}`);
        return false;
      }
      return true;
    });

    // Check for account changes that might affect debt payments
    const accountChanges = detectAccountDebtChanges(
      originalAccounts,
      processedAccounts
    );

    // FIXED: Update goals to unlink removed accounts
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

    // Update the data with processed accounts and cleaned portfolios
    const finalData = {
      ...data,
      accounts: processedAccounts,
      portfolios: finalPortfolios,
      goals: updatedGoals,
    };

    // FIXED: Only save data once at the end
    saveData(finalData);
    exitEditMode();

    // ENHANCED: Build comprehensive success message with detailed removal info
    let successMessage = "Accounts saved successfully!";
    let notifications = [];

    // Account changes summary
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

    // FIXED: Detailed removal notifications
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

    // Portfolio changes
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

    // App impacts
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

    // Build final message
    if (notifications.length > 0) {
      successMessage += "\n\n" + notifications.join("\n");
    }

    if (impactedApps.length > 0) {
      successMessage += `\n\nImpacted apps: ${impactedApps.join(", ")}`;
    }

    // Debt payment changes detail
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

  // Update the handleResetToDemo function to include portfolio restoration

  const handleResetToDemo = () => {
    const updatedData = {
      ...data,
      accounts: DEMO_ACCOUNTS,
      portfolios: DEMO_PORTFOLIOS,
    };

    saveData(updatedData);
    exitEditMode();
    setOriginalAccounts([]);

    // Show success message with portfolio details
    const portfolioCount = DEMO_PORTFOLIOS.length;
    const accountCount = DEMO_ACCOUNTS.length;

    showWarning(
      `Reset to demo data!\n` +
        `• ${accountCount} accounts restored\n` +
        `• ${portfolioCount} portfolios restored\n` +
        `All custom data has been replaced with demo data.`
    );
  };

  // Handle clear all accounts
  const handleClearAll = () => {
    // Clear all accounts and unused portfolios
    const updatedData = {
      ...data,
      accounts: [],
      portfolios: [], // Clear all portfolios when clearing all accounts
    };

    saveData(updatedData);
    exitEditMode();
    setOriginalAccounts([]);

    const clearedAccounts = accounts.length;
    const clearedPortfolios = portfolios.length;

    showWarning(
      `Cleared all account data!\n` +
        `• ${clearedAccounts} accounts removed\n` +
        `• ${clearedPortfolios} portfolios removed\n` +
        `All account and portfolio data has been cleared.`
    );
  };

  // Update filtering for display - by category instead of portfolio
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

  const netWorth = totalCash + totalInvestments + totalDebt; // debt is negative

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

  const handleNewAccountChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: value }));
  };

  // Update the handleAddAccount function to remove the immediate notification

  const handleAddAccount = () => {
    if (!newAccount.name.trim() || !newAccount.accountProvider.trim()) {
      showInfo("Please fill in account name and provider");
      return;
    }

    // FIXED: Process new account for portfolio creation but don't save yet
    let accountToAdd = { ...newAccount };

    // Handle portfolio processing for investments (but don't save portfolios yet)
    if (
      newAccount.category === "Investments" &&
      newAccount.portfolioName &&
      !newAccount.portfolioId
    ) {
      // Check if portfolio exists
      const existingPortfolio = portfolios.find(
        (p) => p.name.toLowerCase() === newAccount.portfolioName.toLowerCase()
      );

      if (existingPortfolio) {
        accountToAdd.portfolioId = existingPortfolio.id;
        accountToAdd.portfolioName = existingPortfolio.name;
      } else {
        // Mark that a new portfolio needs to be created when saving
        accountToAdd.portfolioId = generatePortfolioId(
          newAccount.portfolioName
        );
        accountToAdd.portfolioName = newAccount.portfolioName.trim();
        accountToAdd._needsNewPortfolio = true; // Flag for later processing
      }
    }

    // Generate new account ID
    accountToAdd.id = `acc-${Date.now()}`;

    // Convert string values to numbers where appropriate
    accountToAdd.value = parseFloat(accountToAdd.value) || 0;
    accountToAdd.interestRate = parseFloat(accountToAdd.interestRate) || 0;
    accountToAdd.monthlyPayment = parseFloat(accountToAdd.monthlyPayment) || 0;

    // FIXED: Only add to edit rows, don't save data yet
    addEditRow(accountToAdd);

    // Reset new account form
    setNewAccount({ ...EMPTY_ACCOUNT });

    // Focus on name field for next entry
    if (newAccountNameRef.current) {
      newAccountNameRef.current.focus();
    }
  };

  // Update the renderAccountRow function to handle investment account balance

  const renderAccountRow = (account, index) => {
    const isBaseCashAccount = account.id === BASE_CASH_ACCOUNT.id;
    
    if (editMode) {
      return (
        <tr key={account.id || index}>
          {/* Account Name */}
          <td>
            {isBaseCashAccount ? (
              <span className={tableStyles.mutedText}>
                {account.name} (Base Account)
              </span>
            ) : (
              <input
                type="text"
                value={editRows[index]?.name || ""}
                onChange={(e) => updateEditRow(index, "name", e.target.value)}
                className={tableStyles.tableInput}
                placeholder="Account name"
              />
            )}
          </td>
          {/* Provider */}
          <td>
            {isBaseCashAccount ? (
              <span className={tableStyles.mutedText}>{account.accountProvider}</span>
            ) : (
              <input
                type="text"
                value={editRows[index]?.accountProvider || ""}
                onChange={(e) =>
                  updateEditRow(index, "accountProvider", e.target.value)
                }
                className={tableStyles.tableInput}
                placeholder="Provider"
              />
            )}
          </td>
          {/* Category */}
          <td>
            {isBaseCashAccount ? (
              <span className={tableStyles.mutedText}>{account.category}</span>
            ) : (
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
            )}
          </td>
          {/* Sub Type */}
          <td>
            {isBaseCashAccount ? (
              <span className={tableStyles.mutedText}>{account.subType}</span>
            ) : (
              <select
                value={editRows[index]?.subType || ""}
                onChange={(e) => updateEditRow(index, "subType", e.target.value)}
                className={tableStyles.tableSelect}
              >
                <option value="">Select Type</option>
                {(ACCOUNT_SUBTYPES[editRows[index]?.category] || []).map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}
          </td>
          {/* Tax Status */}
          <td>
            {isBaseCashAccount ? (
              <span className={tableStyles.mutedText}>{account.taxStatus}</span>
            ) : (
              <select
                value={editRows[index]?.taxStatus || ""}
                onChange={(e) => updateEditRow(index, "taxStatus", e.target.value)}
                className={tableStyles.tableSelect}
              >
                {TAX_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            )}
          </td>
          {/* Portfolio */}
          <td>
            {editRows[index]?.category === "Investments" && !isBaseCashAccount ? (
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
          {/* Monthly Payment */}
          <td>
            {editRows[index]?.category === "Debt" && !isBaseCashAccount ? (
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
          {/* Interest Rate */}
          <td>
            {(editRows[index]?.category === "Debt" || editRows[index]?.category === "Cash") && !isBaseCashAccount ? (
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
          {/* Balance */}
          <td className={tableStyles.alignRight}>
            {editRows[index]?.category === "Investments" ? (
              <span 
                className={tableStyles.calculatedField}
                title="Investment account balance is calculated from cash and securities"
              >
                ${(
                  (editRows[index]?.cashBalance || 0) + 
                  ((editRows[index]?.securities || []).reduce((sum, sec) => sum + (sec.value || 0), 0))
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
          {/* Actions */}
          <td className={tableStyles.alignCenter}>
            {isBaseCashAccount ? (
              <span 
                className={tableStyles.mutedText} 
                title="Base cash account cannot be removed"
              >
                Protected
              </span>
            ) : (
              <button
                onClick={() => handleRemoveAccount(index)}
                className={`${tableStyles.actionButton} ${tableStyles.removeButton}`}
                title="Remove account"
                aria-label={`Remove ${account.name}`}
              >
                <X className={tableStyles.buttonIcon} />
              </button>
            )}
          </td>
        </tr>
      );
    }

    // View mode - show calculated balance for investments
    return (
      <tr key={account.id || index}>
        {/* Account Name */}
        <td>{account.name}</td>
        {/* Provider */}
        <td>{account.accountProvider}</td>
        {/* Category */}
        <td>{account.category}</td>
        {/* Type */}
        <td>{account.subType}</td>
        {/* Tax Status */}
        <td>{account.taxStatus}</td>
        {/* Portfolio */}
        <td className={tableStyles.mutedText}>
          {account.category === "Investments"
            ? account.portfolioName || "None"
            : "N/A"}
        </td>
        {/* Monthly Payment - FIXED: Only show for debt accounts */}
        <td className={tableStyles.alignRight}>
          {account.category === "Debt" && account.monthlyPayment ? (
            `$${account.monthlyPayment.toLocaleString()}`
          ) : account.category === "Debt" ? (
            "$0"
          ) : (
            <span className={tableStyles.mutedText}>N/A</span>
          )}
        </td>
        {/* Interest Rate - FIXED: Only show for applicable account types */}
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
        {/* Balance */}
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

  // FIXED: Update new account row to also follow the same conditional logic
  const newAccountRow = editMode ? (
    <tr
      style={{
        background: "var(--surface-dark)",
        borderTop: "2px solid var(--border-light)",
      }}
    >
      {/* Account Name */}
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
      {/* Provider */}
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
      {/* Category */}
      <td>
        <select
          value={newAccount.category}
          onChange={(e) => {
            setNewAccount((prev) => ({
              ...prev,
              category: e.target.value,
              subType: "", // Reset subType when category changes
              portfolioId: e.target.value === "Investments" ? null : null,
              portfolioName: e.target.value === "Investments" ? "" : "",
              value: e.target.value === "Investments" ? 0 : "", // Set value to 0 for investments
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
      {/* Sub Type */}
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
      {/* Tax Status */}
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
      {/* Portfolio */}
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
      {/* Monthly Payment */}
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
      {/* Interest Rate */}
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
      {/* Balance - FIXED: Disable for Investment accounts */}
      <td className={tableStyles.alignRight}>
        {newAccount.category === "Investments" ? (
          <span
            className={tableStyles.calculatedField}
            title="Investment account balance is calculated from cash and securities"
          >
            $0.00
          </span>
        ) : (
          <button
            onClick={handleAddAccount}
            className={`${tableStyles.actionButton} ${tableStyles.addButton}`}
            title="Add account"
            aria-label="Add new account"
          >
            <Plus className={tableStyles.buttonIcon} />
          </button>
        )}
      </td>
    </tr>
  ) : null;

  // FIXED: Define columns based on edit mode
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
        {/* MOVED: Control panel now appears AFTER the table */}
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

        {/* FIXED: Control panel moved to bottom and only shows in edit mode */}
        {editMode && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-xs)",
              marginTop: "var(--space-sm)",
              justifyContent: "flex-end",
              padding: "var(--space-xs)",
              background: "var(--surface-dark)",
              borderRadius: "var(--border-radius-sm)",
              border: "1px solid var(--border-light)",
            }}
          >
            <button onClick={handleSave} className="btn-primary">
              Save Changes
            </button>
            <button onClick={handleResetToDemo} className="btn-secondary">
              Reset to Demo
            </button>
            <button onClick={handleClearAll} className="btn-danger">
              Clear All
            </button>
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

      {/* Account Change Notifications Modal */}
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
            // Handle opening plan app if needed
            console.log("Open plan app requested");
          }}
        />
      )}
    </div>
  );
};

export default OverviewTab;
