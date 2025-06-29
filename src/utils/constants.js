// src/utils/constants.js
// Budget persistence preference key
export const LOCAL_PERSISTENCE_PREF_KEY = 'budgetPersistencePreference';

// Default/demo budget structure
export const DEFAULT_DEMO_BUDGET = {
  income: {
    type: "salary",
    monthlyAfterTax: 4100,
    annualPreTax: 75000,
    hourlyRate: null,
    expectedAnnualHours: null,
    additionalAnnualAT: 5000,
  },
  monthlyExpenses: [
    { id: "exp-1", name: "Rent/Mortgage", cost: 1200, category: "required" },
    { id: "exp-2", name: "Groceries", cost: 400, category: "flexible" },
    { id: "exp-3", name: "Utilities", cost: 150, category: "required" },
    { id: "exp-4", name: "Internet", cost: 70, category: "required" },
    { id: "exp-5", name: "Transportation", cost: 100, category: "flexible" },
    { id: "exp-6", name: "Dining Out", cost: 200, category: "non-essential" },
    { id: "exp-7", name: "Entertainment", cost: 100, category: "non-essential" },
    { id: "exp-8", name: "Phone", cost: 80, category: "required" },
    { id: "exp-9", name: "Insurance", cost: 250, category: "required" },
    { id: "exp-10", name: "Gym Membership", cost: 50, category: "non-essential" },
  ],
};


// Demo portfolios
export const DEMO_PORTFOLIOS = [
  { id: "portfolio-1", name: "Main Portfolio" },
  { id: "portfolio-2", name: "Retirement Portfolio" },
];

// Base cash account that cannot be removed
export const BASE_CASH_ACCOUNT = {
  id: "base-cash-001",
  name: "Cash",
  category: "Cash",
  subType: "Other Cash",
  value: 0,
  accountProvider: "Self",
  taxStatus: "N/A",
  isBaseAccount: true, // Flag to identify this as non-removable
  interestRate: null,
  monthlyPayment: null,
  portfolioId: null,
  portfolioName: "N/A"
};

// Update DEMO_ACCOUNTS to include the base cash account
export const DEMO_ACCOUNTS = [
  BASE_CASH_ACCOUNT, // Always first in the list
  { 
    id: "acc-1", 
    name: "Checking Account", 
    category: "Cash", 
    subType: "Checking", 
    value: 2500, 
    accountProvider: "Chase Bank", 
    taxStatus: "Taxable" 
  },
  { 
    id: "acc-2", 
    name: "Savings Account", 
    category: "Cash", 
    subType: "Savings", 
    value: 10000, 
    accountProvider: "Chase Bank", 
    taxStatus: "Taxable" 
  },
  { 
    id: "acc-3", 
    name: "401(k)", 
    category: "Investments", 
    subType: "401(k)", 
    value: 45000,
    accountProvider: "Fidelity", 
    taxStatus: "Tax-deferred", 
    portfolioId: "portfolio-2", 
    hasSecurities: true, 
    securities: [
      { 
        id: "sec-1",
        name: "S&P 500 Index Fund", 
        ticker: "FXAIX", 
        quantity: 150, 
        value: 30000, 
        purchasePrice: 180, 
        datePurchased: "2023-01-15" 
      },
      { 
        id: "sec-2",
        name: "Total Bond Market", 
        ticker: "FXNAX", 
        quantity: 100, 
        value: 15000, 
        purchasePrice: 140, 
        datePurchased: "2023-02-01" 
      }
    ], 
    cashBalance: 0
  },
  { 
    id: "acc-4", 
    name: "Roth IRA", 
    category: "Investments", 
    subType: "Roth IRA", 
    value: 25500,
    accountProvider: "Vanguard", 
    taxStatus: "Tax-free", 
    portfolioId: "portfolio-1", 
    hasSecurities: true, 
    securities: [
      { 
        id: "sec-3",
        name: "Total Stock Market", 
        ticker: "VTI", 
        quantity: 100, 
        value: 25000, 
        purchasePrice: 220, 
        datePurchased: "2023-03-10" 
      }
    ], 
    cashBalance: 500
  },
  { 
    id: "acc-5", 
    name: "Taxable Brokerage", 
    category: "Investments", 
    subType: "Taxable Brokerage", 
    value: 15200,
    accountProvider: "Vanguard", 
    taxStatus: "Taxable", 
    portfolioId: "portfolio-1", 
    hasSecurities: true, 
    securities: [
      { 
        id: "sec-4",
        name: "Technology ETF", 
        ticker: "VGT", 
        quantity: 30, 
        value: 15000, 
        purchasePrice: 450, 
        datePurchased: "2023-04-05" 
      }
    ], 
    cashBalance: 200
  },
  { 
    id: "acc-6", 
    name: "Credit Card", 
    category: "Debt", 
    subType: "Credit Card", 
    value: 3500, 
    accountProvider: "Chase", 
    taxStatus: "N/A", 
    interestRate: 18.99, 
    monthlyPayment: 150 
  },
  { 
    id: "acc-7",
    name: "Student Loan", 
    category: "Debt", 
    subType: "Student Loan", 
    value: 15000, 
    accountProvider: "Nelnet", 
    taxStatus: "N/A", 
    interestRate: 4.5, 
    monthlyPayment: 200 
  },
];