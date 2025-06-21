// src/hooks/useToast.js
import { toast } from 'react-toastify';

export const useToast = () => {
  const showSuccess = (message, options = {}) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  };

  const showError = (message, options = {}) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 7000, // Longer for errors
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  };

  const showWarning = (message, options = {}) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  };

  const showInfo = (message, options = {}) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  };

  // For backwards compatibility with your existing showNotification calls
  const showNotification = ({ type = "info", title, message, ...options }) => {
    const content = title ? `${title}: ${message}` : message;
    
    switch (type) {
      case "success":
        showSuccess(content, options);
        break;
      case "error":
        showError(content, options);
        break;
      case "warning":
        showWarning(content, options);
        break;
      case "info":
      default:
        showInfo(content, options);
        break;
    }
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    toast // Direct access to toast for advanced usage
  };
};