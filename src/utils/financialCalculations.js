// Calculate net worth from accounts array
export function getNetWorth(accounts) {
    return accounts.reduce((sum, acc) => sum + (typeof acc.value === 'number' ? acc.value : 0), 0);
}

// Calculate total cash
export function getTotalCash(accounts) {
    return accounts.filter(acc => acc.category === 'Cash')
        .reduce((sum, acc) => sum + (acc.value || 0), 0);
}

// Calculate total assets (cash + investments)
export function getTotalAssets(accounts) {
    return accounts
        .filter(acc => acc.category === 'Cash' || acc.category === 'Investments')
        .reduce((sum, acc) => sum + (acc.value || 0), 0);
}

// Calculate total liabilities (debt)
export function getTotalLiabilities(accounts) {
    return accounts
        .filter(acc => acc.category === 'Debt')
        .reduce((sum, acc) => sum + (acc.value || 0), 0);
}