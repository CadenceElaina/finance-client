// src/hooks/useAccountsSection.js
import { useMemo } from 'react';
import { useFinancialData } from '../contexts/FinancialDataContext';
import { enrichAccountsWithCalculations } from '../utils/calculations/accountCalculations';
import { calculatePortfolioMetrics } from '../utils/calculations/portfolioCalculations';

export const useAccountsSection = (categoryFilter = 'all', portfolioFilter = 'all') => {
  const { data, saveData } = useFinancialData();
  
  const enrichedData = useMemo(() => {
    return enrichAccountsWithCalculations(data.accounts || [], data.portfolios || []);
  }, [data.accounts, data.portfolios]);

  const filteredAccounts = useMemo(() => {
    let filtered = enrichedData.accounts;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(acc => acc.category === categoryFilter);
    }
    
    if (portfolioFilter !== 'all') {
      filtered = filtered.filter(acc => acc.portfolioId === portfolioFilter);
    }
    
    return filtered;
  }, [enrichedData.accounts, categoryFilter, portfolioFilter]);

  // Portfolio-specific calculations with fallback for empty portfolios
  const portfolioMetrics = useMemo(() => {
    try {
      if (portfolioFilter === 'all') {
        return calculatePortfolioMetrics(enrichedData.accounts);
      }
      return calculatePortfolioMetrics(enrichedData.accounts, portfolioFilter);
    } catch (error) {
      console.warn('Portfolio metrics calculation failed:', error);
      return {
        totalValue: 0,
        cashBalance: 0,
        gainLoss: 0,
        gainLossPercent: 0,
        securitiesCount: 0
      };
    }
  }, [enrichedData.accounts, portfolioFilter]);

  // Get portfolios with securities (for special filtering where needed)
  const portfoliosWithSecurities = useMemo(() => {
    return (data.portfolios || []).filter(p => {
      const portfolioAccounts = enrichedData.accounts.filter(
        acc => acc.portfolioId === p.id && acc.category === "Investments"
      );
      return portfolioAccounts.some(
        acc => Array.isArray(acc.securities) && acc.securities.length > 0
      );
    });
  }, [data.portfolios, enrichedData.accounts]);

  const saveAccounts = (updatedAccounts) => {
    saveData({ ...data, accounts: updatedAccounts });
  };

  const savePortfolios = (updatedPortfolios) => {
    saveData({ ...data, portfolios: updatedPortfolios });
  };

  return {
    accounts: filteredAccounts,
    allAccounts: enrichedData.accounts,
    portfolios: data.portfolios || [], // Return ALL portfolios
    portfoliosWithSecurities, // Separate property for portfolios that have securities
    calculations: enrichedData,
    portfolioMetrics,
    saveAccounts,
    savePortfolios
  };
};