import React from "react";
import styles from "./Modal.module.css";
import Button from "../Button/Button";

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <Button
            onClick={onClose}
            variant="icon"
            className={styles.closeButton}
          >
            &times;
          </Button>
        </div>
        <div className={styles.modalContent}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
