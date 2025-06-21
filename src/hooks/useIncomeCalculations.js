// src/features/Dashboard/Apps/Budget/hooks/useIncomeCalculations.js
import { useMemo } from "react";
import { useBudgetSection } from "./useBudgetSection";

const DEFAULT_HOURS = 2080;

export const useIncomeCalculations = (incomeData) => {
  return useMemo(() => {
    const hourlyRate = parseFloat(incomeData.hourlyRate) || 0;
    const expectedHours = parseFloat(incomeData.expectedHours) || DEFAULT_HOURS;
    const annualPreTax = parseFloat(incomeData.annualPreTax) || 0;
    const monthlyAfterTax = parseFloat(incomeData.monthlyAfterTax) || 0;
    const additionalAnnualAT = parseFloat(incomeData.additionalAnnualAT) || 0; // NEW

    let calculatedAnnualPreTax = annualPreTax;
    let calculatedMonthlyPreTax = annualPreTax / 12;
    
    // Calculate total annual after-tax including additional income
    let calculatedAnnualAfterTax = (monthlyAfterTax * 12) + additionalAnnualAT;

    if (incomeData.type === "hourly") {
      calculatedAnnualPreTax = hourlyRate * expectedHours;
      calculatedMonthlyPreTax = calculatedAnnualPreTax / 12;
    }

    // Calculate effective tax rate based on primary income only (not including additional)
    const primaryAnnualAfterTax = monthlyAfterTax * 12;
    const effectiveTaxRate = calculatedAnnualPreTax > 0 
      ? ((calculatedAnnualPreTax - primaryAnnualAfterTax) / calculatedAnnualPreTax) * 100
      : 0;

    // Estimate missing values based on available data
    const estimatedMonthlyAfterTax = incomeData.type === "hourly" && !monthlyAfterTax
      ? calculatedMonthlyPreTax * 0.75 // Rough 25% tax estimate
      : monthlyAfterTax;

    return {
      // Core calculated values
      annualPreTax: calculatedAnnualPreTax,
      monthlyPreTax: calculatedMonthlyPreTax,
      annualAfterTax: calculatedAnnualAfterTax, // Now includes additional income
      primaryAnnualAfterTax: primaryAnnualAfterTax, // Just from monthly * 12
      additionalAnnualAT: additionalAnnualAT,
      
      // Additional useful calculations
      effectiveTaxRate,
      estimatedMonthlyAfterTax,
      
      // Validation helpers
      hasValidData: calculatedAnnualPreTax > 0 || monthlyAfterTax > 0,
      isComplete: calculatedAnnualPreTax > 0 && monthlyAfterTax > 0,
      
      // Formatting helpers
      formatted: {
        annualPreTax: calculatedAnnualPreTax.toLocaleString(),
        monthlyPreTax: calculatedMonthlyPreTax.toLocaleString(),
        annualAfterTax: calculatedAnnualAfterTax.toLocaleString(),
        monthlyAfterTax: monthlyAfterTax.toLocaleString(),
        additionalAnnualAT: additionalAnnualAT.toLocaleString(),
        effectiveTaxRate: `${effectiveTaxRate.toFixed(1)}%`
      }
    };
  }, [incomeData]);
};

// Enhanced hook for income section specifically
export const useIncomeSection = (budget) => {
  const { handleSave, handleClear } = useBudgetSection("Income", "income");
  
  const incomeData = budget?.income || {};
  const calculations = useIncomeCalculations(incomeData);
  
  // Create standardized income data array for table display
  const tableData = useMemo(() => [{
    id: "income-1",
    type: incomeData.type || "salary",
    hourlyRate: incomeData.hourlyRate || "",
    expectedHours: incomeData.expectedAnnualHours || DEFAULT_HOURS,
    annualPreTax: incomeData.annualPreTax || "",
    monthlyAfterTax: incomeData.monthlyAfterTax || "",
    additionalAnnualAT: incomeData.additionalAnnualAT || "", // NEW
    ...calculations
  }], [incomeData, calculations]);

  const saveIncome = (editRows) => {
    const row = editRows[0];
    const incomeUpdate = {
      type: row.type,
      monthlyAfterTax: parseFloat(row.monthlyAfterTax) || 0,
      additionalAnnualAT: parseFloat(row.additionalAnnualAT) || 0, // NEW
    };

    if (row.type === "hourly") {
      incomeUpdate.hourlyRate = parseFloat(row.hourlyRate) || 0;
      incomeUpdate.expectedAnnualHours = parseFloat(row.expectedHours) || DEFAULT_HOURS;
      incomeUpdate.annualPreTax = calculations.annualPreTax;
    } else {
      incomeUpdate.annualPreTax = parseFloat(row.annualPreTax) || 0;
    }

    handleSave(incomeUpdate);
  };

  const clearIncome = () => {
    const clearedIncome = {
      type: "salary",
      annualPreTax: 0,
      monthlyAfterTax: 0,
      additionalAnnualAT: 0, // NEW
      hourlyRate: null,
      expectedAnnualHours: null,
    };
    handleClear(clearedIncome);
  };

  return {
    tableData,
    calculations,
    saveIncome,
    clearIncome,
    incomeData
  };
};