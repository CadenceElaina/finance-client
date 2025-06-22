// src/hooks/useBudgetForm.js
import { useEditableTable } from "./useEditableTable";
import { useFinancialData } from "../contexts/FinancialDataContext";
import { useToast } from "./useToast";

export const useBudgetForm = (sectionKey, defaultItem = {}, options = {}) => {
  const financialDataResult = useFinancialData();
  const { showSuccess, showWarning } = useToast();
  
  // Add safety check for undefined data
  if (!financialDataResult || !financialDataResult.data) {
    // Return a safe default state while data is loading
    return {
      editMode: false,
      editRows: [],
      enterEditMode: () => {},
      cancelEdit: () => {},
      exitEditMode: () => {},
      updateEditRow: () => {},
      addEditRow: () => {},
      removeEditRow: () => {},
      handleSave: () => {},
      handleClear: () => {},
      handleResetToDemo: () => {},
      sectionData: [],
      isValid: true,
    };
  }

  const { data, saveData } = financialDataResult;
  
  const {
    onSaveSuccess = null,
    onSaveError = null,
  } = options;
  
  const sectionData = data.budget?.[sectionKey] || [];
  const tableHook = useEditableTable(Array.isArray(sectionData) ? sectionData : [sectionData]);

  const handleSave = (customData, customMessage) => {
    const dataToSave = customData || tableHook.editRows;
    
    // Special handling for income - it should be a single object, not an array
    let finalDataToSave = dataToSave;
    if (sectionKey === 'income' && Array.isArray(dataToSave)) {
      finalDataToSave = dataToSave[0] || defaultItem;
    }
    
    // Save data
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        [sectionKey]: finalDataToSave,
      },
    };
    
    saveData(updatedData);
    tableHook.exitEditMode();
    
    const message = customMessage || `${sectionKey} saved successfully!`;
    showSuccess(message);
    
    if (onSaveSuccess) {
      onSaveSuccess(finalDataToSave);
    }
    
    return true;
  };

  const handleClear = (clearData, customMessage) => {
    let defaultClearData = Array.isArray(sectionData) ? [] : defaultItem;
    
    // Special handling for income - it should be a single object
    if (sectionKey === 'income') {
      defaultClearData = clearData || {
        type: "salary",
        annualPreTax: 0,
        monthlyAfterTax: 0,
        additionalAnnualAT: 0,
        hourlyRate: null,
        expectedAnnualHours: null,
      };
    } else {
      defaultClearData = clearData || defaultClearData;
    }
    
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        [sectionKey]: defaultClearData,
      },
    };
    
    saveData(updatedData);
    tableHook.exitEditMode();
    
    const message = customMessage || `${sectionKey} cleared!`;
    showSuccess(message);
  };

  const handleResetToDemo = (demoData, customMessage) => {
    let finalDemoData = demoData;
    
    // Special handling for income - it should be a single object
    if (sectionKey === 'income' && Array.isArray(demoData)) {
      finalDemoData = demoData[0] || defaultItem;
    }
    
    const updatedData = {
      ...data,
      budget: {
        ...data.budget,
        [sectionKey]: finalDemoData,
      },
    };
    
    saveData(updatedData);
    tableHook.exitEditMode();
    
    const message = customMessage || `${sectionKey} reset to demo data!`;
    showWarning(message);
  };

  return {
    ...tableHook,
    handleSave,
    handleClear,
    handleResetToDemo,
    sectionData,
    isValid: true,
  };
};