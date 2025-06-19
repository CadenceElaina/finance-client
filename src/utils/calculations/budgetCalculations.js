export function calculateBudgetFields(budget) {
  if (!budget) return {};
  const income = budget.income || {};
  const expenses = budget.monthlyExpenses || [];
  const totalMonthlyExpenses = expenses.reduce((acc, item) => acc + (item.cost || 0), 0);

  let annualPreTax = 0;
  let monthlyAfterTax = 0;

  if (income.type === "salary") {
    annualPreTax = income.annualPreTax || 0;
    monthlyAfterTax = income.monthlyAfterTax || 0;
  } else if (income.type === "hourly") {
    annualPreTax = (income.hourlyRate || 0) * (income.expectedAnnualHours || 0);
    monthlyAfterTax = income.monthlyAfterTax || 0;
  }

  const annualAfterTax =
    monthlyAfterTax * 12 +
    (income.bonusAfterTax || 0) +
    (income.additionalIncomeAfterTax || 0);

  const monthlyPreTax = annualPreTax / 12;
  const discretionaryIncome = monthlyAfterTax - totalMonthlyExpenses;

  return {
    ...budget,
    totalMonthlyExpenses,
    annualPreTax,
    monthlyAfterTax,
    annualAfterTax,
    monthlyPreTax,
    discretionaryIncome,
  };
}