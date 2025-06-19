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
    <Button onClick={onSave} variant="primary" disabled={disabled}>
      {saveLabel}
    </Button>
    <Button onClick={onReset} variant="warning" disabled={disabled}>
      {resetLabel}
    </Button>
    <Button onClick={onClear} variant="danger" disabled={disabled}>
      Clear All
    </Button>
  </div>
);

export default ControlPanel;
