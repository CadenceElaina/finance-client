export const transactionCategories = {
  types: [
    {
      name: 'Income',
      categories: [
        'Salary/Wages',
        'Freelance/Side Hustle',
        'Investment Income',
        'Gifts Received',
        'Reimbursements',
        'Other Income',
      ],
    },
    {
      name: 'Expense',
      categories: {
        Housing: [
          'Rent / Mortgage Payment',
          'Utilities',
          'Internet',
          'Home Insurance / Property Tax',
          'Home Maintenance & Repairs',
          'Furnishings & Decor',
          'Other Housing',
        ],
        Transportation: [
          'Car Payment',
          'Car Insurance',
          'Fuel (Gas/Petrol)',
          'Public Transportation',
          'Ride-sharing / Taxi',
          'Car Maintenance & Repairs',
          'Parking & Tolls',
          'Other Transportation',
        ],
        'Food': [
          'Groceries',
          'Restaurants / Dining Out',
          'Coffee Shops',
          'Takeout / Delivery',
          'Alcohol & Bars',
          'Pet Food & Supplies',
          'Other Food',
        ],
        'Personal Care & Health': [
          'Healthcare - Medical Expenses',
          'Healthcare - Insurance Premiums',
          'Healthcare - Mental Health',
          'Gym / Fitness',
          'Hair & Beauty',
          'Clothing & Accessories',
          'Personal Care Products',
          'Other Personal Care',
        ],
        'Entertainment & Recreation': [
          'Hobbies',
          'Movies & Shows',
          'Concerts & Events',
          'Vacations & Travel',
          'Books & Magazines',
          'Video Games',
          'Sporting Events',
          'Other Entertainment',
        ],
        'Education & Development': [
          'Tuition & Fees',
          'Student Loan Payments',
          'Books & Supplies (Education)',
          'Courses & Workshops',
          'Other Education',
        ],
        'Debt Payments': [
          'Credit Card Payments (Interest/Fees)',
          'Personal Loan Payments (Interest)',
          'Other Loan Interest',
        ],
        'Savings & Investments': [
          'Savings Contributions',
          'Investment Contributions',
          'Retirement Contributions',
          'College Savings (e.g., 529)',
        ],
        'Giving & Gifts': ['Charitable Donations', 'Gifts Given'],
        'Miscellaneous / Other': [
          'Cash Withdrawal (Uncategorized)',
          'Bank Fees',
          'ATM Fees',
          'Postage & Shipping',
          'Software & Apps',
          'Membership Fees',
          'Taxes (Non-Payroll)',
          'Other Expenses',
        ],
      },
    },
  ],
};

export const incomeCategories = transactionCategories.types.find(
  (t) => t.name === 'Income'
).categories;
export const expenseCategories = transactionCategories.types.find(
  (t) => t.name === 'Expense'
).categories;