// src/utils/calculations/budgetCalculations.js
import { useMemo } from 'react';

// Memoized calculation function
const calculateBudgetFieldsMemo = (() => {
  let cache = new Map();
  const maxCacheSize = 10;

  return (budget) => {
    // Create cache key from relevant budget properties
    const cacheKey = JSON.stringify({
      incomeType: budget?.income?.type,
      monthlyAfterTax: budget?.income?.monthlyAfterTax,
      annualPreTax: budget?.income?.annualPreTax,
      additionalAnnualAT: budget?.income?.additionalAnnualAT,
      hourlyRate: budget?.income?.hourlyRate,
      expectedHours: budget?.income?.expectedAnnualHours,
      expensesTotal: budget?.monthlyExpenses?.reduce((sum, exp) => sum + (parseFloat(exp.cost) || 0), 0)
    });

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = calculateBudgetFields(budget);

    // Manage cache size
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, result);

    return result;
  };
})();

function calculateBudgetFields(budget) {
  if (!budget) {
    return {
      totalMonthlyExpenses: 0,
      annualPreTax: 0,
      monthlyAfterTax: 0,
      annualAfterTax: 0,
      monthlyPreTax: 0,
      discretionaryIncome: 0,
    };
  }
  
  const income = budget.income || {};
  const expenses = budget.monthlyExpenses || [];
  
  const totalMonthlyExpenses = expenses.reduce((acc, item) => 
    acc + (parseFloat(item.cost) || 0), 0);

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
    monthlyPreTax = annualPreTax / 12;
    monthlyAfterTax = parseFloat(income.monthlyAfterTax) || 0;
  }

  // Include additional annual income
  const additionalMonthlyAT = (parseFloat(income.additionalAnnualAT) || 0) / 12;
  const totalMonthlyAfterTax = monthlyAfterTax + additionalMonthlyAT;
  
  const annualAfterTax = (monthlyAfterTax * 12) + (parseFloat(income.additionalAnnualAT) || 0);
  const discretionaryIncome = totalMonthlyAfterTax - totalMonthlyExpenses;

  return {
    totalMonthlyExpenses,
    annualPreTax,
    monthlyAfterTax: totalMonthlyAfterTax,
    annualAfterTax,
    monthlyPreTax,
    discretionaryIncome,
  };
}

export { calculateBudgetFields, calculateBudgetFieldsMemo };

export function enrichBudgetWithCalculations(budget) {
  if (!budget || typeof budget !== 'object') {
    return {
      income: {
        type: "salary",
        monthlyAfterTax: 0,
        annualPreTax: 0,
        additionalAnnualAT: 0
      },
      monthlyExpenses: [],
      totalMonthlyExpenses: 0,
      annualPreTax: 0,
      monthlyAfterTax: 0,
      annualAfterTax: 0,
      monthlyPreTax: 0,
      discretionaryIncome: 0,
    };
  }

  const normalizedBudget = {
    income: budget.income || {},
    monthlyExpenses: Array.isArray(budget.monthlyExpenses) ? budget.monthlyExpenses : [],
    ...budget
  };

  const calculations = calculateBudgetFieldsMemo(normalizedBudget);
  
  return {
    ...normalizedBudget,
    ...calculations,
  };
}

// Hook for components
export const useBudgetCalculations = (budget) => {
  return useMemo(() => calculateBudgetFieldsMemo(budget), [
    budget?.income?.type,
    budget?.income?.annualPreTax,
    budget?.income?.monthlyAfterTax,
    budget?.income?.additionalAnnualAT,
    budget?.income?.hourlyRate,
    budget?.income?.expectedAnnualHours,
    budget?.monthlyExpenses?.length,
    budget?.monthlyExpenses?.reduce((sum, exp) => sum + (parseFloat(exp.cost) || 0), 0)
  ]);
};