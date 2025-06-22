// src/features/Dashboard/Apps/Accounts/Overview/OverviewTab.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import Table from "../../../../../components/ui/Table/Table";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import BudgetFormInput from "../../../../../components/ui/Form/BudgetFormInput";
import BudgetFormSelect from "../../../../../components/ui/Form/BudgetFormSelect";
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
  // SAFETY CHECK: Add early return if financial data context is not ready
  const financialDataResult = useFinancialData();
  
  if (!financialDataResult) {
    return (
      <div style={{ 
        padding: "var(--space-md)", 
        textAlign: "center", 
        color: "var(--text-secondary)" 
      }}>
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
      <div style={{ 
        padding: "var(--space-md)", 
        textAlign: "center", 
        color: "var(--text-secondary)" 
      }}>
        Initializing accounts...
      </div>
    );
  }

  const { showSuccess, showInfo } = useToast();

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
  const [originalAccounts, setOriginalAccounts] = useState([]);

  // Auto-open notification modal when new notifications arrive
  useEffect(() => {
    if (accountChangeNotifications && accountChangeNotifications.length > 0 && !activeNotification) {
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

  // ENHANCED: Handle save with bidirectional debt sync
  const handleSave = () => {
    // Detect debt payment changes in accounts
    const debtChanges = detectAccountDebtChanges(originalAccounts, editRows);
    
    const updatedData = {
      ...data,
      accounts: editRows,
    };
    
    saveData(updatedData);
    exitEditMode();
    setOriginalAccounts([]);
    showSuccess("Accounts saved successfully!");
    
    // Show debt sync notification if there were changes
    if (debtChanges.length > 0) {
      const changesSummary = debtChanges.map(change => 
        `${change.accountName}: $${change.oldAmount} → $${change.newAmount}`
      ).join('\n');
      
      showInfo(`Debt payments will be updated in budget:\n${changesSummary}`);
    }
  };

  // Handle reset to demo accounts
  const handleResetToDemo = () => {
    if (window.confirm("Reset accounts to demo data? This will overwrite all current account data.")) {
      resetAccountsToDemo();
      exitEditMode();
      showSuccess("Accounts reset to demo data!");
    }
  };

  // Handle clear all accounts
  const handleClearAll = () => {
    if (window.confirm("Clear all accounts? This action cannot be undone.")) {
      clearAccountsData();
      exitEditMode();
      showSuccess("All accounts cleared!");
    }
  };

  // Update filtering for display - by category instead of portfolio
  const displayAccounts = useMemo(() => {
    const sourceAccounts = editMode ? editRows : accounts;
    
    const enrichedAccounts = sourceAccounts.map(account => ({
      ...account,
      portfolioName: account.portfolioId 
        ? portfolios.find(p => p.id === account.portfolioId)?.name || "Unknown"
        : "N/A"
    }));

    if (categoryFilter === "all") {
      return enrichedAccounts;
    }
    
    return enrichedAccounts.filter(account => account.category === categoryFilter);
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
      valueClass: "negative",
    },
  ];

  const handleNewAccountChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) {
      showInfo("Please enter an account name");
      return;
    }

    let accountValue = parseFloat(newAccount.value) || 0;
    
    // AUTOMATIC NEGATIVE CONVERSION: Make debt values negative
    if (newAccount.category === "Debt" && accountValue > 0) {
      accountValue = -accountValue;
    }

    const accountWithId = {
      ...newAccount,
      id: `acc-${Date.now()}`,
      value: accountValue,
      interestRate: newAccount.interestRate ? parseFloat(newAccount.interestRate) : null,
      monthlyPayment: newAccount.monthlyPayment ? parseFloat(newAccount.monthlyPayment) : null,
    };

    addEditRow(accountWithId);
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
    const isDebtAccount = account.category === "Debt";
    const displayValue = isDebtAccount ? Math.abs(account.value || 0) : (account.value || 0);

    return (
      <tr key={account.id || index}>
        {/* Account Name */}
        <td>
          {editMode ? (
            <BudgetFormInput
              column={{ type: "text", placeholder: "Account name" }}
              value={account.name}
              onChange={(value) => updateEditRow(index, "name", value)}
            />
          ) : (
            account.name
          )}
        </td>
        
        {/* Provider */}
        <td>
          {editMode ? (
            <BudgetFormInput
              column={{ type: "text", placeholder: "Provider" }}
              value={account.accountProvider}
              onChange={(value) => updateEditRow(index, "accountProvider", value)}
            />
          ) : (
            account.accountProvider
          )}
        </td>
        
        {/* Balance */}
        <td className={tableStyles.alignRight}>
          {editMode ? (
            <BudgetFormInput
              column={{ 
                type: "number", 
                placeholder: isDebtAccount ? "Amount owed" : "0.00", 
                step: "0.01",
                min: "0" // Always positive input for debt
              }}
              value={displayValue}
              onChange={(value) => {
                const numericValue = parseFloat(value) || 0;
                // AUTOMATIC NEGATIVE CONVERSION: Always store debt as negative
                const finalValue = isDebtAccount ? -Math.abs(numericValue) : numericValue;
                updateEditRow(index, "value", finalValue);
              }}
            />
          ) : (
            <span className={account.category === "Debt" ? tableStyles.negative : ""}>
              {isDebtAccount ? "($" : "$"}
              {displayValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {isDebtAccount ? ")" : ""}
            </span>
          )}
        </td>
        
        {/* Interest Rate */}
        <td className={tableStyles.alignRight}>
          {editMode ? (
            isDebtAccount ? (
              <BudgetFormInput
                column={{ 
                  type: "number", 
                  placeholder: "0.00", 
                  step: "0.01",
                  min: "0",
                  max: "100"
                }}
                value={account.interestRate || ""}
                onChange={(value) => updateEditRow(index, "interestRate", parseFloat(value) || null)}
              />
            ) : "N/A"
          ) : (
            account.interestRate ? `${account.interestRate}%` : "N/A"
          )}
        </td>
        
        {/* Monthly Payment */}
        <td className={tableStyles.alignRight}>
          {editMode ? (
            isDebtAccount ? (
              <BudgetFormInput
                column={{ 
                  type: "number", 
                  placeholder: "0.00", 
                  step: "0.01",
                  min: "0"
                }}
                value={account.monthlyPayment || ""}
                onChange={(value) => updateEditRow(index, "monthlyPayment", parseFloat(value) || null)}
              />
            ) : "N/A"
          ) : (
            account.monthlyPayment ? `$${account.monthlyPayment.toLocaleString()}` : "N/A"
          )}
        </td>
        
        {/* Category */}
        <td>
          {editMode ? (
            <BudgetFormSelect
              options={CATEGORIES}
              value={account.category}
              onChange={(value) => {
                updateEditRow(index, "category", value);
                // Reset subType when category changes
                updateEditRow(index, "subType", ACCOUNT_SUBTYPES[value]?.[0]?.value || "");
                // Clear debt-specific fields when switching away from debt
                if (value !== "Debt") {
                  updateEditRow(index, "interestRate", null);
                  updateEditRow(index, "monthlyPayment", null);
                }
              }}
            />
          ) : (
            account.category
          )}
        </td>
        
        {/* Type (subType) */}
        <td>
          {editMode ? (
            <BudgetFormSelect
              options={ACCOUNT_SUBTYPES[account.category] || []}
              value={account.subType}
              onChange={(value) => updateEditRow(index, "subType", value)}
              className={tableStyles.compactSelect}
            />
          ) : (
            <span className={tableStyles.wrappedText}>{account.subType}</span>
          )}
        </td>
        
        {/* Tax Status */}
        <td>
          {editMode ? (
            <BudgetFormSelect
              options={[
                { value: "Taxable", label: "Taxable" },
                { value: "Tax-deferred", label: "Tax-deferred" },
                { value: "Tax-free", label: "Tax-free" },
                { value: "N/A", label: "N/A" },
              ]}
              value={account.taxStatus}
              onChange={(value) => updateEditRow(index, "taxStatus", value)}
              className={tableStyles.compactSelect}
            />
          ) : (
            <span className={tableStyles.wrappedText}>{account.taxStatus}</span>
          )}
        </td>
        
        {/* Portfolio */}
        <td>
          {editMode ? (
            account.category === "Investments" ? (
              <BudgetFormSelect
                options={[
                  { value: "", label: "Select Portfolio" },
                  ...portfolios.map(p => ({ value: p.id, label: p.name }))
                ]}
                value={account.portfolioId || ""}
                onChange={(value) => updateEditRow(index, "portfolioId", value || null)}
                className={tableStyles.compactSelect}
              />
            ) : (
              <span className={tableStyles.mutedText}>N/A</span>
            )
          ) : (
            <span className={tableStyles.wrappedText}>
              {account.portfolioName || "N/A"}
            </span>
          )}
        </td>
        
        {/* Actions - Only show in edit mode */}
        {editMode && (
          <td className={tableStyles.alignCenter}>
            <button
              onClick={() => handleRemoveAccount(account.id)}
              className="btn-danger-sm"
              title="Remove account"
            >
              ✕
            </button>
          </td>
        )}
      </tr>
    );
  };

  // FIXED: Define columns in correct order with proper labels
  const getColumns = () => {
    const baseColumns = [
      { key: "name", label: "Account Name" },
      { key: "accountProvider", label: "Provider" },
      { key: "value", label: "Balance" },
      { key: "interestRate", label: "Interest Rate" },
      { key: "monthlyPayment", label: "Monthly Payment" },
      { key: "category", label: "Category" },
      { key: "subType", label: "Type" },
      { key: "taxStatus", label: "Tax Status" },
      { key: "portfolioId", label: "Portfolio" }
    ];

    if (editMode) {
      baseColumns.push({ key: "actions", label: "Actions" });
    }

    return baseColumns;
  };

  const columns = getColumns();

  // ENHANCED: New account row for edit mode with correct column order
  const newAccountRow = editMode && (
    <tr style={{ backgroundColor: "var(--surface-secondary)" }}>
      {/* Account Name */}
      <td>
        <BudgetFormInput
          ref={newAccountNameRef}
          column={{ type: "text", placeholder: "New account name" }}
          value={newAccount.name}
          onChange={(value) => setNewAccount(prev => ({ ...prev, name: value }))}
        />
      </td>
      
      {/* Provider */}
      <td>
        <BudgetFormInput
          column={{ type: "text", placeholder: "Provider" }}
          value={newAccount.accountProvider}
          onChange={(value) => setNewAccount(prev => ({ ...prev, accountProvider: value }))}
        />
      </td>
      
      {/* Balance */}
      <td>
        <BudgetFormInput
          column={{ 
            type: "number", 
            placeholder: newAccount.category === "Debt" ? "Amount owed" : "0.00", 
            step: "0.01",
            min: "0"
          }}
          value={newAccount.value}
          onChange={(value) => setNewAccount(prev => ({ ...prev, value }))}
        />
      </td>
      
      {/* Interest Rate */}
      <td>
        {newAccount.category === "Debt" ? (
          <BudgetFormInput
            column={{ 
              type: "number", 
              placeholder: "0.00", 
              step: "0.01",
              min: "0",
              max: "100"
            }}
            value={newAccount.interestRate}
            onChange={(value) => setNewAccount(prev => ({ ...prev, interestRate: value }))}
          />
        ) : (
          <span className={tableStyles.mutedText}>N/A</span>
        )}
      </td>
      
      {/* Monthly Payment */}
      <td>
        {newAccount.category === "Debt" ? (
          <BudgetFormInput
            column={{ 
              type: "number", 
              placeholder: "0.00", 
              step: "0.01",
              min: "0"
            }}
            value={newAccount.monthlyPayment}
            onChange={(value) => setNewAccount(prev => ({ ...prev, monthlyPayment: value }))}
          />
        ) : (
          <span className={tableStyles.mutedText}>N/A</span>
        )}
      </td>
      
      {/* Category */}
      <td>
        <BudgetFormSelect
          options={CATEGORIES}
          value={newAccount.category}
          onChange={(value) => setNewAccount(prev => ({
            ...prev,
            category: value,
            subType: ACCOUNT_SUBTYPES[value]?.[0]?.value || "",
            // Clear debt-specific fields when switching away from debt
            interestRate: value === "Debt" ? prev.interestRate : "",
            monthlyPayment: value === "Debt" ? prev.monthlyPayment : ""
          }))}
        />
      </td>
      
      {/* Type */}
      <td>
        <BudgetFormSelect
          options={ACCOUNT_SUBTYPES[newAccount.category] || []}
          value={newAccount.subType}
          onChange={(value) => setNewAccount(prev => ({ ...prev, subType: value }))}
          className={tableStyles.compactSelect}
        />
      </td>
      
      {/* Tax Status */}
      <td>
        <BudgetFormSelect
          options={[
            { value: "Taxable", label: "Taxable" },
            { value: "Tax-deferred", label: "Tax-deferred" },
            { value: "Tax-free", label: "Tax-free" },
            { value: "N/A", label: "N/A" },
          ]}
          value={newAccount.taxStatus}
          onChange={(value) => setNewAccount(prev => ({ ...prev, taxStatus: value }))}
          className={tableStyles.compactSelect}
        />
      </td>
      
      {/* Portfolio */}
      <td>
        {newAccount.category === "Investments" ? (
          <BudgetFormSelect
            options={[
              { value: "", label: "Select Portfolio" },
              ...portfolios.map(p => ({ value: p.id, label: p.name }))
            ]}
            value={newAccount.portfolioId || ""}
            onChange={(value) => setNewAccount(prev => ({ ...prev, portfolioId: value || null }))}
            className={tableStyles.compactSelect}
          />
        ) : (
          <span className={tableStyles.mutedText}>N/A</span>
        )}
      </td>
      
      {/* Actions */}
      <td className={tableStyles.alignCenter}>
        <button
          onClick={handleAddAccount}
          className="btn-primary-sm"
          title="Add account"
        >
          ＋
        </button>
      </td>
    </tr>
  );

  return (
    <div className={accountsStyles.overviewContentContainer}>
      <SnapshotRow items={snapshotItems} small={smallApp} />
      
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Accounts"
              editMode={editMode}
              onEnterEdit={handleEnterEditMode}
              onCancelEdit={handleCancelEdit}
            />
            {categorySelectMenu}
          </div>
        }
      >
        <Table
          columns={columns}
          data={displayAccounts}
          renderRow={renderAccountRow}
          extraRow={newAccountRow}
          smallApp={smallApp}
          editMode={editMode}
        />
        
        {editMode && (
          <div className={sectionStyles.editActions}>
            <button onClick={handleSave} className="btn-primary">
              Save Changes
            </button>
            <button onClick={handleClearAll} className="btn-secondary">
              Clear All
            </button>
            <button onClick={handleResetToDemo} className="btn-secondary">
              Reset to Demo
            </button>
          </div>
        )}
      </Section>

      {/* Account Goal Update Modal */}
      <AccountGoalUpdateModal
        notification={activeNotification}
        isOpen={!!activeNotification}
        onClose={() => setActiveNotification(null)}
        onConfirm={(notificationId, amount) => {
          applyGoalUpdateFromNotification(notificationId, amount);
          setActiveNotification(null);
        }}
        onOpenPlanApp={() => {
          console.log('Open Plan app');
        }}
        isPlanAppOpen={false}
      />
    </div>
  );
};

export default OverviewTab;
