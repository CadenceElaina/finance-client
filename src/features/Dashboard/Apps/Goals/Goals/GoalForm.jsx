// src/features/Dashboard/Apps/Plan/Goals/GoalForm.jsx
import React, { useState, useEffect } from "react";
import Button from "../../../../../components/ui/Button/Button";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import goalsStyles from "../goals.module.css";

const GoalForm = ({ goal, onSave, onCancel, availableDiscretionary }) => {
  const { data } = useFinancialData();
  const { accounts, budget } = data;

  const [formData, setFormData] = useState({
    name: "",
    type: "savings",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    monthlyContribution: "",

    // Multiple funding sources
    fundingAccountId: "",
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
        ...goal,
        // Convert old single funding type to new multi-source format
        budgetMonthlyAmount: goal.linkedToBudget
          ? goal.monthlyContribution || ""
          : "",
      });
    }
  }, [goal]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Goal name is required";
    }

    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }

    if (formData.currentAmount < 0) {
      newErrors.currentAmount = "Current amount cannot be negative";
    }

    if (formData.currentAmount > formData.targetAmount) {
      newErrors.currentAmount = "Current amount cannot exceed target amount";
    }

    // Check if at least one funding source is selected
    const hasAccountFunding = formData.fundingAccountId;
    const hasBudgetFunding =
      formData.linkedToBudget && formData.budgetMonthlyAmount > 0;
    const hasStartingAmount = formData.currentAmount > 0;

    if (!hasAccountFunding && !hasBudgetFunding && !hasStartingAmount) {
      newErrors.funding =
        "Please select at least one funding source or provide a starting amount";
    }

    // Validate budget allocation if selected
    if (formData.linkedToBudget) {
      if (!formData.budgetMonthlyAmount || formData.budgetMonthlyAmount <= 0) {
        newErrors.budgetMonthlyAmount =
          "Monthly budget amount is required when linking to budget";
      } else {
        const requestedAmount = parseFloat(formData.budgetMonthlyAmount) || 0;

        // Calculate existing budget allocation for this goal (if editing)
        const existingAllocation = goal?.linkedToBudget
          ? parseFloat(goal.monthlyContribution) || 0
          : 0;

        // Check against available discretionary plus any existing allocation
        const availableForThisGoal =
          availableDiscretionary + existingAllocation;

        if (requestedAmount > availableForThisGoal) {
          newErrors.budgetMonthlyAmount = `Insufficient budget. Available: $${availableForThisGoal.toLocaleString()}`;
        }
      }
    }

    // Validate account linking if selected
    if (formData.fundingAccountId && !formData.useEntireAccount) {
      if (!formData.linkedAccountAmount || formData.linkedAccountAmount <= 0) {
        newErrors.linkedAccountAmount =
          "Account amount is required when linking partial account balance";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Calculate total monthly contribution from all sources
    let totalMonthlyContribution = 0;

    if (formData.linkedToBudget && formData.budgetMonthlyAmount) {
      totalMonthlyContribution += parseFloat(formData.budgetMonthlyAmount) || 0;
    }

    const goalData = {
      ...formData,
      id: goal?.id || `goal-${Date.now()}`,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      monthlyContribution: totalMonthlyContribution,
      budgetMonthlyAmount: formData.linkedToBudget
        ? parseFloat(formData.budgetMonthlyAmount) || 0
        : 0,
      linkedAccountAmount:
        formData.fundingAccountId && !formData.useEntireAccount
          ? parseFloat(formData.linkedAccountAmount) || 0
          : 0,

      // Clean up fields
      fundingAccountId: formData.fundingAccountId || null,
      useEntireAccount: formData.fundingAccountId
        ? formData.useEntireAccount
        : false,
      linkedToBudget: formData.linkedToBudget,
      budgetExpenseId: formData.linkedToBudget
        ? formData.budgetExpenseId || null
        : null,

      lastModified: new Date().toISOString().split("T")[0],
      createdDate: goal?.createdDate || new Date().toISOString().split("T")[0],
    };

    onSave(goalData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear related errors
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (
      field === "linkedToBudget" ||
      field === "fundingAccountId" ||
      field === "currentAmount"
    ) {
      if (errors.funding) {
        setErrors((prev) => ({ ...prev, funding: null }));
      }
    }
  };

  const calculateMonthlyNeeded = () => {
    const target = parseFloat(formData.targetAmount) || 0;
    const current = parseFloat(formData.currentAmount) || 0;
    const remaining = target - current;

    if (!formData.targetDate || remaining <= 0) return 0;

    const targetDate = new Date(formData.targetDate);
    const now = new Date();
    const monthsLeft = Math.max(
      1,
      Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24 * 30))
    );

    return remaining / monthsLeft;
  };

  const monthlyNeeded = calculateMonthlyNeeded();

  return (
    <form onSubmit={handleSubmit} className={goalsStyles.goalForm}>
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
            placeholder="e.g., Emergency Fund, Vacation, Car Down Payment"
          />
          {errors.name && (
            <span className={goalsStyles.errorText}>{errors.name}</span>
          )}
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>Goal Type</label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className={goalsStyles.formInput}
          >
            <option value="savings">Savings</option>
            <option value="debt">Debt Payoff</option>
            <option value="investment">Investment</option>
            <option value="purchase">Large Purchase</option>
            <option value="retirement">Retirement</option>
            <option value="emergency">Emergency Fund</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

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
            min="0"
            step="0.01"
            placeholder="10000"
          />
          {errors.targetAmount && (
            <span className={goalsStyles.errorText}>{errors.targetAmount}</span>
          )}
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>Starting Amount</label>
          <input
            type="number"
            value={formData.currentAmount}
            onChange={(e) => handleInputChange("currentAmount", e.target.value)}
            className={`${goalsStyles.formInput} ${
              errors.currentAmount ? goalsStyles.error : ""
            }`}
            min="0"
            step="0.01"
            placeholder="0"
          />
          {errors.currentAmount && (
            <span className={goalsStyles.errorText}>
              {errors.currentAmount}
            </span>
          )}
          <div className={goalsStyles.helpText}>
            Any amount you already have saved toward this goal
          </div>
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>Target Date</label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => handleInputChange("targetDate", e.target.value)}
            className={goalsStyles.formInput}
            min={new Date().toISOString().split("T")[0]}
          />
          {monthlyNeeded > 0 && (
            <div className={goalsStyles.helpText}>
              Need ${monthlyNeeded.toFixed(2)}/month to reach goal by target
              date
            </div>
          )}
        </div>
      </div>

      {/* General funding error */}
      {errors.funding && (
        <div
          className={goalsStyles.errorText}
          style={{ marginBottom: "var(--space-sm)" }}
        >
          {errors.funding}
        </div>
      )}

      {/* Account Linking Section */}
      <fieldset className={goalsStyles.fundingSection}>
        <legend className={goalsStyles.sectionTitle}>
          Account Linking (Optional)
        </legend>
        <div
          className={goalsStyles.helpText}
          style={{ marginBottom: "var(--space-sm)" }}
        >
          Link this goal to an existing account balance to track progress
          automatically
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.formLabel}>Link to Account</label>
          <select
            value={formData.fundingAccountId}
            onChange={(e) =>
              handleInputChange("fundingAccountId", e.target.value)
            }
            className={`${goalsStyles.formInput} ${
              errors.fundingAccountId ? goalsStyles.error : ""
            }`}
          >
            <option value="">No account linking</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} (${account.value?.toLocaleString() || 0})
              </option>
            ))}
          </select>
          {errors.fundingAccountId && (
            <span className={goalsStyles.errorText}>
              {errors.fundingAccountId}
            </span>
          )}
        </div>

        {formData.fundingAccountId && (
          <>
            <div className={goalsStyles.formGroup}>
              <label className={goalsStyles.radioLabel}>
                <input
                  type="checkbox"
                  checked={formData.useEntireAccount}
                  onChange={(e) =>
                    handleInputChange("useEntireAccount", e.target.checked)
                  }
                />
                <span>Use entire account balance for this goal</span>
              </label>
            </div>

            {!formData.useEntireAccount && (
              <div className={goalsStyles.formGroup}>
                <label className={goalsStyles.formLabel}>
                  Amount from Account
                </label>
                <input
                  type="number"
                  value={formData.linkedAccountAmount}
                  onChange={(e) =>
                    handleInputChange("linkedAccountAmount", e.target.value)
                  }
                  className={`${goalsStyles.formInput} ${
                    errors.linkedAccountAmount ? goalsStyles.error : ""
                  }`}
                  min="0"
                  step="0.01"
                  placeholder="5000"
                />
                {errors.linkedAccountAmount && (
                  <span className={goalsStyles.errorText}>
                    {errors.linkedAccountAmount}
                  </span>
                )}
                <div className={goalsStyles.helpText}>
                  How much of the account balance should count toward this goal
                </div>
              </div>
            )}
          </>
        )}
      </fieldset>

      {/* Monthly Budget Contribution Section */}
      <fieldset className={goalsStyles.fundingSection}>
        <legend className={goalsStyles.sectionTitle}>
          Monthly Budget Allocation (Optional)
        </legend>
        <div
          className={goalsStyles.helpText}
          style={{ marginBottom: "var(--space-sm)" }}
        >
          Add a monthly contribution to your budget to systematically save
          toward this goal
        </div>

        <div className={goalsStyles.formGroup}>
          <label className={goalsStyles.radioLabel}>
            <input
              type="checkbox"
              checked={formData.linkedToBudget}
              onChange={(e) =>
                handleInputChange("linkedToBudget", e.target.checked)
              }
            />
            <span>Add monthly contribution to budget</span>
          </label>
        </div>

        {formData.linkedToBudget && (
          <div className={goalsStyles.formGroup}>
            <label className={goalsStyles.formLabel}>
              Monthly Budget Allocation{" "}
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
              min="0"
              step="0.01"
              placeholder="500"
            />
            {errors.budgetMonthlyAmount && (
              <span className={goalsStyles.errorText}>
                {errors.budgetMonthlyAmount}
              </span>
            )}
            <div className={goalsStyles.helpText}>
              Available discretionary income: $
              {(
                availableDiscretionary +
                (goal?.linkedToBudget
                  ? parseFloat(goal.monthlyContribution) || 0
                  : 0)
              ).toLocaleString()}
            </div>
          </div>
        )}
      </fieldset>

      <div className={goalsStyles.formActions}>
        <Button type="button" onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {goal ? "Update Goal" : "Create Goal"}
        </Button>
      </div>
    </form>
  );
};

export default GoalForm;
