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
  const totalMonthlyExpenses = expenses.reduce((acc, item) => acc + (parseFloat(item.cost) || 0), 0);

  let annualPreTax = 0;
  let monthlyAfterTax = 0;
  let monthlyPreTax = 0;

  if (income.type === "salary") {
    annualPreTax = parseFloat(income.annualPreTax) || 0;
    monthlyAfterTax = parseFloat(income.monthlyAfterTax) || 0;
    monthlyPreTax = annualPreTax / 12;
  } else if (income.type === "hourly") {
    const hourlyRate = parseFloat(income.hourlyRate) || 0;
    const expectedHours = parseFloat(income.expectedAnnualHours) || 2080;
    annualPreTax = hourlyRate * expectedHours;
    monthlyAfterTax = parseFloat(income.monthlyAfterTax) || 0;
    monthlyPreTax = annualPreTax / 12;
  }

  // FIXED: Include additional annual income in monthly calculation
  const additionalMonthlyAT = (parseFloat(income.additionalAnnualAT) || 0) / 12;
  const totalMonthlyAfterTax = monthlyAfterTax + additionalMonthlyAT;
  
  // Calculate total annual after-tax including additional income
  const annualAfterTax = (monthlyAfterTax * 12) + (parseFloat(income.additionalAnnualAT) || 0);
  
  // FIXED: Use total monthly after-tax for discretionary calculation
  const discretionaryIncome = totalMonthlyAfterTax - totalMonthlyExpenses;

  // Calculate effective tax rate based on primary income only (not including additional)
  const effectiveTaxRate = annualPreTax > 0 ? 
    ((annualPreTax - (monthlyAfterTax * 12)) / annualPreTax) * 100 : 0;

  return {
    totalMonthlyExpenses,
    annualPreTax,
    monthlyAfterTax: totalMonthlyAfterTax, // FIXED: Return total monthly including additional
    annualAfterTax,
    monthlyPreTax,
    discretionaryIncome,
    effectiveTaxRate,
  };
}

// Helper function to merge budget with calculated fields
export function enrichBudgetWithCalculations(budget) {
  if (!budget) {
    return {
      income: {},
      monthlyExpenses: [],
      totalMonthlyExpenses: 0,
      annualPreTax: 0,
      monthlyAfterTax: 0,
      annualAfterTax: 0,
      monthlyPreTax: 0,
      discretionaryIncome: 0,
      effectiveTaxRate: 0,
    };
  }

  const calculations = calculateBudgetFields(budget);
  return {
    ...budget,
    ...calculations,
  };
}

// Helper function to validate budget data
export function validateBudgetData(budget) {
  const errors = {};
  
  if (!budget || !budget.income) {
    errors.income = 'Income data is required';
    return {
      isValid: false,
      errors
    };
  }

  const income = budget.income;
  
  if (income.type === 'salary' && (!income.annualPreTax || parseFloat(income.annualPreTax) <= 0)) {
    errors.annualPreTax = 'Annual salary must be greater than 0';
  }
  if (income.type === 'hourly' && (!income.hourlyRate || parseFloat(income.hourlyRate) <= 0)) {
    errors.hourlyRate = 'Hourly rate must be greater than 0';
  }
  if (!income.monthlyAfterTax || parseFloat(income.monthlyAfterTax) <= 0) {
    errors.monthlyAfterTax = 'Monthly after-tax income must be greater than 0';
  }
  
  if (budget.monthlyExpenses && Array.isArray(budget.monthlyExpenses)) {
    budget.monthlyExpenses.forEach((expense, index) => {
      if (!expense.name || expense.name.trim() === '') {
        errors[`expense_${index}_name`] = 'Expense name is required';
      }
      if (expense.cost === undefined || parseFloat(expense.cost) < 0) {
        errors[`expense_${index}_cost`] = 'Expense cost must be 0 or greater';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}