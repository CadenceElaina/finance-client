import React, { useState, useRef, useMemo } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../../hooks/useEditableTable";
import { useToast } from "../../../../../hooks/useToast";
import { DEMO_ACCOUNTS, DEMO_PORTFOLIOS } from "../../../../../utils/constants";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import Table from "../../../../../components/ui/Table/Table";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import tableStyles from "../../../../../components/ui/Table/Table.module.css";
import { X, Plus } from "lucide-react";

const EMPTY_SECURITY = {
  name: "",
  ticker: "",
  quantity: "",
  value: "",
  purchasePrice: "",
  datePurchased: "",
  accountId: "",
  accountName: "",
  accountProvider: "",
  type: "security", // ADDED: Track if this is cash or security
};

const EMPTY_CASH = {
  name: "Cash",
  ticker: "CASH",
  quantity: "1",
  value: "",
  purchasePrice: "",
  datePurchased: "",
  accountId: "",
  accountName: "",
  accountProvider: "",
  type: "cash", // ADDED: Mark as cash type
};

const InvestmentsTab = ({
  portfolioId,
  smallApp,
  portfolios = [],
  setSelectedPortfolioId,
  selectedPortfolioId,
  investmentsHeaderTitle = "Investments",
  showPortfolioSelectMenu = false,
  portfolioSelectMenu,
}) => {
  const { data, saveData } = useFinancialData();
  const { showSuccess, showInfo, showWarning } = useToast();
  const allAccounts = data.accounts || [];
  const allPortfolios = data.portfolios || [];

  // FIXED: Get all securities AND cash from investment accounts
  const securities = useMemo(() => {
    let investmentAccounts = allAccounts.filter(
      (acc) => acc.category === "Investments"
    );

    // Filter by portfolio if specific portfolio is selected
    if (portfolioId && portfolioId !== "all") {
      investmentAccounts = investmentAccounts.filter(
        (acc) => acc.portfolioId === portfolioId
      );
    }

    // Extract all securities AND cash from filtered accounts
    const allSecurities = [];
    investmentAccounts.forEach((account) => {
      // Add securities
      if (account.hasSecurities && Array.isArray(account.securities)) {
        account.securities.forEach((security) => {
          allSecurities.push({
            ...security,
            id: security.id || `${account.id}-${security.ticker}`,
            accountId: account.id,
            accountName: account.name,
            accountProvider: account.accountProvider,
            portfolioName:
              account.portfolioName ||
              allPortfolios.find((p) => p.id === account.portfolioId)?.name ||
              "Unknown Portfolio",
            type: "security",
          });
        });
      }

      // FIXED: Add cash position if it exists
      if ((account.cashBalance || 0) > 0) {
        allSecurities.push({
          id: `${account.id}-cash`,
          name: "Cash",
          ticker: "CASH",
          quantity: 1, // FIXED: Added missing value
          value: account.cashBalance,
          purchasePrice: account.cashBalance,
          datePurchased: "", // Cash doesn't have purchase date
          accountId: account.id,
          accountName: account.name,
          accountProvider: account.accountProvider,
          portfolioName:
            account.portfolioName ||
            allPortfolios.find((p) => p.id === account.portfolioId)?.name ||
            "Unknown Portfolio",
          type: "cash",
        });
      }
    });

    // console.log("All securities and cash:", allSecurities);
    return allSecurities;
  }, [
    allAccounts,
    portfolioId,
    allPortfolios,
    JSON.stringify(
      allAccounts.map((acc) => ({
        id: acc.id,
        portfolioId: acc.portfolioId,
        portfolioName: acc.portfolioName,
        securitiesCount: acc.securities?.length || 0,
        cashBalance: acc.cashBalance || 0,
      }))
    ),
  ]);

  const {
    editMode,
    editRows,
    enterEditMode,
    cancelEdit,
    exitEditMode,
    updateEditRow,
    addEditRow,
    removeEditRow,
  } = useEditableTable(securities);

  const [newSecurity, setNewSecurity] = useState({ ...EMPTY_SECURITY });
  const [addingType, setAddingType] = useState("security"); // ADDED: Track what we're adding
  const newSecurityNameRef = useRef(null);

  // FIXED: Updated column order - Account, Security, Ticker, Date Purchased, Quantity, Purchase Price, Value
  const columns = [
    { key: "accountName", label: "Account" },
    { key: "name", label: "Security" },
    { key: "ticker", label: "Ticker" },
    { key: "datePurchased", label: "Date Purchased" },
    { key: "quantity", label: "Quantity" },
    { key: "purchasePrice", label: "Purchase Price" },
    { key: "value", label: "Value" },
    ...(editMode ? [{ key: "actions", label: "Actions" }] : []),
  ];

  // Helper function to format date
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

  const renderSecurityRow = (security, index) => {
    if (editMode) {
      const isCash = security.type === "cash";

      return (
        <tr key={security.id || index}>
          <td className={tableStyles.mutedText}>{security.accountName}</td>
          <td>
            {isCash ? (
              <span className={tableStyles.mutedText}>Cash</span>
            ) : (
              <input
                type="text"
                value={editRows[index]?.name || ""}
                onChange={(e) => updateEditRow(index, "name", e.target.value)}
                className={tableStyles.tableInput}
                placeholder="Security name"
              />
            )}
          </td>
          <td>
            {isCash ? (
              <span className={tableStyles.mutedText}>CASH</span>
            ) : (
              <input
                type="text"
                value={editRows[index]?.ticker || ""}
                onChange={(e) => updateEditRow(index, "ticker", e.target.value)}
                className={tableStyles.tableInput}
                placeholder="AAPL"
              />
            )}
          </td>
          <td>
            {isCash ? (
              <span className={tableStyles.mutedText}>N/A</span>
            ) : (
              <input
                type="date"
                value={editRows[index]?.datePurchased || ""}
                onChange={(e) =>
                  updateEditRow(index, "datePurchased", e.target.value)
                }
                className={tableStyles.tableInput}
              />
            )}
          </td>
          <td>
            {isCash ? (
              <span className={tableStyles.mutedText}>1</span>
            ) : (
              <input
                type="number"
                value={editRows[index]?.quantity || ""}
                onChange={(e) =>
                  updateEditRow(
                    index,
                    "quantity",
                    parseFloat(e.target.value) || 0
                  )
                }
                className={tableStyles.tableInput}
                placeholder="100"
                step="0.001"
                min="0"
              />
            )}
          </td>
          <td className={tableStyles.alignRight}>
            {isCash ? (
              <span className={tableStyles.mutedText}>N/A</span>
            ) : (
              <input
                type="number"
                value={editRows[index]?.purchasePrice || ""}
                onChange={(e) =>
                  updateEditRow(
                    index,
                    "purchasePrice",
                    parseFloat(e.target.value) || 0
                  )
                }
                className={tableStyles.tableInput}
                placeholder="150.00"
                step="0.01"
                min="0"
              />
            )}
          </td>
          <td className={tableStyles.alignRight}>
            <input
              type="number"
              value={editRows[index]?.value || ""}
              onChange={(e) =>
                updateEditRow(index, "value", parseFloat(e.target.value) || 0)
              }
              className={tableStyles.tableInput}
              placeholder={isCash ? "1000.00" : "15000.00"}
              step="0.01"
              min="0"
            />
          </td>
          <td className={tableStyles.alignCenter}>
            <button
              onClick={() => removeEditRow(index)}
              className={`${tableStyles.actionButton} ${tableStyles.removeButton}`}
              title={`Remove ${isCash ? "cash position" : "security"}`}
              aria-label={`Remove ${security.name}`}
            >
              <X className={tableStyles.buttonIcon} />
            </button>
          </td>
        </tr>
      );
    }

    // View mode - FIXED: Updated column order and handle cash display
    const isCash = security.type === "cash";

    return (
      <tr key={security.id || index}>
        <td>{security.accountName}</td>
        <td>{security.name}</td>
        <td>{security.ticker}</td>
        <td>{isCash ? "N/A" : formatDate(security.datePurchased)}</td>
        <td className={tableStyles.alignRight}>
          {isCash ? "1" : security.quantity?.toLocaleString()}
        </td>
        <td className={tableStyles.alignRight}>
          {isCash ? "N/A" : `$${security.purchasePrice?.toLocaleString()}`}
        </td>
        <td className={tableStyles.alignRight}>
          ${security.value?.toLocaleString()}
        </td>
      </tr>
    );
  };

  const handleNewSecurityChange = (e) => {
    const { name, value } = e.target;
    setNewSecurity((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSecurity = () => {
    const isCash = addingType === "cash";

    // FIXED: Check if account already has cash position when adding cash
    if (isCash) {
      const accountAlreadyHasCash = editRows.some(
        (row) => row.accountId === newSecurity.accountId && row.type === "cash"
      );

      if (accountAlreadyHasCash) {
        showInfo(
          "This account already has a cash position. You can only have one cash position per account."
        );
        return;
      }
    }

    // Validation based on type
    if (!newSecurity.accountId || !newSecurity.value) {
      showInfo("Please select an account and enter a value");
      return;
    }

    if (
      !isCash &&
      (!newSecurity.name?.trim() ||
        !newSecurity.ticker?.trim() ||
        !newSecurity.quantity)
    ) {
      showInfo("Please fill in all required fields for the security");
      return;
    }

    const securityToAdd = {
      id: `${isCash ? "cash" : "sec"}-${Date.now()}`,
      name: isCash ? "Cash" : newSecurity.name,
      ticker: isCash ? "CASH" : newSecurity.ticker,
      quantity: isCash ? 1 : parseFloat(newSecurity.quantity) || 0,
      purchasePrice: isCash
        ? parseFloat(newSecurity.value) || 0
        : parseFloat(newSecurity.purchasePrice) || 0,
      value: parseFloat(newSecurity.value) || 0,
      datePurchased: isCash ? "" : newSecurity.datePurchased,
      accountId: newSecurity.accountId,
      accountName: newSecurity.accountName,
      accountProvider: newSecurity.accountProvider,
      type: addingType,
    };

    addEditRow(securityToAdd);
    setNewSecurity({ ...EMPTY_SECURITY });

    if (newSecurityNameRef.current) {
      newSecurityNameRef.current.focus();
    }
  };

  // FIXED: Update new security row with type selection - REMOVED WHITESPACE
  const newSecurityRow = editMode
    ? [
        <tr
          key="type-row"
          style={{
            background: "var(--surface-dark)",
            borderTop: "2px solid var(--border-light)",
          }}
        >
          <td colSpan={columns.length}>
            <div
              style={{
                display: "flex",
                gap: "var(--space-sm)",
                alignItems: "center",
                padding: "var(--space-xs)",
              }}
            >
              <span
                style={{
                  fontWeight: "bold",
                  color: "var(--text-primary)",
                }}
              >
                Add:
              </span>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xxs)",
                }}
              >
                <input
                  type="radio"
                  name="addingType"
                  value="security"
                  checked={addingType === "security"}
                  onChange={(e) => {
                    setAddingType(e.target.value);
                    setNewSecurity({ ...EMPTY_SECURITY });
                  }}
                />
                Security
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xxs)",
                }}
              >
                <input
                  type="radio"
                  name="addingType"
                  value="cash"
                  checked={addingType === "cash"}
                  onChange={(e) => {
                    setAddingType(e.target.value);
                    setNewSecurity({ ...EMPTY_CASH });
                  }}
                />
                Cash
              </label>
            </div>
          </td>
        </tr>,
        <tr key="input-row" style={{ background: "var(--surface-dark)" }}>
          <td>
            <select
              value={newSecurity.accountId || ""}
              onChange={(e) => {
                const selectedAccount = allAccounts.find(
                  (acc) => acc.id === e.target.value
                );
                setNewSecurity((prev) => ({
                  ...prev,
                  accountId: e.target.value,
                  accountName: selectedAccount?.name || "",
                  accountProvider: selectedAccount?.accountProvider || "",
                }));
              }}
              className={tableStyles.tableSelect}
            >
              <option value="">Select Account</option>
              {allAccounts
                .filter(
                  (acc) =>
                    acc.category === "Investments" &&
                    (portfolioId === "all" || acc.portfolioId === portfolioId)
                )
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
            </select>
          </td>
          <td>
            {addingType === "cash" ? (
              <span className={tableStyles.mutedText}>Cash</span>
            ) : (
              <input
                ref={newSecurityNameRef}
                type="text"
                value={newSecurity.name}
                onChange={handleNewSecurityChange}
                name="name"
                className={tableStyles.tableInput}
                placeholder="Security name"
              />
            )}
          </td>
          <td>
            {addingType === "cash" ? (
              <span className={tableStyles.mutedText}>CASH</span>
            ) : (
              <input
                type="text"
                value={newSecurity.ticker}
                onChange={handleNewSecurityChange}
                name="ticker"
                className={tableStyles.tableInput}
                placeholder="AAPL"
              />
            )}
          </td>
          <td>
            {addingType === "cash" ? (
              <span className={tableStyles.mutedText}>N/A</span>
            ) : (
              <input
                type="date"
                value={newSecurity.datePurchased}
                onChange={handleNewSecurityChange}
                name="datePurchased"
                className={tableStyles.tableInput}
              />
            )}
          </td>
          <td>
            {addingType === "cash" ? (
              <span className={tableStyles.mutedText}>1</span>
            ) : (
              <input
                type="number"
                value={newSecurity.quantity}
                onChange={handleNewSecurityChange}
                name="quantity"
                className={tableStyles.tableInput}
                placeholder="100"
                step="0.001"
                min="0"
              />
            )}
          </td>
          <td className={tableStyles.alignRight}>
            {addingType === "cash" ? (
              <span className={tableStyles.mutedText}>N/A</span>
            ) : (
              <input
                type="number"
                value={newSecurity.purchasePrice}
                onChange={handleNewSecurityChange}
                name="purchasePrice"
                className={tableStyles.tableInput}
                placeholder="150.00"
                step="0.01"
                min="0"
              />
            )}
          </td>
          <td className={tableStyles.alignRight}>
            <input
              type="number"
              value={newSecurity.value}
              onChange={handleNewSecurityChange}
              name="value"
              className={tableStyles.tableInput}
              placeholder={addingType === "cash" ? "1000.00" : "15000.00"}
              step="0.01"
              min="0"
            />
          </td>
          <td className={tableStyles.alignCenter}>
            <button
              onClick={handleAddSecurity}
              disabled={
                !newSecurity.accountId ||
                !newSecurity.value ||
                (addingType === "security" &&
                  (!newSecurity.name ||
                    !newSecurity.ticker ||
                    !newSecurity.quantity))
              }
              className={`${tableStyles.actionButton} ${tableStyles.addButton}`}
              title={`Add ${addingType}`}
              aria-label={`Add new ${addingType}`}
            >
              <Plus className={tableStyles.buttonIcon} />
            </button>
          </td>
        </tr>,
      ]
    : null;

  // FIXED: Update handleSave to properly handle cash vs securities
  const handleSave = () => {
    if (!editRows || editRows.length === 0) {
      showInfo("No changes to save");
      return;
    }

    // Group by account and separate cash from securities
    const accountUpdates = {};
    editRows.forEach((item) => {
      if (!item.accountId) return;

      if (!accountUpdates[item.accountId]) {
        accountUpdates[item.accountId] = {
          securities: [],
          cashBalance: 0,
        };
      }

      if (item.type === "cash") {
        accountUpdates[item.accountId].cashBalance =
          parseFloat(item.value) || 0;
      } else {
        accountUpdates[item.accountId].securities.push({
          id: item.id,
          name: item.name,
          ticker: item.ticker,
          quantity: parseFloat(item.quantity) || 0,
          purchasePrice: parseFloat(item.purchasePrice) || 0,
          value: parseFloat(item.value) || 0,
          datePurchased: item.datePurchased,
        });
      }
    });

    // Update accounts with new securities and cash
    const updatedAccounts = allAccounts.map((account) => {
      if (accountUpdates[account.id]) {
        const update = accountUpdates[account.id];
        const totalSecuritiesValue = update.securities.reduce(
          (sum, sec) => sum + (sec.value || 0),
          0
        );
        const totalValue = totalSecuritiesValue + update.cashBalance;

        return {
          ...account,
          securities: update.securities,
          cashBalance: update.cashBalance,
          hasSecurities: update.securities.length > 0 || update.cashBalance > 0,
          value: totalValue, // FIXED: This should trigger goal updates
        };
      }
      return account;
    });

    const updatedData = {
      ...data,
      accounts: updatedAccounts,
    };

    // FIXED: Save data which will trigger goal sync in context
    saveData(updatedData);
    exitEditMode();
    showSuccess("Securities and cash positions saved successfully!");
  };

  // FIXED: Single handleResetToDemo function with proper imports
  const handleResetToDemo = () => {
    const updatedData = {
      ...data,
      accounts: DEMO_ACCOUNTS,
      portfolios: DEMO_PORTFOLIOS,
    };

    saveData(updatedData);
    exitEditMode();

    // Show success message with details
    const portfolioCount = DEMO_PORTFOLIOS.length;
    const accountCount = DEMO_ACCOUNTS.filter(
      (acc) => acc.category === "Investments"
    ).length;
    const securitiesCount = DEMO_ACCOUNTS.filter(
      (acc) => acc.category === "Investments" && acc.securities
    ).reduce((total, acc) => total + acc.securities.length, 0);

    showSuccess(
      `Reset to demo data!\n` +
        `• ${portfolioCount} portfolios restored\n` +
        `• ${accountCount} investment accounts restored\n` +
        `• ${securitiesCount} securities restored`
    );
  };

  const handleClearAll = () => {
    // Clear all investment accounts and remove empty portfolios
    const nonInvestmentAccounts = allAccounts.filter(
      (acc) => acc.category !== "Investments"
    );

    // Keep only portfolios that have non-investment accounts
    const remainingPortfolios = allPortfolios.filter((portfolio) => {
      const hasNonInvestmentAccounts = nonInvestmentAccounts.some(
        (acc) => acc.portfolioId === portfolio.id
      );
      return hasNonInvestmentAccounts;
    });

    const updatedData = {
      ...data,
      accounts: nonInvestmentAccounts,
      portfolios: remainingPortfolios,
    };

    saveData(updatedData);
    exitEditMode();

    const clearedPortfolios = allPortfolios.length - remainingPortfolios.length;
    const clearedAccounts = allAccounts.length - nonInvestmentAccounts.length;

    showWarning(
      `Cleared all investment data!\n` +
        `• ${clearedAccounts} investment accounts removed\n` +
        `• ${clearedPortfolios} empty portfolios removed`
    );
  };

  // Filtering for display
  const filteredSecurities = editMode ? editRows : securities;
  const displaySecurities = filteredSecurities;

  // Check if selected portfolio exists and has accounts
  const selectedPortfolio = allPortfolios.find((p) => p.id === portfolioId);
  const portfolioHasAccounts =
    portfolioId === "all" ||
    allAccounts.some(
      (acc) => acc.portfolioId === portfolioId && acc.category === "Investments"
    );

  // Generate appropriate empty state message
  const getEmptyStateMessage = () => {
    if (portfolioId !== "all" && portfolioId) {
      const portfolio = allPortfolios.find((p) => p.id === portfolioId);
      const portfolioName = portfolio?.name || "selected portfolio";

      if (!portfolioHasAccounts) {
        return `No investment accounts found for ${portfolioName}. Create an investment account and assign it to this portfolio.`;
      } else {
        return `No securities found for ${portfolioName}. Click the pencil icon to add securities.`;
      }
    }
    return "No securities found. Click the pencil icon to add securities.";
  };

  return (
    <Section
      header={
        <div className={sectionStyles.sectionHeaderRow}>
          <EditableTableHeader
            title={investmentsHeaderTitle}
            editMode={editMode}
            onEnterEdit={enterEditMode}
            onCancelEdit={cancelEdit}
            editable={true}
          />
          {showPortfolioSelectMenu && portfolioSelectMenu}
        </div>
      }
    >
      <Table
        columns={columns}
        data={displaySecurities}
        renderRow={renderSecurityRow}
        extraRow={newSecurityRow}
        smallApp={smallApp}
        editMode={editMode}
        disableSortingInEditMode={true}
      />

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

      {displaySecurities.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-md)",
            color: "var(--text-secondary)",
          }}
        >
          {getEmptyStateMessage()}
        </div>
      )}
    </Section>
  );
};

export default InvestmentsTab;
