// Budget persistence preference key
export const LOCAL_PERSISTENCE_PREF_KEY = 'budgetPersistencePreference';

// Default/demo budget structure
export const DEFAULT_DEMO_BUDGET = {
    income: {
        type: "salary", // 'salary' or 'hourly'
        monthlyAfterTax: 4100, // Net monthly income (after tax)
        annualPreTax: 75000,   // Gross annual salary (pre-tax)
        hourlyRate: null,
        expectedAnnualHours: null,
        bonusAfterTax: 5000,
        additionalIncomeAfterTax: 0,
    },
    monthlyExpenses: [
        { id: "exp-1", name: "Rent/Mortgage", cost: 1200, category: "required" },
        { id: "exp-2", name: "Groceries", cost: 400, category: "flexible" },
        { id: "exp-3", name: "Utilities", cost: 150, category: "required" },
        { id: "exp-4", name: "Internet", cost: 70, category: "required" },
        { id: "exp-5", name: "Transportation", cost: 100, category: "flexible" },
        { id: "exp-6", name: "Dining Out", cost: 200, category: "non-essential" },
        { id: "exp-7", name: "Entertainment", cost: 100, category: "non-essential" },
        // Add demo debt payment from the credit card account
        { 
            id: "exp-debt-acc-6", 
            name: "Credit Card Payment", 
            cost: 150, 
            category: "required",
            linkedToAccountId: "acc-6", // Link to the credit card account
            isDebtPayment: true 
        },
    ],
};


// Demo portfolios
export const DEMO_PORTFOLIOS = [
  { id: "portfolio-1", name: "Main Portfolio" },
  { id: "portfolio-2", name: "Retirement Portfolio" },
  { id: "portfolio-3", name: "Emergency Fund" },
];

// Update DEMO_ACCOUNTS to include portfolioId for investment accounts
export const DEMO_ACCOUNTS = [
  {
    id: "acc-1",
    name: "Chase Checking",
    accountProvider: "Chase Bank",
    category: "Cash",
    subType: "Checking",
    value: 5000,
    taxStatus: "Taxable",
    interestRate: null,
    monthlyPayment: null,
  },
  {
    id: "acc-2", 
    name: "Ally Savings",
    accountProvider: "Ally Bank",
    category: "Cash",
    subType: "Savings",
    value: 15000,
    taxStatus: "Taxable",
    interestRate: null,
    monthlyPayment: null,
  },
  {
    id: "acc-3",
    name: "Fidelity 401k",
    accountProvider: "Fidelity",
    category: "Investments",
    subType: "401(k)",
    value: 45000,
    taxStatus: "Tax-deferred",
    hasSecurities: true,
    portfolioId: "portfolio-2", // Retirement Portfolio
    cashBalance: 500,
    securities: [
      {
        name: "Vanguard S&P 500 ETF",
        ticker: "VOO",
        quantity: 100,
        value: 35000,
        purchasePrice: 300,
        datePurchased: "2023-01-15",
      },
      {
        name: "Vanguard Total Bond Market ETF",
        ticker: "BND",
        quantity: 120,
        value: 9500,
        purchasePrice: 75,
        datePurchased: "2023-02-20",
      },
    ],
  },
  {
    id: "acc-4",
    name: "Schwab Roth IRA",
    accountProvider: "Charles Schwab",
    category: "Investments", 
    subType: "Roth IRA",
    value: 25000,
    taxStatus: "Tax-free",
    hasSecurities: true,
    portfolioId: "portfolio-2", // Retirement Portfolio
    cashBalance: 1000,
    securities: [
      {
        name: "iShares Core MSCI Total International Stock ETF",
        ticker: "IXUS",
        quantity: 200,
        value: 12000,
        purchasePrice: 55,
        datePurchased: "2023-03-10",
      },
      {
        name: "Vanguard Real Estate ETF",
        ticker: "VNQ",
        quantity: 150,
        value: 12000,
        purchasePrice: 75,
        datePurchased: "2023-04-05",
      },
    ],
  },
  {
    id: "acc-5",
    name: "E*TRADE Brokerage",
    accountProvider: "E*TRADE",
    category: "Investments",
    subType: "Taxable Brokerage",
    value: 30000,
    taxStatus: "Taxable",
    hasSecurities: true,
    portfolioId: "portfolio-1", // Main Portfolio
    cashBalance: 2000,
    securities: [
      {
        name: "Apple Inc.",
        ticker: "AAPL",
        quantity: 50,
        value: 15000,
        purchasePrice: 280,
        datePurchased: "2023-05-15",
      },
      {
        name: "Microsoft Corporation", 
        ticker: "MSFT",
        quantity: 40,
        value: 13000,
        purchasePrice: 300,
        datePurchased: "2023-06-20",
      },
    ],
  },
  {
    id: "acc-6",
    name: "Credit Card",
    accountProvider: "Capital One",
    category: "Debt",
    subType: "Credit Card",
    value: -2500,
    taxStatus: "N/A",
    interestRate: 18.99,
    monthlyPayment: 150,
  },
];