import React, { useState, useRef, useMemo } from "react";
import Table from "../../../../../components/ui/Table/Table";
import tableStyles from "../../../../../components/ui/Table/Table.module.css";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import ControlPanel from "../../../../../components/ui/ControlPanel/ControlPanel";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import accountsStyles from "../Accounts.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useEditableTable } from "../../../../../hooks/useEditableTable";

const EMPTY_SECURITY = {
  name: "",
  ticker: "",
  quantity: "",
  value: "",
  purchasePrice: "",
  datePurchased: "",
  portfolioName: "",
  accountProvider: "",
};

const InvestmentsTab = ({
  portfolioId,
  smallApp,
  portfolios = [],
  setSelectedPortfolioId,
  selectedPortfolioId,
  holdingsHeaderTitle = "Investments",
  showPortfolioSelectMenu = false,
  portfolioSelectMenu,
}) => {
  const { data, saveData, resetAccountsToDemo, clearAccountsData } =
    useFinancialData();
  const allAccounts = data.accounts || [];
  const allPortfolios = data.portfolios || [];

  // Get all securities from investment accounts
  const securities = useMemo(() => {
    let relevantAccounts = [];
    if (portfolioId === "all") {
      relevantAccounts = allAccounts.filter(
        (acc) => acc.category === "Investments" && acc.hasSecurities
      );
    } else {
      relevantAccounts = allAccounts.filter(
        (acc) =>
          acc.category === "Investments" &&
          acc.hasSecurities &&
          acc.portfolioId === portfolioId
      );
    }

    let rows = [];
    relevantAccounts.forEach((acc) => {
      if (Array.isArray(acc.securities)) {
        acc.securities.forEach((sec, secIndex) => {
          // Find the portfolio name properly
          const portfolio = allPortfolios.find((p) => p.id === acc.portfolioId);
          const portfolioName = portfolio ? portfolio.name : "Unassigned";

          rows.push({
            id: `${acc.id}-${sec.ticker || sec.name}-${secIndex}`,
            accountId: acc.id,
            accountName: acc.name,
            accountProvider: acc.accountProvider,
            portfolioId: acc.portfolioId,
            portfolioName: portfolioName,
            securityIndex: secIndex,
            ...sec,
          });
        });
      }
    });
    return rows;
  }, [allAccounts, portfolioId, allPortfolios]);

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
  const newSecurityNameRef = useRef(null);

  // Handle saving from control panel
  const handleSave = () => {
    // Group securities by account, but also track portfolio changes
    const securityByAccount = editRows.reduce((acc, security) => {
      if (!acc[security.accountId]) {
        acc[security.accountId] = {
          securities: [],
          portfolioName: security.portfolioName,
          accountProvider: security.accountProvider,
        };
      }
      acc[security.accountId].securities.push({
        name: security.name,
        ticker: security.ticker,
        quantity: parseFloat(security.quantity) || 0,
        value: parseFloat(security.value) || 0,
        purchasePrice: parseFloat(security.purchasePrice) || 0,
        datePurchased: security.datePurchased,
      });
      return acc;
    }, {});

    // Check for new portfolios that need to be created
    const existingPortfolioNames = allPortfolios.map((p) =>
      p.name.toLowerCase()
    );
    const newPortfolios = [...allPortfolios];
    const portfolioNameToId = {};

    // Map existing portfolios
    allPortfolios.forEach((p) => {
      portfolioNameToId[p.name.toLowerCase()] = p.id;
    });

    // Create new portfolios if needed
    editRows.forEach((security) => {
      const portfolioNameLower = security.portfolioName.toLowerCase();
      if (
        security.portfolioName &&
        !existingPortfolioNames.includes(portfolioNameLower)
      ) {
        const newPortfolioId = `portfolio-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        newPortfolios.push({
          id: newPortfolioId,
          name: security.portfolioName,
        });
        portfolioNameToId[portfolioNameLower] = newPortfolioId;
        existingPortfolioNames.push(portfolioNameLower);
      }
    });

    // Update accounts with new securities AND portfolio assignments
    const updatedAccounts = allAccounts.map((account) => {
      if (account.category === "Investments" && securityByAccount[account.id]) {
        const securityData = securityByAccount[account.id];
        const portfolioNameLower = securityData.portfolioName.toLowerCase();
        const newPortfolioId = portfolioNameToId[portfolioNameLower];

        return {
          ...account,
          accountProvider: securityData.accountProvider,
          portfolioId: newPortfolioId,
          securities: securityData.securities,
        };
      }
      return account;
    });

    // Save updated data with new portfolios
    const updatedData = {
      ...data,
      accounts: updatedAccounts,
      portfolios: newPortfolios,
    };

    saveData(updatedData);
    exitEditMode();
  };

  // Handle reset to demo
  const handleResetToDemo = () => {
    if (editMode) {
      resetAccountsToDemo();
      exitEditMode();
    } else {
      resetAccountsToDemo();
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (editMode) {
      // Clear securities from all investment accounts
      const updatedAccounts = allAccounts.map((account) => {
        if (account.category === "Investments") {
          return {
            ...account,
            securities: [],
          };
        }
        return account;
      });

      const updatedData = {
        ...data,
        accounts: updatedAccounts,
      };

      saveData(updatedData);
      exitEditMode();
    } else {
      // Clear securities from all investment accounts
      const updatedAccounts = allAccounts.map((account) => {
        if (account.category === "Investments") {
          return {
            ...account,
            securities: [],
          };
        }
        return account;
      });

      const updatedData = {
        ...data,
        accounts: updatedAccounts,
      };

      saveData(updatedData);
    }
  };

  // Filtering for display
  const filteredSecurities = editMode ? editRows : securities;
  const displaySecurities = filteredSecurities;

  const handleNewSecurityChange = (e) => {
    const { name, value } = e.target;
    setNewSecurity((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "value" || name === "purchasePrice"
          ? value === ""
            ? ""
            : parseFloat(value) || ""
          : value,
    }));
  };

  const handleAddSecurity = () => {
    if (newSecurity.name && newSecurity.ticker && newSecurity.portfolioName) {
      // Find or create account for this portfolio/provider combination
      let targetAccount = allAccounts.find(
        (acc) =>
          acc.category === "Investments" &&
          acc.accountProvider === newSecurity.accountProvider
      );

      let targetAccountId;
      if (!targetAccount) {
        // Create new investment account
        targetAccountId = `acc-${Date.now()}`;
        const newAccount = {
          id: targetAccountId,
          name: `${newSecurity.portfolioName} - ${newSecurity.accountProvider}`,
          accountProvider: newSecurity.accountProvider,
          category: "Investments",
          subType: "Investment Account",
          value: parseFloat(newSecurity.value) || 0,
          taxStatus: "",
          hasSecurities: true,
          portfolioId: null, // Will be set when we save
          securities: [],
        };

        const updatedAccounts = [...allAccounts, newAccount];
        const updatedData = { ...data, accounts: updatedAccounts };
        saveData(updatedData);
        targetAccountId = newAccount.id;
      } else {
        targetAccountId = targetAccount.id;
      }

      const security = {
        id: `${targetAccountId}-${newSecurity.ticker}-${Date.now()}`,
        accountId: targetAccountId,
        accountName: targetAccount
          ? targetAccount.name
          : `${newSecurity.portfolioName} - ${newSecurity.accountProvider}`,
        accountProvider: newSecurity.accountProvider,
        portfolioId: null, // Will be determined when saving
        portfolioName: newSecurity.portfolioName,
        securityIndex: 0,
        ...newSecurity,
        quantity: parseFloat(newSecurity.quantity) || 0,
        value: parseFloat(newSecurity.value) || 0,
        purchasePrice: parseFloat(newSecurity.purchasePrice) || 0,
      };

      if (editMode) {
        addEditRow(security);
      } else {
        // Add directly to account if not in edit mode
        const updatedAccounts = allAccounts.map((account) => {
          if (account.id === targetAccountId) {
            return {
              ...account,
              securities: [
                ...(account.securities || []),
                {
                  name: security.name,
                  ticker: security.ticker,
                  quantity: security.quantity,
                  value: security.value,
                  purchasePrice: security.purchasePrice,
                  datePurchased: security.datePurchased,
                },
              ],
            };
          }
          return account;
        });

        const updatedData = { ...data, accounts: updatedAccounts };
        saveData(updatedData);
      }

      setNewSecurity({ ...EMPTY_SECURITY });
      newSecurityNameRef.current?.focus();
    }
  };

  const renderSecurityRow = (security, index) => {
    if (!editMode) {
      // View mode - plain text, no action column
      return (
        <tr key={security.id}>
          <td>{security.portfolioName}</td>
          <td>{security.accountProvider}</td>
          <td>{security.name}</td>
          <td>{security.ticker}</td>
          <td>{security.quantity?.toLocaleString()}</td>
          <td>
            $
            {security.value?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </td>
          <td>
            {security.purchasePrice
              ? `$${security.purchasePrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "-"}
          </td>
          <td>
            {security.datePurchased
              ? new Date(security.datePurchased).toLocaleDateString()
              : "-"}
          </td>
        </tr>
      );
    }

    // Edit mode - inputs
    return (
      <tr key={security.id}>
        <td>
          <input
            type="text"
            value={security.portfolioName}
            onChange={(e) =>
              updateEditRow(index, "portfolioName", e.target.value)
            }
            className={tableStyles.tableInput}
            placeholder="Portfolio name"
          />
        </td>
        <td>
          <input
            type="text"
            value={security.accountProvider}
            onChange={(e) =>
              updateEditRow(index, "accountProvider", e.target.value)
            }
            className={tableStyles.tableInput}
            placeholder="Broker/Provider"
          />
        </td>
        <td>
          <input
            type="text"
            value={security.name}
            onChange={(e) => updateEditRow(index, "name", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="text"
            value={security.ticker}
            onChange={(e) => updateEditRow(index, "ticker", e.target.value)}
            className={tableStyles.tableInput}
          />
        </td>
        <td>
          <input
            type="number"
            value={security.quantity}
            onChange={(e) =>
              updateEditRow(index, "quantity", parseFloat(e.target.value) || 0)
            }
            className={tableStyles.tableInput}
            min="0"
            step="0.01"
          />
        </td>
        <td>
          <input
            type="number"
            value={security.value}
            onChange={(e) =>
              updateEditRow(index, "value", parseFloat(e.target.value) || 0)
            }
            className={tableStyles.tableInput}
            min="0"
            step="0.01"
          />
        </td>
        <td>
          <input
            type="number"
            value={security.purchasePrice}
            onChange={(e) =>
              updateEditRow(
                index,
                "purchasePrice",
                parseFloat(e.target.value) || 0
              )
            }
            className={tableStyles.tableInput}
            min="0"
            step="0.01"
          />
        </td>
        <td>
          <input
            type="date"
            value={security.datePurchased}
            onChange={(e) =>
              updateEditRow(index, "datePurchased", e.target.value)
            }
            className={tableStyles.tableInput}
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
    { key: "portfolioName", label: "Portfolio" },
    { key: "accountProvider", label: "Broker" },
    { key: "name", label: "Security Name" },
    { key: "ticker", label: "Ticker" },
    { key: "quantity", label: "Qty" },
    { key: "value", label: "Value" },
    { key: "purchasePrice", label: "Avg. Cost" },
    { key: "datePurchased", label: "Last Purchased" },
  ];

  const editColumns = [...viewColumns, { key: "actions", label: "Actions" }];

  const columns = editMode ? editColumns : viewColumns;

  return (
    <Section
      header={
        <div className={sectionStyles.sectionHeaderRow}>
          <EditableTableHeader
            title={holdingsHeaderTitle}
            editMode={editMode}
            onEnterEdit={enterEditMode}
            onCancelEdit={cancelEdit}
            editable={true}
          />
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              alignItems: "center",
            }}
          >
            {/* Portfolio select menu */}
            {showPortfolioSelectMenu && portfolioSelectMenu}
          </div>
        </div>
      }
      className={tableStyles.tableSection}
    >
      <div className={tableStyles.tableContainer}>
        <Table
          columns={columns}
          data={displaySecurities}
          renderRow={renderSecurityRow}
          extraRow={
            editMode ? (
              <tr>
                <td>
                  <input
                    type="text"
                    name="portfolioName"
                    value={newSecurity.portfolioName}
                    onChange={handleNewSecurityChange}
                    placeholder="Portfolio name"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="accountProvider"
                    value={newSecurity.accountProvider}
                    onChange={handleNewSecurityChange}
                    placeholder="Broker/Provider"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    ref={newSecurityNameRef}
                    type="text"
                    name="name"
                    value={newSecurity.name}
                    onChange={handleNewSecurityChange}
                    placeholder="Security name"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="ticker"
                    value={newSecurity.ticker}
                    onChange={handleNewSecurityChange}
                    placeholder="TICKER"
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="quantity"
                    value={newSecurity.quantity}
                    onChange={handleNewSecurityChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="value"
                    value={newSecurity.value}
                    onChange={handleNewSecurityChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={newSecurity.purchasePrice}
                    onChange={handleNewSecurityChange}
                    placeholder="0"
                    className={tableStyles.tableInput}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    name="datePurchased"
                    value={newSecurity.datePurchased}
                    onChange={handleNewSecurityChange}
                    className={tableStyles.tableInput}
                  />
                </td>
                <td>
                  <button
                    onClick={handleAddSecurity}
                    className={tableStyles.addButton}
                    title="Add"
                  >
                    +
                  </button>
                </td>
              </tr>
            ) : null
          }
          className={tableStyles.compactTable}
          smallApp={smallApp}
        />
      </div>

      {/* Control Panel - only show in edit mode */}
      {editMode && (
        <ControlPanel
          onSave={handleSave}
          saveLabel="Save Investments"
          onReset={handleResetToDemo}
          onClear={handleClearAll}
          resetLabel="Reset to Demo"
        />
      )}
    </Section>
  );
};

export default InvestmentsTab;
