// src/utils/planCalculations.js
export const calculatePlanProgress = (plan, goals, accounts) => {
  if (!plan || !plan.milestones || plan.milestones.length === 0) {
    return 0;
  }

  let totalTarget = 0;
  let totalCurrent = 0;

  plan.milestones.forEach((milestone) => {
    totalTarget += milestone.targetAmount;
    let currentValue = 0;

    if (milestone.linkedSource?.type === "goal") {
      const goal = goals.find((g) => g.id === milestone.linkedSource.id);
      if (goal) {
        currentValue = goal.currentAmount;
      }
    } else if (milestone.linkedSource?.type === "account") {
      const account = accounts.find((a) => a.id === milestone.linkedSource.id);
      if (account) {
        // Handle debt accounts where the goal is to reach 0
        if (account.category === "Debt") {
          // Progress for a debt milestone is the amount paid off
          currentValue = milestone.targetAmount - Math.abs(account.value);
        } else {
          currentValue = account.value;
        }
      }
    } else if (milestone.linkedSource?.type === "manual") {
      currentValue = milestone.currentAmount || 0;
    }
    
    totalCurrent += currentValue;
  });

  if (totalTarget === 0) {
    return 0;
  }

  return (totalCurrent / totalTarget) * 100;
};