// src/components/ui/Modal/AccountGoalUpdateModal.jsx
import React, { useState, useEffect } from "react";
import Button from "../Button/Button";
import styles from "./Modal.module.css";

const AccountGoalUpdateModal = ({
  notification,
  isOpen,
  onClose,
  onConfirm,
  onOpenPlanApp,
  isPlanAppOpen = false,
}) => {
  const [updateAmount, setUpdateAmount] = useState("");
  const [updateType, setUpdateType] = useState("proportional");

  useEffect(() => {
    if (isOpen && notification) {
      const { goal, oldValue, newValue } = notification;
      const difference = newValue - oldValue;
      const proportionalIncrease = goal.useEntireAccount
        ? difference
        : (goal.linkedAccountAmount / oldValue) * difference;

      setUpdateAmount(Math.max(0, proportionalIncrease).toFixed(2));
    }
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  const { goal, oldValue, newValue, accountName } = notification;

  // Calculate remaining amount needed to reach the goal
  const remainingToGoal = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isGoalComplete = remainingToGoal <= 0.01; // Consider complete if within 1 cent

  // If goal is already completed, don't show the modal
  if (isGoalComplete || goal.status === "completed") {
    return null;
  }

  // Check if full account value would exceed the goal
  const fullAccountWouldExceedGoal = newValue > goal.targetAmount;

  const handleConfirm = () => {
    let amountToAdd = 0;

    switch (updateType) {
      case "proportional":
        if (goal.useEntireAccount) {
          amountToAdd = newValue - oldValue;
        } else {
          const proportionalIncrease =
            (goal.linkedAccountAmount / oldValue) * (newValue - oldValue);
          amountToAdd = proportionalIncrease;
        }
        break;
      case "difference":
        amountToAdd = newValue - oldValue;
        break;
      case "fullAccount":
        amountToAdd = newValue - goal.currentAmount;
        break;
      case "custom":
        amountToAdd = parseFloat(updateAmount) || 0;
        break;
      case "completeGoal":
        amountToAdd = remainingToGoal;
        break;
      case "none":
      default:
        amountToAdd = 0;
        break;
    }

    // Cap the amount to not exceed the goal
    const finalAmount = Math.min(Math.max(0, amountToAdd), remainingToGoal);
    onConfirm(finalAmount);
  };

  // Calculate what each option would actually apply (capped to goal completion)
  const getDisplayAmount = (type, customAmount = null) => {
    let rawAmount = 0;

    switch (type) {
      case "proportional":
        if (goal.useEntireAccount) {
          rawAmount = newValue - oldValue;
        } else {
          rawAmount =
            ((goal.linkedAccountAmount || 0) / oldValue) *
            (newValue - oldValue);
        }
        break;
      case "difference":
        rawAmount = newValue - oldValue;
        break;
      case "fullAccount":
        rawAmount = newValue - goal.currentAmount;
        break;
      case "completeGoal":
        rawAmount = remainingToGoal;
        break;
      case "custom":
        rawAmount = parseFloat(customAmount) || 0;
        break;
      default:
        rawAmount = 0;
    }

    const cappedAmount = Math.min(Math.max(0, rawAmount), remainingToGoal);
    const willCompleteGoal = cappedAmount >= remainingToGoal - 0.01;

    return {
      amount: cappedAmount,
      willCompleteGoal,
      wasCapped: rawAmount > remainingToGoal + 0.01,
    };
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Account Balance Updated</h3>
        <p>
          Your <strong>{accountName}</strong> account linked to goal{" "}
          <strong>"{goal?.name}"</strong> has changed from $
          {oldValue.toLocaleString()} to ${newValue.toLocaleString()}.
        </p>

        <div
          style={{
            background: "var(--surface-dark)",
            padding: "var(--space-xs)",
            borderRadius: "var(--border-radius-sm)",
            margin: "var(--space-sm) 0",
            border: "1px solid var(--border-light)",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: "600",
              marginBottom: "var(--space-xxs)",
            }}
          >
            Goal Progress: ${goal.currentAmount.toLocaleString()} / $
            {goal.targetAmount.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-secondary)",
            }}
          >
            Remaining to reach goal: ${remainingToGoal.toLocaleString()}
          </div>
        </div>

        <div className={styles.modalOptions}>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="updateType"
                value="proportional"
                checked={updateType === "proportional"}
                onChange={(e) => setUpdateType(e.target.value)}
              />
              <span>
                Update proportionally
                {(() => {
                  const display = getDisplayAmount("proportional");
                  return ` (+$${display.amount.toFixed(2)})${
                    display.willCompleteGoal ? " ✓ Completes Goal!" : ""
                  }${display.wasCapped ? " (capped)" : ""}`;
                })()}
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="updateType"
                value="difference"
                checked={updateType === "difference"}
                onChange={(e) => setUpdateType(e.target.value)}
              />
              <span>
                Add account change
                {(() => {
                  const display = getDisplayAmount("difference");
                  return ` (+$${display.amount.toFixed(2)})${
                    display.willCompleteGoal ? " ✓ Completes Goal!" : ""
                  }${display.wasCapped ? " (capped)" : ""}`;
                })()}
              </span>
            </label>

            {/* Only show "Use full account value" if it doesn't make "Complete goal exactly" redundant */}
            {!fullAccountWouldExceedGoal && (
              <label>
                <input
                  type="radio"
                  name="updateType"
                  value="fullAccount"
                  checked={updateType === "fullAccount"}
                  onChange={(e) => setUpdateType(e.target.value)}
                />
                <span>
                  Use full account value
                  {(() => {
                    const display = getDisplayAmount("fullAccount");
                    return ` (+$${display.amount.toFixed(2)})${
                      display.willCompleteGoal ? " ✓ Completes Goal!" : ""
                    }${display.wasCapped ? " (capped)" : ""}`;
                  })()}
                </span>
              </label>
            )}

            <label>
              <input
                type="radio"
                name="updateType"
                value="completeGoal"
                checked={updateType === "completeGoal"}
                onChange={(e) => setUpdateType(e.target.value)}
              />
              <span>
                Complete goal exactly (+${remainingToGoal.toFixed(2)}) ✓
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="updateType"
                value="custom"
                checked={updateType === "custom"}
                onChange={(e) => setUpdateType(e.target.value)}
              />
              <span>Custom amount:</span>
              <input
                type="number"
                value={updateAmount}
                onChange={(e) => setUpdateAmount(e.target.value)}
                className={styles.inlineInput}
                min="0"
                max={remainingToGoal.toFixed(2)}
                step="0.01"
              />
              {updateType === "custom" &&
                (() => {
                  const display = getDisplayAmount("custom", updateAmount);
                  return (
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--text-secondary)",
                        marginLeft: "var(--space-xs)",
                      }}
                    >
                      {display.willCompleteGoal ? "✓ Completes Goal!" : ""}
                      {display.wasCapped ? " (capped to goal)" : ""}
                    </span>
                  );
                })()}
            </label>

            <label>
              <input
                type="radio"
                name="updateType"
                value="none"
                checked={updateType === "none"}
                onChange={(e) => setUpdateType(e.target.value)}
              />
              <span>Don't update goal</span>
            </label>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          {!isPlanAppOpen && (
            <Button onClick={onOpenPlanApp} variant="primary">
              Open Plan App
            </Button>
          )}
          <Button onClick={handleConfirm} variant="primary">
            Update Goal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountGoalUpdateModal;
