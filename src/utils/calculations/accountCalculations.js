// src/utils/calculations/accountCalculations.js
export function calculateAccountFields(accounts) {
  const netWorth = accounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalCash = accounts
    .filter(acc => acc.category === "Cash")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalInvestments = accounts
    .filter(acc => acc.category === "Investments")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);
  const totalDebt = accounts
    .filter(acc => acc.category === "Debt")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

  return {
    netWorth,
    totalCash,
    totalInvestments,
    totalDebt,
    totalAssets: totalCash + totalInvestments,
    totalLiabilities: Math.abs(totalDebt)
  };
}

export function enrichAccountsWithCalculations(accounts, portfolios) {
  const calculations = calculateAccountFields(accounts);
  
  // Add portfolio information to accounts
  const enrichedAccounts = accounts.map(account => ({
    ...account,
    portfolioName: account.portfolioId 
      ? portfolios.find(p => p.id === account.portfolioId)?.name || "Unknown"
      : "N/A"
  }));

  return {
    accounts: enrichedAccounts,
    ...calculations
  };
}