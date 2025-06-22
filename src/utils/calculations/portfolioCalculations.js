// src/utils/calculations/portfolioCalculations.js
export function calculatePortfolioMetrics(accounts, portfolioId = 'all') {
  const relevantAccounts = portfolioId === 'all' 
    ? accounts.filter(acc => acc.category === "Investments" && acc.hasSecurities)
    : accounts.filter(acc => 
        acc.category === "Investments" && 
        acc.hasSecurities && 
        acc.portfolioId === portfolioId
      );

  const totalValue = relevantAccounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
  
  const totalCostBasis = relevantAccounts.reduce((sum, acc) => {
    if (Array.isArray(acc.securities)) {
      return sum + acc.securities.reduce((secSum, sec) => 
        secSum + ((sec.purchasePrice || 0) * (sec.quantity || 0)), 0);
    }
    return sum;
  }, 0);

  const gainLoss = totalValue - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

  const cashBalance = relevantAccounts.reduce((sum, acc) => 
    sum + (acc.cashBalance || 0), 0);

  return {
    accounts: relevantAccounts,
    totalValue,
    totalCostBasis,
    gainLoss,
    gainLossPercent,
    cashBalance,
    securitiesCount: relevantAccounts.reduce((sum, acc) => 
      sum + (acc.securities?.length || 0), 0)
  };
}

export function getPortfolioAllocation(accounts, portfolioId = 'all') {
  const metrics = calculatePortfolioMetrics(accounts, portfolioId);
  
  const securitiesInPortfolio = [];
  metrics.accounts.forEach(acc => {
    if (Array.isArray(acc.securities)) {
      securitiesInPortfolio.push(...acc.securities);
    }
  });

  const aggregatedSecurities = securitiesInPortfolio.reduce((acc, curr) => {
    const key = curr.ticker || curr.name;
    if (!acc[key]) {
      acc[key] = { name: curr.name, value: 0 };
    }
    acc[key].value += curr.value || 0;
    return acc;
  }, {});

  const pieData = Object.values(aggregatedSecurities).filter(d => d.value > 0);
  
  if (metrics.cashBalance > 0) {
    pieData.push({ name: "Cash", value: metrics.cashBalance });
  }

  return {
    pieData: pieData.sort((a, b) => b.value - a.value),
    totalValue: metrics.totalValue + metrics.cashBalance
  };
}

export function getPerformanceDataForPortfolio(accounts, portfolioId) {
  let relevantAccounts = [];
  if (portfolioId === "all") {
    relevantAccounts = accounts.filter(
      (acc) => acc.category === "Investments" && acc.hasSecurities
    );
  } else {
    relevantAccounts = accounts.filter(
      (acc) =>
        acc.category === "Investments" &&
        acc.hasSecurities &&
        acc.portfolioId === portfolioId
    );
  }

  let events = [];
  let currentPortfolioValue = 0;
  
  relevantAccounts.forEach((acc) => {
    currentPortfolioValue += acc.value || 0;
    if (Array.isArray(acc.securities)) {
      acc.securities.forEach((sec) => {
        if (sec.datePurchased) {
          events.push({
            date: sec.datePurchased.slice(0, 10),
            valueChange:
              (sec.value || 0) - (sec.purchasePrice || 0) * (sec.quantity || 1),
            cost: (sec.purchasePrice || 0) * (sec.quantity || 1),
          });
        }
      });
    }
  });

  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = [];
  let cumulativeValue = 0;
  let cumulativeCost = 0;

  if (events.length > 0) {
    const dayBeforeFirstPurchase = new Date(events[0].date);
    dayBeforeFirstPurchase.setDate(dayBeforeFirstPurchase.getDate() - 1);
    data.push({
      date: dayBeforeFirstPurchase.toISOString().slice(0, 10),
      "Portfolio Value": 0,
      "Cost Basis": 0,
    });

    events.forEach((event) => {
      cumulativeValue += event.valueChange;
      cumulativeCost += event.cost;
      data.push({
        date: event.date,
        "Portfolio Value": cumulativeCost + cumulativeValue,
        "Cost Basis": cumulativeCost,
      });
    });

    const finalCostBasis = data[data.length - 1]["Cost Basis"];
    data.push({
      date: "Now",
      "Portfolio Value": relevantAccounts.reduce(
        (sum, acc) => sum + (acc.value || 0),
        0
      ),
      "Cost Basis": finalCostBasis,
    });
  } else if (relevantAccounts.length > 0) {
    data.push({
      date: "Now",
      "Portfolio Value": relevantAccounts.reduce(
        (sum, acc) => sum + (acc.value || 0),
        0
      ),
      "Cost Basis": 0,
    });
  }

  return data.filter(
    (item, index, self) => index === self.findIndex((t) => t.date === item.date)
  );
}