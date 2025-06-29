import React from "react";
import Button from "../Button/Button";
import styles from "./ControlPanel.module.css";

const ControlPanel = ({
  onSave,
  onReset,
  onClear,
  saveLabel = "Save",
  resetLabel = "Reset to Demo",
  disabled = false,
}) => (
  <div className={styles.controlPanel}>
    <Button onClick={onSave} variant="primary" size="small" disabled={disabled}>
      {saveLabel}
    </Button>
    <Button
      onClick={onReset}
      variant="warning"
      size="small"
      disabled={disabled}
    >
      {resetLabel}
    </Button>
    <Button onClick={onClear} variant="danger" size="small" disabled={disabled}>
      Clear All
    </Button>
  </div>
);

export default ControlPanel;
