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
import { Trash2, Plus } from "lucide-react"; // Add Plus icon

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
    removeEditRow, // FIXED: Now properly imported
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
    return (
      <tr
        key={
          security.id ||
          `${security.accountProvider}-${security.ticker}-${index}`
        }
      >
        <td>{editMode ? security.portfolioName : security.portfolioName}</td>
        <td>
          {editMode ? security.accountProvider : security.accountProvider}
        </td>
        <td>
          {editMode ? (
            <BudgetFormInput
              column={{ type: "text", placeholder: "Security name" }}
              value={security.name}
              onChange={(value) => updateEditRow(index, "name", value)}
            />
          ) : (
            security.name
          )}
        </td>
        <td>
          {editMode ? (
            <BudgetFormInput
              column={{ type: "text", placeholder: "TICKER" }}
              value={security.ticker}
              onChange={(value) => updateEditRow(index, "ticker", value)}
            />
          ) : (
            security.ticker
          )}
        </td>
        <td className={tableStyles.alignRight}>
          {editMode ? (
            <BudgetFormInput
              column={{
                type: "number",
                placeholder: "0",
                step: "0.001",
                min: "0",
              }}
              value={security.quantity}
              onChange={(value) => updateEditRow(index, "quantity", value)}
            />
          ) : (
            (security.quantity || 0).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 3,
            })
          )}
        </td>
        <td className={tableStyles.alignRight}>
          {editMode ? (
            <BudgetFormInput
              column={{
                type: "number",
                placeholder: "0.00",
                step: "0.01",
                min: "0",
              }}
              value={security.value}
              onChange={(value) => updateEditRow(index, "value", value)}
            />
          ) : (
            `$${(security.value || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}`
          )}
        </td>
        <td className={tableStyles.alignRight}>
          {editMode ? (
            <BudgetFormInput
              column={{
                type: "number",
                placeholder: "0.00",
                step: "0.01",
                min: "0",
              }}
              value={security.purchasePrice}
              onChange={(value) => updateEditRow(index, "purchasePrice", value)}
            />
          ) : (
            `$${(security.purchasePrice || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}`
          )}
        </td>
        <td>
          {editMode ? (
            <BudgetFormInput
              column={{ type: "date" }}
              value={security.datePurchased}
              onChange={(value) => updateEditRow(index, "datePurchased", value)}
            />
          ) : security.datePurchased ? (
            new Date(security.datePurchased).toLocaleDateString()
          ) : (
            "N/A"
          )}
        </td>
        {editMode && (
          <td className={tableStyles.alignCenter}>
            <button
              onClick={() =>
                removeEditRow(
                  security.id ||
                    `${security.accountProvider}-${security.ticker}-${index}`
                )
              } // FIXED: Use removeEditRow directly
              className={`${tableStyles.actionButton} ${tableStyles.removeButton}`}
              title="Remove security"
            >
              <span className={tableStyles.removeIcon}>×</span>
            </button>
          </td>
        )}
      </tr>
    );
  };

  // FIXED: New security row with standardized add button
  const newSecurityRow = editMode ? (
    <tr
      style={{
        background: "var(--surface-dark)",
        borderTop: "2px solid var(--border-light)",
      }}
    >
      <td>
        <BudgetFormSelect
          value={newSecurity.portfolioName}
          onChange={(e) =>
            handleNewSecurityChange({
              target: { name: "portfolioName", value: e.target.value },
            })
          }
          options={[
            { value: "", label: "Select Portfolio" },
            ...allPortfolios.map((p) => ({ value: p.name, label: p.name })),
          ]}
          placeholder="Select Portfolio"
        />
      </td>
      <td>
        <BudgetFormInput
          column={{ type: "text", placeholder: "Broker" }}
          value={newSecurity.accountProvider}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, accountProvider: value }))
          }
        />
      </td>
      <td>
        <BudgetFormInput
          ref={newSecurityNameRef}
          column={{ type: "text", placeholder: "Security name" }}
          value={newSecurity.name}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, name: value }))
          }
        />
      </td>
      <td>
        <BudgetFormInput
          column={{ type: "text", placeholder: "TICKER" }}
          value={newSecurity.ticker}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, ticker: value.toUpperCase() }))
          }
        />
      </td>
      <td className={tableStyles.alignRight}>
        <BudgetFormInput
          column={{
            type: "number",
            placeholder: "0",
            step: "0.001",
            min: "0",
          }}
          value={newSecurity.quantity}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, quantity: value }))
          }
        />
      </td>
      <td className={tableStyles.alignRight}>
        <BudgetFormInput
          column={{
            type: "number",
            placeholder: "0.00",
            step: "0.01",
            min: "0",
          }}
          value={newSecurity.value}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, value: value }))
          }
        />
      </td>
      <td className={tableStyles.alignRight}>
        <BudgetFormInput
          column={{
            type: "number",
            placeholder: "0.00",
            step: "0.01",
            min: "0",
          }}
          value={newSecurity.purchasePrice}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, purchasePrice: value }))
          }
        />
      </td>
      <td>
        <BudgetFormInput
          column={{ type: "date" }}
          value={newSecurity.datePurchased}
          onChange={(value) =>
            setNewSecurity((prev) => ({ ...prev, datePurchased: value }))
          }
        />
      </td>
      <td className={tableStyles.alignCenter}>
        <button
          onClick={handleAddSecurity}
          disabled={
            !newSecurity.name ||
            !newSecurity.ticker ||
            !newSecurity.quantity ||
            !newSecurity.value
          }
          className={`${tableStyles.actionButton} ${tableStyles.addButton}`}
          title="Add security"
        >
          <Plus className={tableStyles.buttonIcon} />
        </button>
      </td>
    </tr>
  ) : null;

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
          {showPortfolioSelectMenu && portfolioSelectMenu}
        </div>
      }
    >
      {/* MOVED: Control panel now appears AFTER the table */}
      <Table
        columns={columns}
        data={displaySecurities}
        renderRow={renderSecurityRow}
        extraRow={newSecurityRow}
        smallApp={smallApp}
        editMode={editMode}
        disableSortingInEditMode={true}
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

      {displaySecurities.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-md)",
            color: "var(--text-secondary)",
          }}
        >
          No securities found. Click the pencil icon to add securities.
        </div>
      )}
    </Section>
  );
};

export default InvestmentsTab;
