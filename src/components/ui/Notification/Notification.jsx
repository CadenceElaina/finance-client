// src/components/ui/Notification/Notification.jsx
import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import styles from "./Notification.module.css";

const Notification = ({
  isVisible,
  type = "info", // "success", "warning", "error", "info"
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimeout(onClose, 300); // Wait for animation to complete
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, duration, onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} />;
      case "warning":
        return <AlertCircle size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div
      className={`${styles.notification} ${styles[type]} ${
        show ? styles.show : styles.hide
      }`}
    >
      <div className={styles.iconContainer}>{getIcon()}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.message}>{message}</div>
      </div>
      <button className={styles.closeButton} onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
