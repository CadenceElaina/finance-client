export const formatCurrency = (value) => {
  if (typeof value !== "number") {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const formatPercentage = (value) => {
  if (typeof value !== "number") {
    return "0%";
  }
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
};