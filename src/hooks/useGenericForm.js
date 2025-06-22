import { useEditableTable } from "./useEditableTable";
import { useFinancialData } from "../contexts/FinancialDataContext";
import { useToast } from "./useToast";

export const useGenericForm = (dataPath, defaultItem = {}, options = {}) => {
  const { data, saveData } = useFinancialData();
  const { showSuccess, showWarning } = useToast();
  
  const {
    transformOnSave = (data) => data,
    onSaveSuccess = null,
    onSaveError = null,
    validateData = () => ({ isValid: true, errors: {} })
  } = options;
  
  // Get nested data using path like 'budget.income' or 'accounts'
  const sectionData = dataPath.split('.').reduce((obj, key) => obj?.[key], data) || [];
  const isArray = Array.isArray(sectionData);
  const tableData = isArray ? sectionData : [sectionData];
  
  const tableHook = useEditableTable(tableData);

  const handleSave = (customData, customMessage) => {
    const dataToSave = customData || tableHook.editRows;
    const finalData = transformOnSave(isArray ? dataToSave : dataToSave[0]);
    
    // Validate before saving
    const validation = validateData(finalData);
    if (!validation.isValid) {
      Object.values(validation.errors).forEach(error => {
        showWarning(error);
      });
      return false;
    }
    
    // Update nested data structure
    const updatedData = { ...data };
    const pathKeys = dataPath.split('.');
    let current = updatedData;
    
    for (let i = 0; i < pathKeys.length - 1; i++) {
      current = current[pathKeys[i]];
    }
    current[pathKeys[pathKeys.length - 1]] = finalData;
    
    saveData(updatedData);
    tableHook.exitEditMode();
    
    const message = customMessage || `${dataPath} saved successfully!`;
    showSuccess(message);
    
    if (onSaveSuccess) onSaveSuccess(finalData);
    return true;
  };

  return {
    ...tableHook,
    handleSave,
    sectionData: tableData,
    validation: validateData(tableData)
  };
};