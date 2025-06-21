// src/utils/debtPaymentSync.js
export const syncDebtPaymentsToExpenses = (accounts, expenses) => {
  const debtAccounts = accounts.filter(acc => 
    acc.category === "Debt" && acc.monthlyPayment > 0
  );
  
  const updatedExpenses = [...expenses];
  
  debtAccounts.forEach(debtAccount => {
    const expenseId = `exp-debt-${debtAccount.id}`;
    const existingExpenseIndex = updatedExpenses.findIndex(exp => exp.id === expenseId);
    
    const debtExpense = {
      id: expenseId,
      name: `${debtAccount.name} Payment`,
      cost: debtAccount.monthlyPayment,
      category: "required",
      linkedToAccountId: debtAccount.id,
      isDebtPayment: true
    };
    
    if (existingExpenseIndex >= 0) {
      // Update existing debt payment expense
      updatedExpenses[existingExpenseIndex] = debtExpense;
    } else {
      // Add new debt payment expense
      updatedExpenses.push(debtExpense);
    }
  });
  
  // Remove debt payment expenses for accounts that no longer exist or have no payment
  const validDebtAccountIds = debtAccounts.map(acc => acc.id);
  const filteredExpenses = updatedExpenses.filter(expense => {
    if (!expense.isDebtPayment) return true;
    return validDebtAccountIds.includes(expense.linkedToAccountId);
  });
  
  return filteredExpenses;
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