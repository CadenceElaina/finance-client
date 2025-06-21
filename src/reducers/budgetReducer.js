// src/reducers/budgetReducer.js
export const budgetReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_INCOME':
      return {
        ...state,
        income: { ...state.income, ...action.payload }
      };
    case 'UPDATE_EXPENSES':
      return {
        ...state,
        monthlyExpenses: action.payload
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        monthlyExpenses: [...state.monthlyExpenses, action.payload]
      };
    case 'SYNC_DEBT_PAYMENTS':
      return {
        ...state,
        monthlyExpenses: syncDebtPaymentsToExpenses(action.accounts, state.monthlyExpenses)
      };
    default:
      return state;
  }
};