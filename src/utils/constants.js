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
        id: "6664e4a7d7b3a9e8f1c2d3e0", // Example static ID
        name: "Long Term Growth ETFs",
        accountProvider: "Example Brokerage",
        value: 25184.20, // Calculated total value based on shares and cash
        cashBalance: 1260.00, // Approximately 5% of ~25k total
        currency: "USD",
        canInvest: true,
        type: "taxable",
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
        id: "6664e4a7d7b3a9e8f1c2d3e1", // Example static ID
        name: "Diversified Stock Portfolio",
        accountProvider: "Online Brokerage",
        value: 9989.45,
        cashBalance: 500.00,
        currency: "USD",
        canInvest: true,
        type: "taxable",
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
        id: "6664e4a7d7b3a9e8f1c2d3e2", // New example static ID for Roth IRA
        name: "Roth IRA Account",
        accountProvider: "Fidelity",
        value: 7000.00, // Approximately $7,000
        cashBalance: 0.00, // Fully invested in FDGRX
        currency: "USD",
        canInvest: true,
        type: "ira",
        retirementType: "ira_roth",
        taxTreatment: "after-tax",
        hasSecurities: true,
        securities: [
            {
                name: "Fidelity Growth Company Fund",
                ticker: "FDGRX",
                quantity: 350, // Approximately 7000 / current price of ~$20
                value: 7000.00, // Quantity * current price (assuming $20 for demo)
                purchasePrice: 18.50 // Average purchase price
            }
        ]
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e3", // New ID for 401k
        name: "401k Retirement Plan",
        accountProvider: "Employer 401k Provider",
        value: 55000.00,
        cashBalance: 0.00,
        currency: "USD",
        canInvest: true,
        type: "defined_contribution",
        retirementType: "401k",
        taxTreatment: "pre-tax",
        hasSecurities: true,
        securities: [
            {
                name: "Target Date Fund 2060",
                ticker: "TDF2060", // Generic ticker for a Target Date Fund
                quantity: 1375, // 55000 / $40 (assuming $40/share for TDF)
                value: 55000.00, // 1375 * 40
                purchasePrice: 38.00 // Example average purchase price
            }
        ]
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e4", // New ID for Checking Account
        name: "Checking Account",
        accountProvider: "Bank of America",
        value: 1500.00,
        cashBalance: 1500.00,
        currency: "USD",
        canInvest: false, // Cannot directly invest from checking
        type: "cash",
        hasSecurities: false,
        securities: [] // No securities in a checking account
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e5", // New ID for Savings Account
        name: "Ally Savings Account",
        accountProvider: "Ally Bank",
        value: 10000.00,
        cashBalance: 10000.00,
        currency: "USD",
        canInvest: false, // Cannot directly invest from savings
        type: "cash",
        hasSecurities: false,
        securities: [] // No securities in a savings account
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e6", // New ID for Credit Card
        name: "American Express Card",
        accountProvider: "American Express",
        value: -250.00, // Negative value represents outstanding balance
        cashBalance: 0.00, // N/A for credit card
        currency: "USD",
        canInvest: false,
        type: "debt",
        interestRate: 22.99, // Example APR
        monthlyPayment: 50.00, // Example minimum payment
        // Note: Total credit limit ($2k) is not directly in schema, but could be a custom field if needed.
        hasSecurities: false,
        securities: []
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e7", // New ID for Student Loan
        name: "Federal Student Loan",
        accountProvider: "Student Loan Servicer", // Example provider
        value: -15000.00, // Negative value represents outstanding balance
        cashBalance: 0.00, // N/A for loan
        currency: "USD",
        canInvest: false,
        type: "debt",
        interestRate: 5.50, // Example interest rate
        monthlyPayment: 150.00, // Example monthly payment
        hasSecurities: false,
        securities: []
    },
    {
        id: "6664e4a7d7b3a9e8f1c2d3e8", // New ID for HSA
        name: "Health Savings Account",
        accountProvider: "Optum Bank",
        value: 2000.00,
        cashBalance: 2000.00, // Assuming it's all in cash for this demo
        currency: "USD",
        canInvest: true, // HSAs can often invest beyond cash
        type: "hsa",
        retirementType: "hsa", // Matches enum for HSA type
        taxTreatment: "pre-tax", // Contributions are often pre-tax
        hasSecurities: false, // Assuming no investments for this demo
        securities: []
    }
];
