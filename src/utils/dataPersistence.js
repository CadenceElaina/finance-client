import { getLocalData, saveLocalData } from "./localStorageUtils";
import { fetchFinancialData, saveFinancialData } from "../services/financialService";
import { DEMO_ACCOUNTS, DEFAULT_DEMO_BUDGET, DEMO_PORTFOLIOS } from "./constants";

export async function loadFinancialData({ user, token, persistence }) {
  let rawData = null;
  
  if (user && persistence === "server") {
    try {
      rawData = await fetchFinancialData(token);
    } catch (error) {
      console.warn('Failed to load from server, falling back to demo data:', error);
    }
  } else if (persistence === "local") {
    rawData = getLocalData();
  }

  // FIXED: Fallback to demo data with proper structure
  if (!rawData) {
    rawData = { 
      accounts: DEMO_ACCOUNTS, 
      budget: DEFAULT_DEMO_BUDGET,
      portfolios: DEMO_PORTFOLIOS,
      goals: []
    };
  }

  // FIXED: Ensure all required fields exist
  const normalizedData = {
    accounts: rawData.accounts || DEMO_ACCOUNTS,
    budget: rawData.budget || DEFAULT_DEMO_BUDGET,
    portfolios: rawData.portfolios || DEMO_PORTFOLIOS,
    goals: rawData.goals || []
  };

  // FIXED: Don't enrich here - let context handle it
  return normalizedData;
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