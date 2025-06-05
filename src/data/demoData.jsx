
export const demoUser = {
  name: "Demo User",
  occupation: "Software Engineer",
  income: 85000,
  expenses: [
    { name: "Rent", amount: 1800 },
    { name: "Groceries", amount: 300 },
    { name: "Utilities", amount: 150 },
    { name: "Transportation", amount: 100 },
    { name: "Subscriptions", amount: 80 },
    { name: "Misc", amount: 200 },
  ],
  accounts: [
    { name: "Checking", balance: 3500 },
    { name: "Savings", balance: 6000 },
    { name: "Roth IRA", balance: 4200 },
    { name: "Brokerage", balance: 2200 },
  ],
  debts: [
    { name: "Student Loan", balance: 15000, rate: 5.5 },
    { name: "Credit Card", balance: 1200, rate: 18.99 },
  ],
  goals: [
    { name: "Emergency Fund", target: 10000, current: 6000 },
    { name: "New PC", target: 5000, current: 500 },
    { name: "Roth IRA Contribution", target: 7000, current: 4200 },
  ],
  investments: {
    dcaAmount: 50,
    frequency: "daily",
  },
};