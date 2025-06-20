import { getLocalData, saveLocalData } from "./localStorageUtils";
import { fetchFinancialData, saveFinancialData } from "../services/financialService";
import { DEMO_ACCOUNTS, DEFAULT_DEMO_BUDGET, DEMO_PORTFOLIOS } from "./constants";

export async function loadFinancialData({ user, token, persistence }) {
  if (user && persistence === "server") {
    try {
      const loaded = await fetchFinancialData(token);
      if (loaded && loaded.accounts && loaded.budget) {
        // Ensure portfolios exist
        return {
          ...loaded,
          portfolios: loaded.portfolios || DEMO_PORTFOLIOS,
          goals: loaded.goals || []
        };
      }
    } catch (error) {
      console.warn('Failed to load from server, falling back to demo data:', error);
    }
    // Fallback to demo data if server fails
    return { 
      accounts: DEMO_ACCOUNTS, 
      budget: DEFAULT_DEMO_BUDGET,
      portfolios: DEMO_PORTFOLIOS,
      goals: []
    };
  } else if (persistence === "local") {
    const localData = getLocalData();
    if (localData) {
      return {
        accounts: localData.accounts || DEMO_ACCOUNTS,
        budget: localData.budget || DEFAULT_DEMO_BUDGET,
        portfolios: localData.portfolios || DEMO_PORTFOLIOS,
        goals: localData.goals || []
      };
    }
    return { 
      accounts: DEMO_ACCOUNTS, 
      budget: DEFAULT_DEMO_BUDGET,
      portfolios: DEMO_PORTFOLIOS,
      goals: []
    };
  } else {
    return { 
      accounts: DEMO_ACCOUNTS, 
      budget: DEFAULT_DEMO_BUDGET,
      portfolios: DEMO_PORTFOLIOS,
      goals: []
    };
  }
}

export async function saveFinancialDataUtil({ user, token, persistence, data }) {
  if (user && persistence === "server") {
    try {
      await saveFinancialData(data, token);
    } catch (error) {
      console.error('Failed to save to server:', error);
      // Optionally save locally as backup
      if (persistence === "server") {
        console.log('Saving locally as backup...');
        saveLocalData(data);
      }
      throw error; // Re-throw so the UI can handle it
    }
  } else if (persistence === "local") {
    saveLocalData(data);
  }
}