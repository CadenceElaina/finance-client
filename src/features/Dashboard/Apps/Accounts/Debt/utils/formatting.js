/**
 * Formatting utilities for the Debt tab
 */

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyPrecise = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (rate, decimals = 1) => {
  if (rate === null || rate === undefined) return '0%';
  return `${rate.toFixed(decimals)}%`;
};

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '0';
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatMonthsToYears = (months) => {
  if (!months) return '0 months';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  
  return `${years}y ${remainingMonths}m`;
};
