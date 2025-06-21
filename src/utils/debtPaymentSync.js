// src/utils/debtPaymentSync.js
// Update to better handle removals

export const syncDebtPaymentsToExpenses = (accounts, expenses) => {
  const debtAccounts = accounts.filter(acc => 
    acc.category === "Debt" && acc.monthlyPayment > 0
  );
  
  // Start with existing expenses, filtered to remove old debt payments
  const nonDebtExpenses = expenses.filter(exp => !exp.isDebtPayment);
  const updatedExpenses = [...nonDebtExpenses];
  
  // Add current debt payments
  debtAccounts.forEach(debtAccount => {
    const expenseId = `exp-debt-${debtAccount.id}`;
    
    const debtExpense = {
      id: expenseId,
      name: `${debtAccount.name} Payment`,
      cost: debtAccount.monthlyPayment,
      category: "required",
      linkedToAccountId: debtAccount.id,
      isDebtPayment: true
    };
    
    updatedExpenses.push(debtExpense);
  });
  
  return updatedExpenses;
};

export const syncExpenseToDebtPayment = (accounts, expenseId, newAmount) => {
  const updatedAccounts = [...accounts];
  
  // Find the expense's linked account
  const linkedAccountId = expenseId.replace('exp-debt-', '');
  const accountIndex = updatedAccounts.findIndex(acc => acc.id === linkedAccountId);
  
  if (accountIndex >= 0 && updatedAccounts[accountIndex].category === "Debt") {
    updatedAccounts[accountIndex] = {
      ...updatedAccounts[accountIndex],
      monthlyPayment: newAmount
    };
  }
  
  return updatedAccounts;
};

export const removeDebtPaymentExpense = (accounts, expenses, expenseId) => {
  const linkedAccountId = expenseId.replace('exp-debt-', '');
  const account = accounts.find(acc => acc.id === linkedAccountId);
  
  return {
    accountName: account?.name || "Unknown Account",
    linkedAccountId,
    updatedExpenses: expenses.filter(exp => exp.id !== expenseId),
    updatedAccounts: accounts.map(acc => 
      acc.id === linkedAccountId 
        ? { ...acc, monthlyPayment: 0 }
        : acc
    )
  };
};