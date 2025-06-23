// src/features/Dashboard/Apps/Plan/Goals/GoalForm.jsx
import React, { useState, useEffect } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import { useToast } from "../../../../../hooks/useToast"; // Add this import
import goalsStyles from "../goals.module.css";

const GoalForm = ({ goal, onSave, onCancel, availableDiscretionary }) => {
  const { data } = useFinancialData();
  const { showInfo, showSuccess } = useToast(); // Add useToast hook
  const { accounts, budget } = data;

  const [formData, setFormData] = useState({
    name: "",
    type: "savings",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    monthlyContribution: "",
    fundingAccountId: null, // FIXED: Initialize as null instead of empty string
    useEntireAccount: false,
    linkedAccountAmount: "",
    linkedToBudget: false,
    budgetMonthlyAmount: "",
    status: "active",
    ...goal,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (goal) {
      setFormData({
        name: "",
        type: "savings",
        targetAmount: "",
        currentAmount: "0",
        targetDate: "",
        monthlyContribution: "",
        fundingAccountId: null,
        useEntireAccount: false,
        linkedAccountAmount: "",
        linkedToBudget: false,
        budgetMonthlyAmount: "",
        status: "active",
        ...goal,
        // FIXED: Properly handle existing goal data
        currentAmount:
          goal.currentAmount !== undefined
            ? // For existing goals with linked accounts, show the manual contribution amount
              (
                (goal.currentAmount || 0) - (goal.linkedAccountAmount || 0)
              ).toString()
            : "0",
        targetAmount:
          goal.targetAmount !== undefined ? goal.targetAmount.toString() : "",
        linkedAccountAmount:
          goal.linkedAccountAmount !== undefined
            ? goal.linkedAccountAmount.toString()
            : "",
        budgetMonthlyAmount:
          goal.budgetMonthlyAmount !== undefined
            ? goal.budgetMonthlyAmount.toString()
            : "",
        fundingAccountId: goal.fundingAccountId || null,
      });
    }
  }, [goal]);

  // Calculate fundingAccount based on selected account ID
  const fundingAccount = accounts?.find(
    (acc) => acc.id === formData.fundingAccountId
  );

  const validateForm = () => {
    const errors = {};

    // Name is required
    if (!formData.name || !formData.name.trim()) {
      errors.name = "Goal name is required";
    }

    // Goal type is required
    if (!formData.type) {
      errors.type = "Goal type is required";
    }

    // Target amount is required (removed optional)
    if (!formData.targetAmount) {
      errors.targetAmount = "Target amount is required";
    } else {
      const targetAmount = parseFloat(formData.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        errors.targetAmount =
          "Target amount must be a valid number greater than 0";
      }
    }

    // Current amount validation - can be any non-negative number
    if (formData.currentAmount) {
      const currentAmount = parseFloat(formData.currentAmount);
      if (isNaN(currentAmount) || currentAmount < 0) {
        errors.currentAmount =
          "Current amount must be a valid number 0 or greater";
      }
    }

    // Target date is optional - only validate if provided
    if (formData.targetDate) {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      if (isNaN(targetDate.getTime())) {
        errors.targetDate = "Please enter a valid date";
      } else if (targetDate <= today) {
        errors.targetDate = "Target date must be in the future";
      }
    }

    // Validate linked account amount if account is selected
    if (formData.fundingAccountId && fundingAccount) {
      if (formData.linkedAccountAmount) {
        const linkedAmount = parseFloat(formData.linkedAccountAmount);
        if (isNaN(linkedAmount) || linkedAmount <= 0) {
          errors.linkedAccountAmount =
            "Linked amount must be a valid number greater than 0";
        } else if (linkedAmount > Math.abs(fundingAccount.value)) {
          errors.linkedAccountAmount = "Cannot link more than account balance";
        }
      }
    }

    // Validate budget allocation - only if enabled
    if (formData.linkedToBudget && formData.budgetMonthlyAmount) {
      const budgetAmount = parseFloat(formData.budgetMonthlyAmount);
      if (isNaN(budgetAmount) || budgetAmount <= 0) {
        errors.budgetMonthlyAmount =
          "Budget amount must be a valid number greater than 0";
      } else if (budgetAmount > availableDiscretionary) {
        errors.budgetMonthlyAmount =
          "Amount exceeds available discretionary income";
      }
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateMonthlyNeeded = () => {
    // Only calculate if we have both target amount and target date
    if (!formData.targetAmount || !formData.targetDate) {
      return null;
    }

    const targetDate = new Date(formData.targetDate);
    const today = new Date();
    const monthsToTarget = Math.max(
      1,
      (targetDate.getFullYear() - today.getFullYear()) * 12 +
        (targetDate.getMonth() - today.getMonth())
    );

    const targetAmount = parseFloat(formData.targetAmount) || 0;
    const currentAmount = parseFloat(formData.currentAmount) || 0;
    const remaining = targetAmount - currentAmount;
    return remaining > 0 ? remaining / monthsToTarget : 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // FIXED: Track changes for notifications
      const isNewGoal = !goal;
      const oldBudgetAmount = goal?.budgetMonthlyAmount || 0;
      const newBudgetAmount = formData.linkedToBudget
        ? parseFloat(formData.budgetMonthlyAmount) || 0
        : 0;
      const oldLinkedToBudget = goal?.linkedToBudget || false;
      const newLinkedToBudget = formData.linkedToBudget;

      // Calculate monthly contribution correctly
      let monthlyContribution = 0;

      // If linked to budget, use the budget amount as monthly contribution
      if (formData.linkedToBudget && formData.budgetMonthlyAmount) {
        monthlyContribution = parseFloat(formData.budgetMonthlyAmount) || 0;
      }

      // Calculate total current amount correctly - don't double-add linked amounts
      let finalCurrentAmount = parseFloat(formData.currentAmount) || 0;

      // Only add linked account amount if this is a NEW goal or if the linked amount changed
      if (formData.fundingAccountId && formData.linkedAccountAmount) {
        const linkedAmount = parseFloat(formData.linkedAccountAmount) || 0;

        // If editing existing goal, check if linked account amount changed
        if (goal) {
          const existingLinkedAmount = goal.linkedAccountAmount || 0;
          const currentAmountWithoutLinked =
            (goal.currentAmount || 0) - existingLinkedAmount;
          finalCurrentAmount = currentAmountWithoutLinked + linkedAmount;
        } else {
          // New goal - add linked amount to current amount
          finalCurrentAmount += linkedAmount;
        }
      }

      // Ensure all numeric fields are properly converted
      const goalData = {
        ...formData,
        id: goal?.id || `goal-${Date.now()}`,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: finalCurrentAmount,
        monthlyContribution: monthlyContribution,
        linkedAccountAmount: formData.linkedAccountAmount
          ? parseFloat(formData.linkedAccountAmount)
          : 0,
        budgetMonthlyAmount: formData.budgetMonthlyAmount
          ? parseFloat(formData.budgetMonthlyAmount)
          : 0,
        budgetSyncNeeded: formData.linkedToBudget && monthlyContribution > 0,
      };

      // FIXED: Show detailed notifications for budget allocation changes
      if (isNewGoal) {
        if (newBudgetAmount > 0) {
          showSuccess(`🎯 Goal "${formData.name}" created successfully!`);
          showInfo(
            `💰 Budget Integration:\n• Monthly allocation: $${newBudgetAmount}\n• This will appear as "${formData.name} (Goal)" in your budget expenses.`
          );
        } else {
          showSuccess(`🎯 Goal "${formData.name}" created successfully!`);
        }
      } else {
        // Existing goal updates
        if (!oldLinkedToBudget && newLinkedToBudget && newBudgetAmount > 0) {
          showSuccess(`🎯 Goal "${formData.name}" updated successfully!`);
          showInfo(
            `🔗 Budget Link Created:\n• Goal is now linked to your budget\n• Monthly allocation: $${newBudgetAmount}\n• A new expense has been added to your budget.`
          );
        } else if (oldLinkedToBudget && !newLinkedToBudget) {
          showSuccess(`🎯 Goal "${formData.name}" updated successfully!`);
          showInfo(
            `🔓 Budget Link Removed:\n• Goal is no longer linked to your budget\n• The $${oldBudgetAmount}/month expense has been removed from your budget.`
          );
        } else if (
          oldLinkedToBudget &&
          newLinkedToBudget &&
          oldBudgetAmount !== newBudgetAmount
        ) {
          showSuccess(`🎯 Goal "${formData.name}" updated successfully!`);
          showInfo(
            `💱 Budget Allocation Changed:\n• Old allocation: $${oldBudgetAmount}/month\n• New allocation: $${newBudgetAmount}/month\n• Your budget expense has been updated.`
          );
        } else {
          showSuccess(`🎯 Goal "${formData.name}" updated successfully!`);
        }
      }

      console.log("Saving goal with data:", goalData); // Debug log
      onSave(goalData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const monthlyNeeded = calculateMonthlyNeeded();

  // Filter accounts that can be used for funding (Cash and Investments with positive values)
  const fundingAccounts =
    accounts?.filter(
      (acc) =>
        (acc.category === "Cash" || acc.category === "Investments") &&
        acc.value > 0
    ) || [];

  return (
    <form onSubmit={handleSubmit} className={goalsStyles.goalForm}>
      <div className={goalsStyles.formRow}>
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Goal Name <span className={goalsStyles.required}>*</span>
          </label>
          <input
            type="text"
            className={`${goalsStyles.formInput} ${
              errors.name ? goalsStyles.error : ""
            }`}
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Emergency Fund"
          />
          {errors.name && (
            <span className={goalsStyles.errorText}>{errors.name}</span>
          )}
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Goal Type <span className={goalsStyles.required}>*</span>
          </label>
          <select
            className={`${goalsStyles.formInput} ${
              errors.type ? goalsStyles.error : ""
            }`}
            value={formData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
          >
            <option value="savings">Savings</option>
            <option value="debt-payoff">Debt Payoff</option>
            <option value="investment">Investment</option>
            <option value="purchase">Major Purchase</option>
            <option value="other">Other</option>
          </select>
          {errors.type && (
            <span className={goalsStyles.errorText}>{errors.type}</span>
          )}
        </div>
      </div>

      <div className={goalsStyles.formRow}>
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Target Amount <span className={goalsStyles.required}>*</span>
          </label>
          <input
            type="number"
            className={`${goalsStyles.formInput} ${
              errors.targetAmount ? goalsStyles.error : ""
            }`}
            value={formData.targetAmount}
            onChange={(e) => handleInputChange("targetAmount", e.target.value)}
            placeholder="10000"
            step="1"
            min="0"
          />
          {errors.targetAmount && (
            <span className={goalsStyles.errorText}>{errors.targetAmount}</span>
          )}
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>Current Amount</label>
          <input
            type="number"
            className={`${goalsStyles.formInput} ${
              errors.currentAmount ? goalsStyles.error : ""
            }`}
            value={formData.currentAmount}
            onChange={(e) => handleInputChange("currentAmount", e.target.value)}
            placeholder="0"
            step="1"
            min="0"
          />
          {errors.currentAmount && (
            <span className={goalsStyles.errorText}>
              {errors.currentAmount}
            </span>
          )}
          <div className={goalsStyles.helpText}>
            Amount you currently have saved for this goal (defaults to $0)
          </div>
        </div>
      </div>

      <div className={goalsStyles.formRow}>
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>
            Target Date{" "}
            <span
              style={{ color: "var(--text-secondary)", fontWeight: "normal" }}
            >
              (Optional)
            </span>
          </label>
          <input
            type="date"
            className={`${goalsStyles.formInput} ${
              errors.targetDate ? goalsStyles.error : ""
            }`}
            value={formData.targetDate}
            onChange={(e) => handleInputChange("targetDate", e.target.value)}
          />
          {errors.targetDate && (
            <span className={goalsStyles.errorText}>{errors.targetDate}</span>
          )}
          <div className={goalsStyles.helpText}>
            Setting a target date enables progress tracking and completion
            timeline calculations.
          </div>
        </div>

        {/* Show monthly needed calculation if both target amount and date are provided */}
        {monthlyNeeded !== null && (
          <div className={goalsStyles.formGroup}>
            <label className={goalsStyles.formLabel}>Monthly Needed</label>
            <div
              className={goalsStyles.formInput}
              style={{
                background: "var(--surface-dark)",
                color: "var(--color-primary)",
                fontWeight: "var(--font-weight-semibold)",
                border: "2px solid var(--color-primary)",
              }}
            >
              ${monthlyNeeded.toFixed(2)}
            </div>
            <div className={goalsStyles.helpText}>
              Amount needed monthly to reach your goal by the target date
            </div>
          </div>
        )}
      </div>

      {/* Funding Options */}
      <div className={goalsStyles.fundingSection}>
        <h4 className={goalsStyles.sectionTitle}>Funding Options</h4>

        {/* Link to Account */}
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.radioLabel}>
            <input
              type="checkbox"
              checked={!!formData.fundingAccountId}
              onChange={(e) => {
                if (e.target.checked) {
                  // When checking the box, don't set an account yet - let user select
                  // Just ensure we show the dropdown by not clearing fundingAccountId
                  // If it's empty, set it to empty string to trigger dropdown visibility
                  if (!formData.fundingAccountId) {
                    handleInputChange("fundingAccountId", ""); // Empty string triggers dropdown
                  }
                } else {
                  // When unchecking, clear everything
                  handleInputChange("fundingAccountId", "");
                  handleInputChange("linkedAccountAmount", "");
                  handleInputChange("useEntireAccount", false);
                }
              }}
            />
            Link to existing account
          </label>

          {/* FIXED: Show dropdown when checkbox is checked (fundingAccountId is not null/undefined) */}
          {formData.fundingAccountId !== null &&
            formData.fundingAccountId !== undefined && (
              <>
                <select
                  className={goalsStyles.formInput}
                  value={formData.fundingAccountId}
                  onChange={(e) => {
                    handleInputChange("fundingAccountId", e.target.value);
                    // Reset related fields when changing accounts
                    handleInputChange("linkedAccountAmount", "");
                    handleInputChange("useEntireAccount", false);
                  }}
                >
                  <option value="">Select Account</option>
                  {fundingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ${account.value.toLocaleString()}
                    </option>
                  ))}
                </select>

                {fundingAccount && (
                  <>
                    <div className={goalsStyles.formGroup}>
                      <label className={goalsStyles.radioLabel}>
                        <input
                          type="checkbox"
                          checked={formData.useEntireAccount}
                          onChange={(e) => {
                            handleInputChange(
                              "useEntireAccount",
                              e.target.checked
                            );
                            if (e.target.checked) {
                              handleInputChange(
                                "linkedAccountAmount",
                                fundingAccount.value.toString()
                              );
                            } else {
                              handleInputChange("linkedAccountAmount", "");
                            }
                          }}
                        />
                        Use entire account balance ($
                        {fundingAccount.value.toLocaleString()})
                      </label>
                    </div>

                    {!formData.useEntireAccount && (
                      <div className={goalsStyles.formGroup}>
                        <label className={goalsStyles.formLabel}>
                          Amount to Link
                        </label>
                        <input
                          type="number"
                          className={`${goalsStyles.formInput} ${
                            errors.linkedAccountAmount ? goalsStyles.error : ""
                          }`}
                          value={formData.linkedAccountAmount}
                          onChange={(e) =>
                            handleInputChange(
                              "linkedAccountAmount",
                              e.target.value
                            )
                          }
                          placeholder="0"
                          step="1"
                          min="0"
                          max={fundingAccount.value}
                        />
                        {errors.linkedAccountAmount && (
                          <span className={goalsStyles.errorText}>
                            {errors.linkedAccountAmount}
                          </span>
                        )}
                        <div className={goalsStyles.helpText}>
                          Maximum: ${fundingAccount.value.toLocaleString()}
                          {formData.linkedAccountAmount && (
                            <div
                              style={{
                                marginTop: "var(--space-xxs)",
                                color: "var(--color-primary)",
                              }}
                            >
                              $
                              {parseFloat(
                                formData.linkedAccountAmount || 0
                              ).toLocaleString()}{" "}
                              will be added to your current goal amount
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
        </div>

        {/* Link to Budget */}
        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.radioLabel}>
            <input
              type="checkbox"
              checked={formData.linkedToBudget}
              onChange={(e) => {
                handleInputChange("linkedToBudget", e.target.checked);
                if (!e.target.checked) {
                  handleInputChange("budgetMonthlyAmount", "");
                }
              }}
            />
            Allocate from monthly budget
          </label>

          {formData.linkedToBudget && (
            <div className={goalsStyles.formGroup}>
              <label className={goalsStyles.formLabel}>
                Monthly Budget Allocation
              </label>
              <input
                type="number"
                className={`${goalsStyles.formInput} ${
                  errors.budgetMonthlyAmount ? goalsStyles.error : ""
                }`}
                value={formData.budgetMonthlyAmount}
                onChange={(e) =>
                  handleInputChange("budgetMonthlyAmount", e.target.value)
                }
                placeholder="0"
                step="1"
                min="0"
                max={availableDiscretionary}
              />
              {errors.budgetMonthlyAmount && (
                <span className={goalsStyles.errorText}>
                  {errors.budgetMonthlyAmount}
                </span>
              )}
              <div className={goalsStyles.helpText}>
                Available discretionary income: $
                {availableDiscretionary.toLocaleString()}
                {formData.budgetMonthlyAmount && (
                  <div
                    style={{
                      marginTop: "var(--space-xxs)",
                      color: "var(--color-primary)",
                    }}
                  >
                    This amount will be used as your monthly contribution toward
                    this goal
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={goalsStyles.formActions}>
        <button type="submit" className="btn-primary">
          {goal ? "Update Goal" : "Create Goal"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
