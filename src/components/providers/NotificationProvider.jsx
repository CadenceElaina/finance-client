// src/components/providers/NotificationProvider.jsx
import React from "react";
import Notification from "../ui/Notification/Notification";
import { useNotification } from "../../hooks/useNotification";

// Create a context for global notifications
const NotificationContext = React.createContext();

export const NotificationProvider = ({ children }) => {
  const { notification, showNotification, hideNotification } =
    useNotification();

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Notification
        isVisible={!!notification}
        type={notification?.type}
        title={notification?.title}
        message={notification?.message}
        onClose={hideNotification}
        autoClose={notification?.autoClose}
        duration={notification?.duration}
      />
    </NotificationContext.Provider>
  );
};

export const useGlobalNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useGlobalNotification must be used within NotificationProvider"
    );
  }
  return context;
};
