export const cleanMerchantName = (name) => {
  if (!name) return "";

  let cleanedName = name
    .replace(/(\d{2,}\s*)+$/, "") // Remove trailing numbers (like store numbers)
    .replace(/#\d+/, "") // Remove # followed by numbers
    .replace(/\b(NC|WA|MI|CA|NY)\b/gi, "") // Remove state abbreviations
    .replace(/CHARLOTTE|RALEIGH|TROY/gi, "") // Remove city names
    .replace(/(\s{2,})/g, " ") // Replace multiple spaces with a single space
    .trim();

  // Specific common cases
  if (cleanedName.toLowerCase().startsWith("wal-mart")) return "Walmart";
  if (cleanedName.toLowerCase().startsWith("circle k")) return "Circle K";
  if (cleanedName.toLowerCase().includes("amazon marketplace")) return "Amazon";
  if (cleanedName.toLowerCase().includes("365 market")) return "365 Market";
  if (cleanedName.toLowerCase().includes("cicfoodcourt")) return "CIC Food Court";
  if (cleanedName.toLowerCase().includes("extra space")) return "Extra Space Storage";
  if (cleanedName.toLowerCase().includes("to the stars therapy")) return "To The Stars Therapy";
  if (cleanedName.toLowerCase().includes("mobile payment")) return "Mobile Payment";


  // Capitalize first letter of each word
  return cleanedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const inferTransactionType = (transaction, accountType) => {
  const amount = parseFloat(transaction.Amount || 0);
  const description = transaction.Description?.toLowerCase() || "";

  if (description.includes("payment - thank you") || description.includes("payment received")) {
    return "payment";
  }

  if (accountType === 'credit_card') {
    return amount > 0 ? 'payment' : 'expense';
  }

  return amount > 0 ? 'income' : 'expense';
};