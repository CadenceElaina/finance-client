import { useState, useEffect, useRef, useCallback } from 'react';

export const useEditableTable = (initialData = []) => {
  const [editMode, setEditMode] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]); // Track original order
  
  // Use ref to track the previous initialData to avoid infinite loops
  const prevInitialDataRef = useRef();
  const initialDataStringified = JSON.stringify(initialData);

  // Only sync when NOT in edit mode AND when initialData actually changes
  useEffect(() => {
    const prevStringified = JSON.stringify(prevInitialDataRef.current);
    
    if (!editMode && initialDataStringified !== prevStringified) {
      setEditRows([...initialData]);
      setOriginalOrder([...initialData]); // Store original order
      prevInitialDataRef.current = initialData;
    }
  }, [editMode, initialDataStringified, initialData]);

  // Initialize editRows on mount
  useEffect(() => {
    if (prevInitialDataRef.current === undefined) {
      setEditRows([...initialData]);
      setOriginalOrder([...initialData]); // Store original order
      prevInitialDataRef.current = initialData;
    }
  }, []); // Only run on mount

  const enterEditMode = useCallback(() => {
    setOriginalOrder([...initialData]); // Capture current order when entering edit mode
    setEditRows([...initialData]); // Create a copy to avoid mutations
    setEditMode(true);
  }, [initialData]);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setEditRows([]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditRows([]);
  }, []);

  const updateEditRow = useCallback((index, field, value) => {
    setEditRows(prev => 
      prev.map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    );
  }, []);

  const addEditRow = useCallback((newRow) => {
    setEditRows(prev => [...prev, newRow]);
  }, []);

  const removeEditRow = useCallback((idOrIndex) => {
    setEditRows(prev => {
      // If it's a number, treat as index
      if (typeof idOrIndex === 'number') {
        return prev.filter((_, index) => index !== idOrIndex);
      }
      
      // Otherwise, treat as ID
      return prev.filter(row => row.id !== idOrIndex);
    });
  }, []);

  return {
    editMode,
    editRows,
    setEditRows,
    enterEditMode,
    cancelEdit,
    exitEditMode: () => setEditMode(false),
    updateEditRow,
    addEditRow,
    removeEditRow,
    originalOrder // Expose original order if needed
  };
};