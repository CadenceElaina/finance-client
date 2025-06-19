// src/features/Dashboard/Apps/Budget/BudgetControlPanel.jsx asd
import React from "react";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import Button from "../../../../components/ui/Button/Button";
import styles from "./budget.module.css";

const BudgetControlPanel = ({ userSignedIn }) => {
  const {
    saveData,
    clearBudget,
    persistence,
    setPersistence,
    resetToDemoData, // <-- add this
  } = useFinancialData();

  return (
    <div className={styles.controlPanel}>
      <Button onClick={() => saveData()} variant="primary">
        Save Budget
      </Button>
      <Button onClick={clearBudget} variant="danger">
        Clear All
      </Button>
      <Button onClick={resetToDemoData} variant="warning">
        Reset to Demo Data
      </Button>
      {userSignedIn && (
        <div className={styles.persistenceOption}>
          <label htmlFor="persistence-pref" className={styles.persistenceLabel}>
            Data Storage:
          </label>
          <select
            id="persistence-pref"
            value={persistence}
            onChange={(e) => setPersistence(e.target.value)}
          >
            <option value="server">Server (Cloud)</option>
            <option value="local">Local Storage</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default BudgetControlPanel;
