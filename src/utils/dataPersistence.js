import { getLocalData, saveLocalData } from "./localStorageUtils";
import { fetchFinancialData, saveFinancialData } from "../services/financialService";
import { DEMO_ACCOUNTS, DEFAULT_DEMO_BUDGET } from "./constants";

export async function loadFinancialData({ user, token, persistence }) {
  if (user && persistence === "server") {
    const loaded = await fetchFinancialData(token);
    if (loaded && loaded.accounts && loaded.budget) return loaded;
    return { accounts: DEMO_ACCOUNTS, budget: DEFAULT_DEMO_BUDGET };
  } else if (persistence === "local") {
    return getLocalData() || { accounts: DEMO_ACCOUNTS, budget: DEFAULT_DEMO_BUDGET };
  } else {
    return { accounts: DEMO_ACCOUNTS, budget: DEFAULT_DEMO_BUDGET };
  }
}

export async function saveFinancialDataUtil({ user, token, persistence, data }) {
  if (user && persistence === "server") {
    await saveFinancialData(data, token);
  } else if (persistence === "local") {
    saveLocalData(data);
  }
}