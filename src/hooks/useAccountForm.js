// src/hooks/useAccountForm.js
import { useEditableTable } from './useEditableTable';
import { useFinancialData } from '../contexts/FinancialDataContext';
import { useToast } from './useToast';

export const useAccountForm = (accounts = []) => {
  const { data, saveData } = useFinancialData();
  const { showSuccess } = useToast();
  
  const tableHook = useEditableTable(accounts);

  const handleSave = () => {
    const updatedData = {
      ...data,
      accounts: tableHook.editRows,
    };
    
    saveData(updatedData);
    tableHook.exitEditMode();
    showSuccess("Accounts saved successfully!");
  };

  const handleReset = () => {
    // Reset logic similar to budget
  };

  return {
    ...tableHook,
    handleSave,
    handleReset,
  };
};