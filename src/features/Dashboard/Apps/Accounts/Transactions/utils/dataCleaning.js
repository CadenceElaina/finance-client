/**
 * Cleans a merchant name by removing common extraneous details and location information.
 * @param {string} merchant - The original merchant name.
 * @param {string} locationInfo - Optional location info to help remove duplicates from merchant name.
 * @returns {string} - The cleaned merchant name.
 */
export const cleanMerchantName = (merchant, locationInfo = "") => {
  if (!merchant) return "Unknown Merchant";

  let cleaned = merchant;

  // Remove common prefixes and card processing indicators
  cleaned = cleaned
    .replace(/^(SQ|Tst)\*/gi, "") // Remove Square/Test prefixes
    .replace(/^(CHECKCARD|POS DEBIT|DEBIT CARD)\s*/i, "") // Remove card indicators
    .replace(/ONLINE PAYMENT/gi, "")
    .replace(/\bPOS\b/gi, "") // Point of Sale
    .replace(/\b(DEBIT|CREDIT)\b/gi, "") // Card type
    .replace(/\s*help\.uber\.com\s*/gi, " ")
    .replace(/\s*COM\s*/gi, " ")
    .replace(/[#*]+/g, ""); // Remove hash/asterisk symbols

  // More conservative location removal - only remove patterns at the end or obvious duplicates
  const conservativeLocationPatterns = [
    // Only remove location info at the end of the merchant name
    /\s+(CHARLOTTE|RALEIGH|SEATTLE|LOS ANGELES|TROY)\s+(NC|CA|WA|MI)\s*$/gi,
    /\s+[A-Z]{2}\s*\d{5}\s*$/g, // State + ZIP at end
    // Remove specific location duplicates that are obvious
    /CHARLOTTE\s*NC\s*CHARLOTTE\s*NC/gi,
    /RALEIGH\s*NC\s*RALEIGH\s*NC/gi,
  ];

  // Apply conservative location patterns
  conservativeLocationPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // If we have location info, only remove exact matches that appear redundantly
  if (locationInfo) {
    const locationParts = locationInfo.split(/[,\s]+/).filter(part => 
      part.length > 3 && /^[A-Z]+$/.test(part) && part !== 'UNITED' && part !== 'STATES'
    );
    
    // Only remove location parts if they appear redundantly (like "CHARLOTTE NC" appearing twice)
    locationParts.forEach(part => {
      // Only remove if it appears at the end and is clearly redundant
      const redundantPattern = new RegExp(`\\s+${part}\\s*$`, 'gi');
      if (cleaned.match(redundantPattern) && cleaned.indexOf(part) !== cleaned.lastIndexOf(part)) {
        cleaned = cleaned.replace(redundantPattern, '');
      }
    });
  }

  // Conservative cleanup - only remove obvious noise
  const cleanupPatterns = [
    { pattern: /\s*\d{8,}\s*/g, replacement: ' ' }, // Remove 8+ digit numbers (likely transaction IDs)
    { pattern: /\s{2,}/g, replacement: ' ' }, // Multiple spaces to single
  ];

  cleanupPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  // Final cleanup
  cleaned = cleaned
    .replace(/^\s*\/+\s*/, '') // Remove leading slashes
    .replace(/\s*\/+\s*$/, '') // Remove trailing slashes
    .replace(/^[,\s]+|[,\s]+$/g, '') // Remove leading/trailing commas and spaces
    .trim();

  return cleaned || "Unknown Merchant";
};

/**
 * Formats location by combining address components and cleaning
 * @param {string} address - Street address
 * @param {string} cityState - City and state
 * @param {string} zipCode - ZIP code
 * @returns {string} - Formatted location string
 */
export const formatLocation = (address, cityState, zipCode) => {
  const parts = [address, cityState, zipCode].filter(Boolean);
  if (parts.length === 0) return '';
  
  let location = parts.join(', ');
  // Clean up common location issues
  location = location
    .replace(/\s{2,}/g, ' ') // Multiple spaces
    .replace(/,,+/g, ',') // Multiple commas
    .trim();
    
  return location;
};

/**
 * Formats the transaction description by combining and cleaning fields.
 * Removes redundant information and phone numbers that aren't 9-10 digits.
 * @param {object} original - The original transaction data from CSV.
 * @returns {string} - The formatted description.
 */
export const formatDescription = (original) => {
  const { description = "", extended_details = "", merchant = "" } = original;

  // Start with the most descriptive field, preferring extended_details
  let baseDescription = (extended_details || description || "").trim();
  let cleanedMerchant = cleanMerchantName(merchant)
    .replace(/UNKNOWN MERCHANT/i, "")
    .trim();

  // Remove the cleaned merchant name from the description to avoid redundancy
  if (cleanedMerchant) {
    const merchantRegex = new RegExp(`\\b${cleanedMerchant}\\b`, "gi");
    baseDescription = baseDescription.replace(merchantRegex, "");
  }

  // Also remove the original merchant string if it's different
  if (merchant && merchant !== cleanedMerchant) {
    const originalMerchantRegex = new RegExp(`\\b${merchant}\\b`, "gi");
    baseDescription = baseDescription.replace(originalMerchantRegex, "");
  }

  // Remove common unhelpful phrases
  const noise = [
    /Description\s*:\s*F\//gi,
    /MOBILE PAYM MOBILE PAYMENT - THANK YOU/gi,
    /help\.uber\.com/gi,
    /RESTAURANT/gi,
    /CHARLOTTE NC/gi,
    /SAN CA/gi,
    /TRO MI/gi,
    /UNITED STATES/gi,
    /\b\d{7,}\b/g, // Remove long numbers (likely transaction IDs)
    /\b[A-Z0-9]{15,}\b/g, // Remove long alphanumeric reference codes
  ];

  noise.forEach((regex) => {
    baseDescription = baseDescription.replace(regex, "");
  });

  // Clean up formatting
  let combined = baseDescription
    .replace(/\s+-\s*-\s*/, " - ") // Fix multiple dashes
    .replace(/\s{2,}/g, " ") // Multiple spaces
    .replace(/^\s*-\s*/, "") // Leading dash
    .replace(/\s*-\s*$/, "") // Trailing dash
    .trim();

  // If cleaning leaves it empty, use the cleaned merchant name
  return combined || cleanedMerchant || "Transaction";
};

/**
 * Detects if a transaction might be recurring based on description patterns
 * @param {string} description - Transaction description
 * @param {string} merchant - Merchant name
 * @returns {boolean} - Whether transaction appears to be recurring
 */
export const detectRecurring = (description, merchant) => {
  const recurringKeywords = [
    'subscription', 'monthly', 'recurring', 'autopay', 'auto pay',
    'netflix', 'spotify', 'hulu', 'disney+', 'amazon prime',
    'gym membership', 'insurance', 'rent', 'mortgage'
  ];
  
  const combined = `${description} ${merchant}`.toLowerCase();
  return recurringKeywords.some(keyword => combined.includes(keyword));
};

/**
 * Infers the transaction type ('income' or 'expense') based on the amount
 * and the account type.
 * @param {object} original - The original transaction data.
 * @param {string} accountSubType - The subType of the selected account (e.g., 'checking', 'credit card').
 * @param {string} accountCategory - The category of the selected account (e.g., 'Cash', 'Debt').
 * @returns {string} - The inferred transaction type ('income' or 'expense').
 */
export const inferTransactionType = (original, accountSubType, accountCategory) => {
  const amount = parseFloat(original.amount);
  if (isNaN(amount)) return "expense";

  const subType = accountSubType?.toLowerCase();
  const category = accountCategory?.toLowerCase();

  // For debt accounts (credit cards, loans, etc.), the logic is:
  // - Positive amounts = new charges/debt = expense
  // - Negative amounts = payments/refunds = income (reduces debt)
  if (category === "debt" || 
      subType === "credit card" || 
      subType === "mortgage" || 
      subType === "personal loan" || 
      subType === "auto loan" || 
      subType === "student loan" || 
      subType === "line of credit" ||
      subType === "other debt") {
    return amount > 0 ? "expense" : "income";
  }

  // For cash accounts (checking, savings, cash, money market), the logic is:
  // - Positive amounts = deposits/income = income
  // - Negative amounts = withdrawals/expenses = expense
  return amount > 0 ? "income" : "expense";
};