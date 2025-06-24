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
    if (expense.isDebtPayment === true || (expense.id && expense.id.startsWith('exp-debt-'))) {
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

// FIXED: Look for debt payment expenses in the new expenses list
export const detectAccountDebtChanges = (originalExpenses, newExpenses) => {
  const changes = [];

  newExpenses.forEach(expense => {
    if (expense.isDebtPayment === true || (expense.id && expense.id.startsWith('exp-debt-'))) {
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

// ADDED: Function to properly detect goal expenses
export const detectGoalExpenseChanges = (originalExpenses, newExpenses) => {
  const changes = [];

  newExpenses.forEach(expense => {
    if (expense.isGoalExpense === true || (expense.id && expense.id.startsWith('exp-goal-'))) {
      const originalExpense = originalExpenses.find(orig => orig.id === expense.id);
      if (originalExpense && originalExpense.cost !== expense.cost) {
        changes.push({
          expenseId: expense.id,
          goalId: expense.linkedToGoalId,
          goalName: expense.name.replace(' (Goal)', ''),
          oldAmount: originalExpense.cost,
          newAmount: expense.cost,
        });
      }
    }
  });

  return changes;
};

// Rest of the functions remain the same...