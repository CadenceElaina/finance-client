// src/features/Dashboard/Apps/Plan/Goals/GoalForm.jsx
import React, { useState, useEffect } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useToast } from "../../../../../hooks/useToast"; // Add this import
import goalsStyles from "../goals.module.css";

const GoalForm = ({ goal, onSave, onCancel, availableDiscretionary }) => {
  const { data } = useFinancialData();
  const { showInfo, showSuccess } = useToast();
  const { accounts, budget, goals } = data;

  const [formData, setFormData] = useState({
    name: "",
    type: "savings", // savings, investment, debt, emergency, other
    targetAmount: "",
    targetDate: "",
    linkedAccounts: [], // Array of {accountId, allocatedAmount}
    linkedToBudget: false,
    budgetMonthlyAmount: "",
    status: "active",
    ...goal,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    }
  }, [goal]);

  // Calculate available amounts for each account based on existing goal allocations
  const getAccountAvailableAmounts = () => {
    const accountAllocations = new Map();

    // Initialize all accounts with their full amounts
    accounts?.forEach((acc) => {
      if (acc.category === "Cash" || acc.category === "Investments") {
        accountAllocations.set(acc.id, {
          account: acc,
          totalValue: acc.value || 0,
          cashBalance: acc.cashBalance || 0,
          securitiesValue: (acc.value || 0) - (acc.cashBalance || 0),
          allocatedAmount: 0,
          availableCash:
            acc.category === "Cash" ? acc.value || 0 : acc.cashBalance || 0,
          availableSecurities:
            acc.category === "Investments"
              ? (acc.value || 0) - (acc.cashBalance || 0)
              : 0,
          availableTotal: acc.value || 0,
        });
      }
    });

    // Subtract allocations from existing goals (excluding current goal being edited)
    goals?.forEach((existingGoal) => {
      if (existingGoal.id !== formData.id && existingGoal.linkedAccounts) {
        existingGoal.linkedAccounts.forEach((linkedAcc) => {
          const allocation = accountAllocations.get(linkedAcc.accountId);
          if (allocation) {
            const allocatedAmount = parseFloat(linkedAcc.allocatedAmount) || 0;
            allocation.allocatedAmount += allocatedAmount;

            // For cash accounts, reduce available cash
            if (allocation.account.category === "Cash") {
              allocation.availableCash = Math.max(
                0,
                allocation.availableCash - allocatedAmount
              );
            } else {
              // For investment accounts, check goal type of existing goal
              if (existingGoal.type === "investment") {
                // Investment goals can use entire account value
                allocation.availableTotal = Math.max(
                  0,
                  allocation.availableTotal - allocatedAmount
                );
                // Also reduce available securities proportionally
                const securitiesRatio =
                  allocation.securitiesValue / allocation.totalValue;
                const cashRatio =
                  allocation.cashBalance / allocation.totalValue;
                allocation.availableSecurities = Math.max(
                  0,
                  allocation.availableSecurities -
                    allocatedAmount * securitiesRatio
                );
                allocation.availableCash = Math.max(
                  0,
                  allocation.availableCash - allocatedAmount * cashRatio
                );
              } else {
                // Non-investment goals can only use cash portion
                allocation.availableCash = Math.max(
                  0,
                  allocation.availableCash - allocatedAmount
                );
              }
            }
          }
        });
      }
    });

    return accountAllocations;
  };

  const accountAvailability = getAccountAvailableAmounts();

  // Calculate current goal total from linked accounts
  const calculateCurrentAmount = () => {
    return formData.linkedAccounts.reduce((sum, linkedAcc) => {
      return sum + (parseFloat(linkedAcc.allocatedAmount) || 0);
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Goal name is required";
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }

    if (
      formData.linkedToBudget &&
      (!formData.budgetMonthlyAmount ||
        parseFloat(formData.budgetMonthlyAmount) <= 0)
    ) {
      newErrors.budgetMonthlyAmount =
        "Budget monthly amount must be greater than 0";
    }

    if (
      formData.linkedToBudget &&
      parseFloat(formData.budgetMonthlyAmount) > availableDiscretionary
    ) {
      newErrors.budgetMonthlyAmount = `Amount exceeds available discretionary income ($${availableDiscretionary.toLocaleString()})`;
    }

    // Validate linked accounts
    formData.linkedAccounts.forEach((linkedAcc, index) => {
      const allocation = accountAvailability.get(linkedAcc.accountId);
      if (!allocation) return;

      const requestedAmount = parseFloat(linkedAcc.allocatedAmount) || 0;

      if (requestedAmount <= 0) {
        newErrors[`linkedAccount_${index}`] =
          "Allocated amount must be greater than 0";
        return;
      }

      // Check available amounts based on goal type and account type
      if (allocation.account.category === "Cash") {
        if (requestedAmount > allocation.availableCash) {
          newErrors[
            `linkedAccount_${index}`
          ] = `Only $${allocation.availableCash.toLocaleString()} available in ${
            allocation.account.name
          }`;
        }
      } else if (allocation.account.category === "Investments") {
        if (formData.type === "investment") {
          // Investment goals can use entire account value
          if (requestedAmount > allocation.availableTotal) {
            newErrors[
              `linkedAccount_${index}`
            ] = `Only $${allocation.availableTotal.toLocaleString()} available in ${
              allocation.account.name
            }`;
          }
        } else {
          // Non-investment goals can only use cash portion
          if (requestedAmount > allocation.availableCash) {
            newErrors[
              `linkedAccount_${index}`
            ] = `Only $${allocation.availableCash.toLocaleString()} cash available in ${
              allocation.account.name
            } (non-investment goals can only use cash portion)`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showInfo("Please fix the errors before saving");
      return;
    }

    const currentAmount = calculateCurrentAmount();

    const goalData = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount) || 0,
      currentAmount,
      budgetMonthlyAmount: formData.linkedToBudget
        ? parseFloat(formData.budgetMonthlyAmount) || 0
        : 0,
      id: formData.id || `goal-${Date.now()}`,
    };

    console.log("Saving goal with data:", goalData);
    onSave(goalData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear related errors
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // If goal type changes, validate existing account links
    if (field === "type") {
      // Remove invalid account allocations when switching goal types
      setFormData((prev) => ({
        ...prev,
        linkedAccounts: prev.linkedAccounts.filter((linkedAcc) => {
          const allocation = accountAvailability.get(linkedAcc.accountId);
          if (!allocation) return false;

          const requestedAmount = parseFloat(linkedAcc.allocatedAmount) || 0;

          if (
            allocation.account.category === "Investments" &&
            value !== "investment"
          ) {
            // Check if amount exceeds cash portion
            return requestedAmount <= allocation.availableCash;
          }

          return true;
        }),
      }));
    }
  };

  // Handle linked account changes
  const handleLinkedAccountChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      linkedAccounts: prev.linkedAccounts.map((linkedAcc, i) =>
        i === index ? { ...linkedAcc, [field]: value } : linkedAcc
      ),
    }));
  };

  const addLinkedAccount = () => {
    setFormData((prev) => ({
      ...prev,
      linkedAccounts: [
        ...prev.linkedAccounts,
        {
          accountId: "",
          allocatedAmount: "",
        },
      ],
    }));
  };

  const removeLinkedAccount = (index) => {
    setFormData((prev) => ({
      ...prev,
      linkedAccounts: prev.linkedAccounts.filter((_, i) => i !== index),
    }));
  };

  const currentAmount = calculateCurrentAmount();

  // Filter accounts that can be used for funding based on goal type
  const getAvailableAccounts = () => {
    const available = [];

    accountAvailability.forEach((allocation, accountId) => {
      const { account, availableCash, availableTotal } = allocation;

      if (account.category === "Cash" && availableCash > 0) {
        available.push({
          ...account,
          availableAmount: availableCash,
          displayText: `${
            account.name
          } - $${availableCash.toLocaleString()} available`,
        });
      } else if (account.category === "Investments") {
        if (formData.type === "investment" && availableTotal > 0) {
          available.push({
            ...account,
            availableAmount: availableTotal,
            displayText: `${
              account.name
            } - $${availableTotal.toLocaleString()} available (total)`,
          });
        } else if (formData.type !== "investment" && availableCash > 0) {
          available.push({
            ...account,
            availableAmount: availableCash,
            displayText: `${
              account.name
            } - $${availableCash.toLocaleString()} cash available`,
          });
        }
      }
    });

    return available;
  };

  const availableAccounts = getAvailableAccounts();

  return (
    <form onSubmit={handleSubmit} className={goalsStyles.goalForm}>
      {/* Basic Goal Information */}
      <div className={goalsStyles.formRow}>
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Goal Name <span className={goalsStyles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`${goalsStyles.formInput} ${
              errors.name ? goalsStyles.error : ""
            }`}
            placeholder="Enter goal name"
          />
          {errors.name && (
            <div className={goalsStyles.errorText}>{errors.name}</div>
          )}
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Goal Type <span className={goalsStyles.required}>*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className={goalsStyles.formInput}
          >
            <option value="savings">Savings Goal</option>
            <option value="investment">Investment Goal</option>
            <option value="debt">Debt Payoff</option>
            <option value="emergency">Emergency Fund</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Target and Date */}
      <div className={goalsStyles.formRow}>
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Target Amount <span className={goalsStyles.required}>*</span>
          </label>
          <input
            type="number"
            value={formData.targetAmount}
            onChange={(e) => handleInputChange("targetAmount", e.target.value)}
            className={`${goalsStyles.formInput} ${
              errors.targetAmount ? goalsStyles.error : ""
            }`}
            placeholder="10000"
            step="0.01"
            min="0"
          />
          {errors.targetAmount && (
            <div className={goalsStyles.errorText}>{errors.targetAmount}</div>
          )}
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>Target Date</label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => handleInputChange("targetDate", e.target.value)}
            className={goalsStyles.formInput}
          />
        </div>
      </div>

      {/* Linked Accounts Section */}
      <div className={goalsStyles.fundingSection}>
        <h4 className={goalsStyles.sectionTitle}>Linked Accounts</h4>

        {formData.linkedAccounts.map((linkedAccount, index) => {
          const selectedAccount = availableAccounts.find(
            (acc) => acc.id === linkedAccount.accountId
          );

          return (
            <div key={index} className={goalsStyles.formRow}>
              <div className={goalsStyles.formGroup}>
                <label className={goalsStyles.formLabel}>Account</label>
                <select
                  value={linkedAccount.accountId}
                  onChange={(e) =>
                    handleLinkedAccountChange(
                      index,
                      "accountId",
                      e.target.value
                    )
                  }
                  className={goalsStyles.formInput}
                >
                  <option value="">Select Account</option>
                  {availableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.displayText}
                    </option>
                  ))}
                </select>
              </div>

              <div className={goalsStyles.formGroup}>
                <label className={goalsStyles.formLabel}>
                  Amount to Allocate
                  {selectedAccount && (
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontWeight: "normal",
                      }}
                    >
                      {" "}
                      (Max: ${selectedAccount.availableAmount.toLocaleString()})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={linkedAccount.allocatedAmount}
                  onChange={(e) =>
                    handleLinkedAccountChange(
                      index,
                      "allocatedAmount",
                      e.target.value
                    )
                  }
                  className={`${goalsStyles.formInput} ${
                    errors[`linkedAccount_${index}`] ? goalsStyles.error : ""
                  }`}
                  placeholder="Amount to allocate"
                  step="0.01"
                  min="0"
                  max={selectedAccount?.availableAmount || 0}
                />

                {errors[`linkedAccount_${index}`] && (
                  <div className={goalsStyles.errorText}>
                    {errors[`linkedAccount_${index}`]}
                  </div>
                )}
              </div>

              <div className={goalsStyles.formGroup}>
                <button
                  type="button"
                  onClick={() => removeLinkedAccount(index)}
                  className="btn-danger"
                  style={{ marginTop: "1.5rem" }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addLinkedAccount}
          className="btn-secondary"
          style={{ marginTop: "var(--space-sm)" }}
        >
          Add Account
        </button>

        {currentAmount > 0 && (
          <div
            style={{
              marginTop: "var(--space-sm)",
              padding: "var(--space-sm)",
              background: "var(--surface-dark)",
              borderRadius: "var(--border-radius-sm)",
            }}
          >
            <strong>
              Current Goal Amount: ${currentAmount.toLocaleString()}
            </strong>
            {formData.targetAmount && (
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "var(--font-size-xs)",
                }}
              >
                Progress:{" "}
                {(
                  (currentAmount / parseFloat(formData.targetAmount)) *
                  100
                ).toFixed(1)}
                %
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget Integration */}
      <div className={goalsStyles.fundingSection}>
        <h4 className={goalsStyles.sectionTitle}>Budget Integration</h4>

        <div className={goalsStyles.formRow}>
          <div className={goalsStyles.formGroup}>
            <label className={goalsStyles.radioLabel}>
              <input
                type="checkbox"
                checked={formData.linkedToBudget}
                onChange={(e) =>
                  handleInputChange("linkedToBudget", e.target.checked)
                }
              />
              Link to Monthly Budget
            </label>
            <div className={goalsStyles.helpText}>
              This will create a monthly expense in your budget for this goal
            </div>
          </div>

          {formData.linkedToBudget && (
            <div className={goalsStyles.formGroup}>
              <label className={goalsStyles.formLabel}>
                Monthly Budget Amount{" "}
                <span className={goalsStyles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMonthlyAmount}
                onChange={(e) =>
                  handleInputChange("budgetMonthlyAmount", e.target.value)
                }
                className={`${goalsStyles.formInput} ${
                  errors.budgetMonthlyAmount ? goalsStyles.error : ""
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={availableDiscretionary}
              />
              {errors.budgetMonthlyAmount && (
                <div className={goalsStyles.errorText}>
                  {errors.budgetMonthlyAmount}
                </div>
              )}
              <div className={goalsStyles.helpText}>
                Available discretionary income: $
                {availableDiscretionary.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className={goalsStyles.formActions}>
        <button type="submit" className="btn-primary">
          Save Goal
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
