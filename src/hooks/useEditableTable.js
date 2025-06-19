import { useState, useEffect } from 'react';

export const useEditableTable = (initialData = []) => {
  const [editMode, setEditMode] = useState(false);
  const [editRows, setEditRows] = useState(initialData);

  // Sync editRows with external data when not in edit mode OR when initialData changes
  useEffect(() => {
    if (!editMode) {
      setEditRows(initialData);
    }
  }, [initialData, editMode]);

  // Also sync when initialData changes even in edit mode (for real-time updates)
  useEffect(() => {
    setEditRows(initialData);
  }, [initialData]);

  const enterEditMode = () => {
    setEditRows([...initialData]); // Create a copy to avoid mutations
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditRows([...initialData]); // Reset to current data
    setEditMode(false);
  };

  const updateEditRow = (index, field, value) => {
    setEditRows(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  const addEditRow = (newRow) => {
    setEditRows(prev => [...prev, newRow]);
  };

  const removeEditRow = (index) => {
    setEditRows(prev => prev.filter((_, i) => i !== index));
  };

  return {
    editMode,
    editRows,
    setEditRows,
    enterEditMode,
    cancelEdit,
    exitEditMode: () => setEditMode(false),
    updateEditRow,
    addEditRow,
    removeEditRow
  };
};