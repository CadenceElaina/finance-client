/**
 * Debt calculation utilities for payoff projections, interest calculations, and amortization
 */

/**
 * Calculate monthly payment for a debt given principal, rate, and term
 */
export const calculateMonthlyPayment = (principal, annualRate, termMonths) => {
  if (annualRate === 0) return principal / termMonths;
  
  const monthlyRate = annualRate / 12 / 100;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return payment;
};

/**
 * Calculate payoff timeline for a debt
 */
export const calculatePayoffTimeline = (balance, annualRate, monthlyPayment, compoundingFrequency = 12) => {
  if (monthlyPayment <= 0 || balance <= 0) return null;
  
  const periodsPerYear = compoundingFrequency;
  const periodRate = annualRate / periodsPerYear / 100;
  const paymentsPerPeriod = 12 / periodsPerYear;
  
  let currentBalance = balance;
  let totalInterest = 0;
  let months = 0;
  const paymentHistory = [];
  
  while (currentBalance > 0.01 && months < 600) { // Max 50 years
    const interestPayment = currentBalance * periodRate * paymentsPerPeriod;
    const principalPayment = Math.min(monthlyPayment - interestPayment, currentBalance);
    
    if (principalPayment <= 0) {
      // Payment doesn't cover interest - debt will never be paid off
      return null;
    }
    
    currentBalance -= principalPayment;
    totalInterest += interestPayment;
    months++;
    
    paymentHistory.push({
      month: months,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: currentBalance
    });
  }
  
  return {
    months,
    years: Math.round((months / 12) * 10) / 10,
    totalInterest,
    totalPaid: balance + totalInterest,
    paymentHistory
  };
};

/**
 * Generate amortization schedule
 */
export const generateAmortizationSchedule = (balance, annualRate, monthlyPayment, compoundingFrequency = 12) => {
  const timeline = calculatePayoffTimeline(balance, annualRate, monthlyPayment, compoundingFrequency);
  if (!timeline) return [];
  
  return timeline.paymentHistory;
};

/**
 * Calculate total interest saved by making extra payments
 */
export const calculateInterestSavings = (balance, annualRate, currentPayment, newPayment, compoundingFrequency = 12) => {
  const currentTimeline = calculatePayoffTimeline(balance, annualRate, currentPayment, compoundingFrequency);
  const newTimeline = calculatePayoffTimeline(balance, annualRate, newPayment, compoundingFrequency);
  
  if (!currentTimeline || !newTimeline) return null;
  
  return {
    interestSaved: currentTimeline.totalInterest - newTimeline.totalInterest,
    timeSaved: currentTimeline.months - newTimeline.months,
    currentPayoff: currentTimeline,
    newPayoff: newTimeline
  };
};

/**
 * Calculate debt urgency score based on various factors
 */
export const calculateDebtUrgency = (debt) => {
  let score = 0;
  const { interestRate, value: balance, monthlyPayment, subType } = debt;
  
  // Interest rate factor (0-40 points)
  if (interestRate > 25) score += 40;
  else if (interestRate > 20) score += 35;
  else if (interestRate > 15) score += 30;
  else if (interestRate > 10) score += 20;
  else if (interestRate > 5) score += 10;
  else score += 5;
  
  // Balance factor (0-25 points)
  if (balance > 50000) score += 25;
  else if (balance > 25000) score += 20;
  else if (balance > 10000) score += 15;
  else if (balance > 5000) score += 10;
  else score += 5;
  
  // Debt type factor (0-20 points)
  const highPriorityTypes = ['Credit Card', 'Personal Loan', 'Payday Loan'];
  const mediumPriorityTypes = ['Auto Loan', 'Student Loan'];
  
  if (highPriorityTypes.includes(subType)) score += 20;
  else if (mediumPriorityTypes.includes(subType)) score += 10;
  else score += 5; // Mortgage, etc.
  
  // Payment to balance ratio (0-15 points)
  const paymentRatio = (monthlyPayment / balance) * 100;
  if (paymentRatio < 1) score += 15; // Very slow payoff
  else if (paymentRatio < 2) score += 10;
  else if (paymentRatio < 5) score += 5;
  else score += 0;
  
  return Math.min(score, 100); // Cap at 100
};

/**
 * Calculate debt-to-income ratio
 */
export const calculateDebtToIncomeRatio = (totalMonthlyDebtPayments, monthlyIncome) => {
  if (monthlyIncome <= 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
};

/**
 * Calculate optimal debt payoff strategy (avalanche vs snowball)
 */
export const calculatePayoffStrategies = (debts) => {
  const debtList = debts.map(debt => ({
    ...debt,
    timeline: calculatePayoffTimeline(debt.value, debt.interestRate, debt.monthlyPayment)
  })).filter(debt => debt.timeline);
  
  // Avalanche method (highest interest rate first)
  const avalanche = [...debtList].sort((a, b) => b.interestRate - a.interestRate);
  
  // Snowball method (lowest balance first)
  const snowball = [...debtList].sort((a, b) => a.value - b.value);
  
  // Calculate total payoff for each strategy
  const calculateStrategyTotals = (strategy) => {
    let totalInterest = 0;
    let totalMonths = 0;
    
    strategy.forEach(debt => {
      if (debt.timeline) {
        totalInterest += debt.timeline.totalInterest;
        totalMonths = Math.max(totalMonths, debt.timeline.months);
      }
    });
    
    return { totalInterest, totalMonths };
  };
  
  return {
    avalanche: {
      method: 'avalanche',
      debts: avalanche,
      ...calculateStrategyTotals(avalanche)
    },
    snowball: {
      method: 'snowball',
      debts: snowball,
      ...calculateStrategyTotals(snowball)
    }
  };
};

/**
 * Calculate compounding frequency options and their impact
 */
export const getCompoundingFrequencies = () => [
  { value: 12, label: 'Monthly', description: 'Interest compounded monthly' },
  { value: 4, label: 'Quarterly', description: 'Interest compounded quarterly' },
  { value: 2, label: 'Semi-annually', description: 'Interest compounded twice per year' },
  { value: 1, label: 'Annually', description: 'Interest compounded once per year' },
  { value: 365, label: 'Daily', description: 'Interest compounded daily' }
];

/**
 * Calculate minimum payment needed to avoid negative amortization
 */
export const calculateMinimumPayment = (balance, annualRate, compoundingFrequency = 12) => {
  const periodRate = annualRate / compoundingFrequency / 100;
  const paymentsPerPeriod = 12 / compoundingFrequency;
  return balance * periodRate * paymentsPerPeriod;
};
