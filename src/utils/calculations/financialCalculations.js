// src/utils/calculations/financialCalculations.js
export const getNetWorth = (accounts) =>
  accounts.reduce(
    (sum, acc) => sum + (typeof acc.value === "number" ? acc.value : 0),
    0
  );

export const getTotalCash = (accounts) =>
  accounts
    .filter((acc) => acc.category === "Cash")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

export const getTotalInvestments = (accounts) =>
  accounts
    .filter((acc) => acc.category === "Investments")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

export const getTotalLiabilities = (accounts) =>
  accounts
    .filter((acc) => acc.category === "Debt")
    .reduce((sum, acc) => sum + (acc.value || 0), 0);

export const getTotalAssets = (accounts) => getTotalCash(accounts) + getTotalInvestments(accounts);