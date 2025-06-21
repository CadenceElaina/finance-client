// src/hooks/useBudgetSection.js
import { useToast } from "./useToast";
import { useFinancialData } from "../contexts/FinancialDataContext";

export const useBudgetSection = (sectionName, dataKey) => {
  const { saveData, data } = useFinancialData();
  const { showSuccess, showWarning } = useToast();

  // Generic save handler that works for any budget section
  const handleSave = (updatedSectionData, customMessage) => {
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        [dataKey]: updatedSectionData,
      },
    };
    
    saveData(updatedData);
    showSuccess(customMessage || `${sectionName} saved successfully!`);
  };

  // Generic clear handler
  const handleClear = (clearData, customMessage) => {
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        [dataKey]: clearData,
      },
    };
    
    saveData(updatedData);
    showSuccess(customMessage || `${sectionName} cleared!`);
  };

  // Generic reset to demo handler
  const handleResetToDemo = (demoData, customMessage) => {
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        [dataKey]: demoData,
      },
    };
    
    saveData(updatedData);
    showWarning(customMessage || `${sectionName} reset to demo data!`);
  };

  // Enhanced save with debt sync notification capability
  const handleSaveWithNotification = (updatedSectionData, debtChanges = []) => {
    handleSave(updatedSectionData);
    
    if (debtChanges.length > 0) {
      const changesSummary = debtChanges.map(change => 
        `${change.name}: $${change.oldAmount} → $${change.newAmount}`
      ).join('\n');
      
      showWarning(`Debt payments updated:\n${changesSummary}`);
    }
  };

  return { 
    handleSave, 
    handleClear, 
    handleResetToDemo,
    handleSaveWithNotification,
    data 
  };
};