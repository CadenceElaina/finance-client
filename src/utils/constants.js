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
    ],
};
export const DEMO_ACCOUNTS = [
    {
        id: "6664e4a7d7b3a9e8f1c2d3e0",
        name: "Long Term Growth ETFs",
        accountProvider: "Example Brokerage",
        value: 25184.20,
        cashBalance: 1260.00,
        currency: "USD",
        canInvest: true,
        category: "Investments", // Changed from 'type: "taxable"'
        subType: "Brokerage",   // Added for more detail
        taxStatus: "Taxable",   // Added for tax implications
        hasSecurities: true,
        securities: [
            {
                name: "Schwab U.S. Large-Cap Growth ETF",
                ticker: "SCHG",
                quantity: 269,
                value: 7558.21,
                datePurchased: "2023-01-15T08:00:00.000Z",
                purchasePrice: 26.68
            },
            {
                name: "Capital Group Growth ETF",
                ticker: "CGGR",
                quantity: 129,
                value: 5024.55,
                datePurchased: "2023-03-01T08:00:00.000Z",
                purchasePrice: 37.00
            },
            {
                name: "iShares U.S. Technology ETF",
                ticker: "IYW",
                quantity: 3,
                value: 982.20,
                datePurchased: "2023-05-10T08:00:00.000Z",
                purchasePrice: 311.03
            },
            {
                name: "iShares Russell 2000 ETF",
                ticker: "IWM",
                quantity: 5,
                value: 1059.50,
                datePurchased: "2023-07-20T08:00:00.000Z",
                purchasePrice: 201.31
            },
            {
                name: "Vanguard Small-Cap Growth ETF",
                ticker: "VBK",
                quantity: 4,
                value: 1086.44,
                datePurchased: "2023-09-05T08:00:00.000Z",
                purchasePrice: 258.03
            },
            {
                name: "SPDR Portfolio S&P 500 ETF",
                ticker: "SPLG",
                quantity: 89,
                value: 6271.83,
                datePurchased: "2023-11-12T08:00:00.000Z",
                purchasePrice: 66.95
            },
            {
                name: "Vanguard Total World Stock ETF",
                ticker: "VT",
                quantity: 10,
                value: 1254.30,
                datePurchased: "2024-01-25T08:00:00.000Z",
                purchasePrice: 119.16
            }
        ]
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e1",
        name: "Diversified Stock Portfolio",
        accountProvider: "Online Brokerage",
        value: 9989.45,
        cashBalance: 500.00,
        currency: "USD",
        canInvest: true,
        category: "Investments", // Changed from 'type: "taxable"'
        subType: "Brokerage",   // Added
        taxStatus: "Taxable",   // Added
        hasSecurities: true,
        securities: [
            {
                name: "Microsoft Corp",
                ticker: "MSFT",
                quantity: 2,
                value: 859.00,
                datePurchased: "2024-05-01T08:00:00.000Z",
                purchasePrice: 400.00
            },
            {
                name: "Amazon.com Inc",
                ticker: "AMZN",
                quantity: 4,
                value: 748.00,
                datePurchased: "2024-05-05T08:00:00.000Z",
                purchasePrice: 175.00
            },
            {
                name: "Advanced Micro Devices Inc",
                ticker: "AMD",
                quantity: 4,
                value: 663.00,
                datePurchased: "2024-05-10T08:00:00.000Z",
                purchasePrice: 150.00
            },
            {
                name: "Alphabet Inc - Class C",
                ticker: "GOOG",
                quantity: 4,
                value: 700.80,
                datePurchased: "2024-05-15T08:00:00.000Z",
                purchasePrice: 160.00
            },
            {
                name: "Alibaba Group Holding Ltd",
                ticker: "BABA",
                quantity: 9,
                value: 702.90,
                datePurchased: "2024-05-20T08:00:00.000Z",
                purchasePrice: 70.00
            },
            {
                name: "Visa Inc - Class A",
                ticker: "V",
                quantity: 2,
                value: 556.60,
                datePurchased: "2024-05-25T08:00:00.000Z",
                purchasePrice: 260.00
            },
            {
                name: "JPMorgan Chase & Co",
                ticker: "JPM",
                quantity: 3,
                value: 586.80,
                datePurchased: "2024-06-01T08:00:00.000Z",
                purchasePrice: 180.00
            },
            {
                name: "Taiwan Semiconductor Manufacturing Co Ltd",
                ticker: "TSM",
                quantity: 4,
                value: 683.20,
                datePurchased: "2024-06-05T08:00:00.000Z",
                purchasePrice: 155.00
            },
            {
                name: "UnitedHealth Group Inc",
                ticker: "UNH",
                quantity: 1,
                value: 490.15,
                datePurchased: "2024-06-10T08:00:00.000Z",
                purchasePrice: 450.00
            },
            {
                name: "Uber Technologies Inc",
                ticker: "UBER",
                quantity: 10,
                value: 712.00,
                datePurchased: "2024-06-15T08:00:00.000Z",
                purchasePrice: 65.00
            },
            {
                name: "Netflix Inc",
                ticker: "NFLX",
                quantity: 1,
                value: 640.00,
                datePurchased: "2024-06-20T08:00:00.000Z",
                purchasePrice: 600.00
            },
            {
                name: "NVIDIA Corp",
                ticker: "NVDA",
                quantity: 0,
                value: 0.00,
                datePurchased: "2024-06-25T08:00:00.000Z",
                purchasePrice: 1000.00
            },
            {
                name: "Apple Inc",
                ticker: "AAPL",
                quantity: 3,
                value: 585.00,
                datePurchased: "2024-06-30T08:00:00.000Z",
                purchasePrice: 180.00
            }
        ]
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e2",
        name: "Roth IRA Account",
        accountProvider: "Fidelity",
        value: 7000.00,
        cashBalance: 0.00,
        currency: "USD",
        canInvest: true,
        category: "Investments", // Changed from 'type: "ira"'
        subType: "Retirement (IRA)", // Added for more detail
        taxStatus: "Tax-Exempt", // Changed from 'taxTreatment'
        hasSecurities: true,
        securities: [
            {
                name: "Fidelity Growth Company Fund",
                ticker: "FDGRX",
                quantity: 350,
                value: 7000.00,
                purchasePrice: 18.50
            }
        ]
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e3",
        name: "401k Retirement Plan",
        accountProvider: "Employer 401k Provider",
        value: 55000.00,
        cashBalance: 0.00,
        currency: "USD",
        canInvest: true,
        category: "Investments", // Changed from 'type: "defined_contribution"'
        subType: "Retirement (401k)", // Added for more detail
        taxStatus: "Tax-Deferred", // Changed from 'taxTreatment'
        hasSecurities: true,
        securities: [
            {
                name: "Target Date Fund 2060",
                ticker: "TDF2060",
                quantity: 1375,
                value: 55000.00,
                purchasePrice: 38.00
            }
        ]
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e4",
        name: "Checking Account",
        accountProvider: "Bank of America",
        value: 1500.00,
        cashBalance: 1500.00,
        currency: "USD",
        canInvest: false,
        category: "Cash", // Changed from 'type: "cash"'
        subType: "Checking", // Added for more detail
        taxStatus: "Taxable", // Generally, interest on cash is taxable
        hasSecurities: false,
        securities: []
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e5",
        name: "Ally Savings Account",
        accountProvider: "Ally Bank",
        value: 10000.00,
        cashBalance: 10000.00,
        currency: "USD",
        canInvest: false,
        category: "Cash", // Changed from 'type: "cash"'
        subType: "Savings", // Added for more detail
        taxStatus: "Taxable", // Generally, interest on cash is taxable
        hasSecurities: false,
        securities: []
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e6",
        name: "American Express Card",
        accountProvider: "American Express",
        value: -250.00,
        cashBalance: 0.00,
        currency: "USD",
        canInvest: false,
        category: "Debt", // Changed from 'type: "debt"'
        subType: "Credit Card", // Added for more detail
        taxStatus: "N/A", // Not applicable for debt
        interestRate: 22.99,
        monthlyPayment: 50.00,
        hasSecurities: false,
        securities: []
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e7",
        name: "Federal Student Loan",
        accountProvider: "Student Loan Servicer",
        value: -15000.00,
        cashBalance: 0.00,
        currency: "USD",
        canInvest: false,
        category: "Debt", // Changed from 'type: "debt"'
        subType: "Student Loan", // Added for more detail
        taxStatus: "N/A", // Not applicable for debt
        interestRate: 5.50,
        monthlyPayment: 150.00,
        hasSecurities: false,
        securities: []
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e8",
        name: "Health Savings Account",
        accountProvider: "Optum Bank",
        value: 2000.00,
        cashBalance: 2000.00,
        currency: "USD",
        canInvest: true, // HSAs can often invest beyond cash
        category: "Investments", // Classified as investment due to investment potential, or could be 'Cash' if only cash
        subType: "Health Savings Account (HSA)", // Added for more detail
        taxStatus: "Tax-Advantaged", // Changed from 'taxTreatment'
        hasSecurities: false, // Set to false for this demo, but could be true if investing
        securities: [] // No securities for this demo, but could hold them
    }
];