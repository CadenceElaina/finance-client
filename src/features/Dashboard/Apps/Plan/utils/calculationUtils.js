// src/features/Dashboard/Apps/Plan/utils/calculationUtils.js

export const calculateProgress = (goal) => {
  if (!goal || !goal.targetAmount || goal.targetAmount <= 0) {
    return 0;
  }
  
  const progress = goal.targetAmount > 0 
    ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 
    : 0;
  return Math.min(progress, 100);
};

export const calculateTimeToGoal = (goal) => {
  if (!goal || !goal.targetAmount || !goal.targetDate) {
    return null;
  }
  
  if (!goal.monthlyContribution || goal.monthlyContribution <= 0) {
    return "Set monthly contribution";
  }
  
  const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
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

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateCompoundGrowth = (principal, monthlyContribution, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;
  let amount = principal;
  const projections = [];

  for (let month = 0; month <= months; month++) {
    if (month > 0) {
      amount = amount * (1 + monthlyRate) + monthlyContribution;
    }
    
    projections.push({
      month,
      amount,
      contributions: principal + (monthlyContribution * month),
      interest: amount - principal - (monthlyContribution * month)
    });
  }

  return projections;
};