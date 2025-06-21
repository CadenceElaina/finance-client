// src/services/debtSyncService.js
import { syncDebtPaymentsToExpenses } from "../utils/debtPaymentSync";

export class DebtSyncService {
  static syncAccountsToExpenses(accounts, expenses) {
    return syncDebtPaymentsToExpenses(accounts, expenses);
  }

  static detectDebtPaymentChanges(originalExpenses, newExpenses) {
    const changes = [];
    
    // Find debt payment expenses that changed
    const debtExpenses = newExpenses.filter(exp => exp.isDebtPayment);
    
    debtExpenses.forEach(newExp => {
      const originalExp = originalExpenses.find(exp => exp.id === newExp.id);
      
      if (originalExp && originalExp.cost !== newExp.cost) {
        changes.push({
          expenseId: newExp.id,
          accountId: newExp.linkedToAccountId,
          oldAmount: originalExp.cost,
          newAmount: newExp.cost,
          accountName: newExp.name.replace(' Payment', ''),
        });
      }
    });
    
    return changes;
  }

  static applyChangesToAccounts(accounts, changes) {
    return accounts.map(account => {
      const change = changes.find(c => c.accountId === account.id);
      if (change && account.category === "Debt") {
        return { 
          ...account, 
          monthlyPayment: change.newAmount,
          lastUpdated: new Date().toISOString(),
        };
      }
      return account;
    });
  }

  static validateDebtSync(accounts, expenses) {
    const debtAccounts = accounts.filter(acc => acc.category === "Debt" && acc.monthlyPayment > 0);
    const debtExpenses = expenses.filter(exp => exp.isDebtPayment);
    
    const issues = [];
    
    // Check for missing debt expenses
    debtAccounts.forEach(account => {
      const hasExpense = debtExpenses.some(exp => exp.linkedToAccountId === account.id);
      if (!hasExpense) {
        issues.push({
          type: 'missing_expense',
          account: account.name,
          message: `Missing expense for debt account: ${account.name}`,
        });
      }
    });
    
    // Check for orphaned debt expenses
    debtExpenses.forEach(expense => {
      const hasAccount = debtAccounts.some(acc => acc.id === expense.linkedToAccountId);
      if (!hasAccount) {
        issues.push({
          type: 'orphaned_expense',
          expense: expense.name,
          message: `Debt expense "${expense.name}" has no matching account`,
        });
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  static generateSyncReport(originalAccounts, newAccounts, originalExpenses, newExpenses) {
    const changes = this.detectDebtPaymentChanges(originalExpenses, newExpenses);
    const validation = this.validateDebtSync(newAccounts, newExpenses);
    
    return {
      changes,
      validation,
      summary: {
        accountsAffected: changes.length,
        totalNewAmount: changes.reduce((sum, c) => sum + c.newAmount, 0),
        totalOldAmount: changes.reduce((sum, c) => sum + c.oldAmount, 0),
      },
    };
  }
}