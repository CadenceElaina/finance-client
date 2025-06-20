// src/features/Dashboard/Apps/Plan/utils/goalCalculations.js
export const calculateProgress = (goal) => {
  if (!goal || !goal.targetAmount) return 0;
  const progress = goal.targetAmount > 0 
    ? (goal.currentAmount / goal.targetAmount) * 100 
    : 0;
  return Math.min(progress, 100); // Cap at 100%
};

export const calculateTimeToGoal = (goal) => {
  if (!goal || !goal.monthlyContribution || goal.monthlyContribution <= 0) {
    return "Set monthly contribution";
  }
  
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  if (remaining <= 0) {
    return "Goal reached!";
  }
  
  const months = Math.ceil(remaining / goal.monthlyContribution);
  
  if (months <= 12) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  
  return `${years}y ${remainingMonths}m`;
};

export const calculateMonthlyNeeded = (goal, targetDate) => {
  if (!goal || !targetDate) return 0;
  
  const target = parseFloat(goal.targetAmount) || 0;
  const current = parseFloat(goal.currentAmount) || 0;
  const remaining = target - current;
  
  if (remaining <= 0) return 0;
  
  const targetDateObj = new Date(targetDate);
  const now = new Date();
  const monthsLeft = Math.max(1, Math.ceil((targetDateObj - now) / (1000 * 60 * 60 * 24 * 30)));
  
  return remaining / monthsLeft;
};

export const calculateGoalCompletion = (goal) => {
  const progress = calculateProgress(goal);
  
  return {
    isComplete: progress >= 100 || goal.status === "completed",
    isNearComplete: progress >= 95 && progress < 100,
    progressPercent: progress,
    remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
    timeToGoal: calculateTimeToGoal(goal)
  };
};

export const validateGoalData = (goalData) => {
  const errors = {};
  
  if (!goalData.name || goalData.name.trim() === '') {
    errors.name = 'Goal name is required';
  }
  
  if (!goalData.targetAmount || goalData.targetAmount <= 0) {
    errors.targetAmount = 'Target amount must be greater than 0';
  }
  
  if (goalData.currentAmount < 0) {
    errors.currentAmount = 'Current amount cannot be negative';
  }
  
  if (goalData.currentAmount > goalData.targetAmount) {
    errors.currentAmount = 'Current amount cannot exceed target amount';
  }
  
  if (goalData.fundingType === 'manual' && (!goalData.manualContributionAmount || goalData.manualContributionAmount <= 0)) {
    errors.manualContributionAmount = 'Manual contribution amount is required';
  }
  
  if (goalData.fundingType === 'account' && !goalData.fundingAccountId) {
    errors.fundingAccountId = 'Please select a funding account';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatGoalCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getGoalPriorityLabel = (priority) => {
  const labels = {
    1: 'High',
    2: 'Medium-High', 
    3: 'Medium',
    4: 'Medium-Low',
    5: 'Low'
  };
  return labels[priority] || 'Medium';
};

export const sortGoalsByPriority = (goals) => {
  return [...goals].sort((a, b) => {
    // First sort by status (active goals first)
    if (a.status !== b.status) {
      if (a.status === 'active') return -1;
      if (b.status === 'active') return 1;
      if (a.status === 'paused') return -1;
      if (b.status === 'paused') return 1;
    }
    
    // Then by priority (lower number = higher priority)
    const aPriority = a.priority || 3;
    const bPriority = b.priority || 3;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Finally by progress (higher progress first)
    const aProgress = calculateProgress(a);
    const bProgress = calculateProgress(b);
    return bProgress - aProgress;
  });
};