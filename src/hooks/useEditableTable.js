import { useState, useEffect, useRef } from 'react';

export const useEditableTable = (initialData = []) => {
  const [editMode, setEditMode] = useState(false);
  const [editRows, setEditRows] = useState([]);
  
  // Use ref to track the previous initialData to avoid infinite loops
  const prevInitialDataRef = useRef();
  const initialDataStringified = JSON.stringify(initialData);

  // Only sync when NOT in edit mode AND when initialData actually changes
  useEffect(() => {
    const prevStringified = JSON.stringify(prevInitialDataRef.current);
    
    if (!editMode && initialDataStringified !== prevStringified) {
      setEditRows([...initialData]);
      prevInitialDataRef.current = initialData;
    }
  }, [editMode, initialDataStringified, initialData]);

  // Initialize editRows on mount
  useEffect(() => {
    if (prevInitialDataRef.current === undefined) {
      setEditRows([...initialData]);
      prevInitialDataRef.current = initialData;
    }
  }, []); // Only run on mount

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