export function calculateBudgetFields(budget) {
  if (!budget) return {
    totalMonthlyExpenses: 0,
    annualPreTax: 0,
    monthlyAfterTax: 0,
    annualAfterTax: 0,
    monthlyPreTax: 0,
    discretionaryIncome: 0,
    effectiveTaxRate: 0,
  };
  
  const income = budget.income || {};
  const expenses = budget.monthlyExpenses || [];
  const totalMonthlyExpenses = expenses.reduce((acc, item) => acc + (item.cost || 0), 0);

  let annualPreTax = 0;
  let monthlyAfterTax = 0;
  let monthlyPreTax = 0;

  if (income.type === "salary") {
    annualPreTax = income.annualPreTax || 0;
    monthlyAfterTax = income.monthlyAfterTax || 0;
    monthlyPreTax = annualPreTax / 12;
  } else if (income.type === "hourly") {
    const hourlyRate = income.hourlyRate || 0;
    const expectedHours = income.expectedAnnualHours || 2080;
    annualPreTax = hourlyRate * expectedHours;
    monthlyAfterTax = income.monthlyAfterTax || 0;
    monthlyPreTax = annualPreTax / 12;
  }

  // Include additional annual income in total
  const annualAfterTax = (monthlyAfterTax * 12) + (income.additionalAnnualAT || 0);
  const discretionaryIncome = monthlyAfterTax - totalMonthlyExpenses;

  // Calculate effective tax rate
  const effectiveTaxRate = annualPreTax > 0 ? 
    ((annualPreTax - (monthlyAfterTax * 12)) / annualPreTax) * 100 : 0;

  return {
    totalMonthlyExpenses,
    annualPreTax,
    monthlyAfterTax,
    annualAfterTax,
    monthlyPreTax,
    discretionaryIncome,
    effectiveTaxRate,
  };
}

// Helper function to merge budget with calculated fields
export function enrichBudgetWithCalculations(budget) {
  const calculations = calculateBudgetFields(budget);
  return {
    ...budget,
    ...calculations,
  };
}

// Helper function to validate budget data
export function validateBudgetData(budget) {
  const errors = {};
  
  if (!budget.income) {
    errors.income = 'Income data is required';
  } else {
    if (budget.income.type === 'salary' && (!budget.income.annualPreTax || budget.income.annualPreTax <= 0)) {
      errors.annualPreTax = 'Annual salary must be greater than 0';
    }
    if (budget.income.type === 'hourly' && (!budget.income.hourlyRate || budget.income.hourlyRate <= 0)) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }
    if (!budget.income.monthlyAfterTax || budget.income.monthlyAfterTax <= 0) {
      errors.monthlyAfterTax = 'Monthly after-tax income must be greater than 0';
    }
  }
  
  if (budget.monthlyExpenses) {
    budget.monthlyExpenses.forEach((expense, index) => {
      if (!expense.name || expense.name.trim() === '') {
        errors[`expense_${index}_name`] = 'Expense name is required';
      }
      if (!expense.cost || expense.cost < 0) {
        errors[`expense_${index}_cost`] = 'Expense cost must be 0 or greater';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}