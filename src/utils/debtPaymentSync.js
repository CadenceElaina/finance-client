// src/utils/debtPaymentSync.js - ENHANCED

// Enhanced bidirectional debt payment synchronization

export const syncDebtPaymentsToExpenses = (accounts, existingExpenses) => {
  const debtAccounts = accounts.filter(acc => 
    acc.category === "Debt" && (acc.monthlyPayment || 0) > 0
  );
  
  // Start with non-debt expenses
  const nonDebtExpenses = existingExpenses.filter(exp => !exp.isDebtPayment);
  const updatedExpenses = [...nonDebtExpenses];
  
  // Add/update debt payment expenses
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

export const syncExpensesToDebtAccounts = (accounts, expenses) => {
  const debtPaymentExpenses = expenses.filter(exp => exp.isDebtPayment);
  
  return accounts.map(account => {
    if (account.category === "Debt") {
      const linkedExpense = debtPaymentExpenses.find(exp => 
        exp.linkedToAccountId === account.id
      );
      
      if (linkedExpense) {
        return {
          ...account,
          monthlyPayment: parseFloat(linkedExpense.cost) || 0
        };
      }
    }
    return account;
  });
};

export const detectDebtPaymentChanges = (originalExpenses, newExpenses) => {
  const changes = [];

  newExpenses.forEach(expense => {
    if (expense.isDebtPayment) {
      const originalExpense = originalExpenses.find(orig => orig.id === expense.id);
      if (originalExpense && originalExpense.cost !== expense.cost) {
        changes.push({
          expenseId: expense.id,
          accountId: expense.linkedToAccountId,
          accountName: expense.name.replace(' Payment', ''),
          oldAmount: originalExpense.cost,
          newAmount: expense.cost,
        });
      }
    }
  });

  return changes;
};

export const detectAccountDebtChanges = (originalAccounts, newAccounts) => {
  const changes = [];

  newAccounts.forEach(account => {
    if (account.category === "Debt" && account.monthlyPayment) {
      const originalAccount = originalAccounts.find(orig => orig.id === account.id);
      const oldPayment = originalAccount?.monthlyPayment || 0;
      const newPayment = account.monthlyPayment || 0;
      
      if (oldPayment !== newPayment) {
        changes.push({
          accountId: account.id,
          accountName: account.name,
          oldAmount: oldPayment,
          newAmount: newPayment,
        });
      }
    }
  });

  return changes;
};