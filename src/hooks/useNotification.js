// src/hooks/useNotification.js
import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback(({
    type = "info",
    title,
    message,
    autoClose = true,
    duration = 5000,
  }) => {
    setNotification({
      id: Date.now(),
      type,
      title,
      message,
      autoClose,
      duration,
      isVisible: true,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};