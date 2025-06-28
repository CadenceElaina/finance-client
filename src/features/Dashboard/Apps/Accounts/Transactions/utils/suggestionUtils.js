import { expenseCategories } from './categories';
import { getMerchantPreference } from './merchantHistory';
import { getMerchantCategorySuggestion } from './merchantPatterns';

const keywordMap = {
  'Food': [
    'food court','restaurant', 'cafe', 'dining', 'grubhub', 'doordash', 'uber eats', 'postmates',
    'grocery', 'market', 'safeway', 'kroger', 'walmart', 'target', 'whole foods',
    'starbucks', 'mcdonalds', 'subway', 'chipotle', 'pizza', 'burger', 'taco',
    'coffee', 'bakery', 'deli', 'food truck', 'takeout', 'delivery'
  ],
  Transportation: [
    'gas', 'fuel', 'chevron', 'shell', 'mobil', 'exxon', 'bp', '76',
    'uber', 'lyft', 'taxi', 'cab', 'parking', 'toll', 'metro', 'bus',
    'train', 'airline', 'flight', 'car rental', 'hertz', 'avis', 'enterprise'
  ],
  Housing: [
    'rent', 'mortgage', 'utility', 'internet', 'electric', 'gas company',
    'water', 'trash', 'sewer', 'comcast', 'verizon', 'at&t', 'spectrum',
    'pg&e', 'edison', 'home depot', 'lowes', 'maintenance', 'repair'
  ],
  'Personal Care & Health': [
    'pharmacy', 'cvs', 'walgreens', 'rite aid', 'gym', 'fitness', '24 hour fitness',
    'planet fitness', 'equinox', 'doctor', 'dentist', 'hospital', 'clinic',
    'salon', 'spa', 'barber', 'beauty', 'cosmetics', 'sephora', 'ulta'
  ],
  'Entertainment & Recreation': [
    'spotify', 'netflix', 'hulu', 'disney+', 'amazon prime', 'apple music',
    'youtube', 'movies', 'cinema', 'theater', 'concert', 'tickets', 'ticketmaster',
    'steam', 'playstation', 'xbox', 'nintendo', 'gaming', 'hobby', 'books',
    'amazon', 'barnes', 'noble'
  ],
  'Miscellaneous / Other': [
    'bank fee', 'atm fee', 'interest', 'late fee', 'overdraft', 'service charge',
    'annual fee', 'maintenance fee', 'postage', 'shipping', 'fedex', 'ups', 'usps'
  ],
  'Debt Payments': [
    'credit card payment', 'loan payment', 'student loan', 'car loan', 'mortgage payment',
    'line of credit', 'personal loan', 'auto loan'
  ],
  'Savings & Investments': [
    'transfer to savings', 'investment', 'retirement', '401k', 'ira', 'roth',
    'mutual fund', 'etf', 'stock', 'bond', 'savings account'
  ],
  'Reimbursements': [
    'redeem cash back', 'cash back', 'cashback', 'rebate', 'refund', 'reimbursement',
    'credit adjustment', 'reward', 'amazon.com credit'
  ]
};

/**
 * Enhanced category suggestion using merchant history, patterns, and keyword matching
 * @param {string} description - The transaction description.
 * @param {string} merchantName - The cleaned merchant name.
 * @param {string} extendedDetails - Extended transaction details.
 * @returns {{parent: string, sub: string, confidence?: number, source?: string}} - The suggested parent and sub-category.
 */
export const suggestCategory = (description, merchantName = '', extendedDetails = '') => {
  // Priority 1: Check merchant history first
  if (merchantName) {
    const merchantPreference = getMerchantPreference(merchantName);
    if (merchantPreference && merchantPreference.confidence >= 0.7) {
      return {
        parent: merchantPreference.parent,
        sub: merchantPreference.sub,
        confidence: merchantPreference.confidence,
        source: merchantPreference.source,
      };
    }
  }

  // Priority 2: Check merchant patterns using all available text
  if (merchantName) {
    const combinedText = [description, extendedDetails].filter(Boolean).join(' ');
    const patternSuggestion = getMerchantCategorySuggestion(merchantName, combinedText);
    if (patternSuggestion && patternSuggestion.confidence >= 0.6) {
      return {
        parent: patternSuggestion.parent,
        sub: patternSuggestion.sub,
        confidence: patternSuggestion.confidence,
        source: patternSuggestion.source,
        transactionType: patternSuggestion.transactionType,
      };
    }
  }

  // Priority 3: Fallback to keyword matching on description and extended details
  const combinedText = [description, extendedDetails].filter(Boolean).join(' ');
  const keywordSuggestion = suggestCategoryByKeywords(combinedText);
  
  // Combine with lower confidence merchant pattern if available
  if (merchantName) {
    const combinedTextForPattern = [description, extendedDetails].filter(Boolean).join(' ');
    const patternSuggestion = getMerchantCategorySuggestion(merchantName, combinedTextForPattern);
    if (patternSuggestion && patternSuggestion.confidence >= 0.4) {
      // If keyword matching had no result, use pattern even with lower confidence
      if (!keywordSuggestion.parent || keywordSuggestion.parent === 'Miscellaneous / Other') {
        return {
          parent: patternSuggestion.parent,
          sub: patternSuggestion.sub,
          confidence: patternSuggestion.confidence,
          source: patternSuggestion.source,
          transactionType: patternSuggestion.transactionType,
        };
      }
    }
  }

  return { ...keywordSuggestion, transactionType: 'expense' };
};

/**
 * Legacy keyword-based category suggestion for fallback
 * @param {string} description - The transaction description.
 * @returns {{parent: string, sub: string, confidence?: number, source?: string}} - The suggested parent and sub-category.
 */
const suggestCategoryByKeywords = (description) => {
  if (!description) return { parent: '', sub: '', confidence: 0, source: 'default' };

  const lowercasedDesc = description.toLowerCase();
  const words = lowercasedDesc.split(/\s+/);
  
  // Score each category based on keyword matches
  const categoryScores = {};
  
  for (const parentCategory in keywordMap) {
    categoryScores[parentCategory] = 0;
    
    for (const keyword of keywordMap[parentCategory]) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact phrase match (higher score)
      if (lowercasedDesc.includes(keywordLower)) {
        categoryScores[parentCategory] += 10;
      }
      
      // Individual word matches (lower score)
      const keywordWords = keywordLower.split(/\s+/);
      for (const keywordWord of keywordWords) {
        if (words.includes(keywordWord)) {
          categoryScores[parentCategory] += 3;
        }
      }
    }
  }
  
  // Find the category with the highest score
  let bestCategory = '';
  let highestScore = 0;
  
  for (const category in categoryScores) {
    if (categoryScores[category] > highestScore) {
      highestScore = categoryScores[category];
      bestCategory = category;
    }
  }
  
  // If no good match found, default to miscellaneous
  if (highestScore === 0) {
    bestCategory = 'Miscellaneous / Other';
  }
  
  // Try to find a matching sub-category
  let bestSubCategory = '';
  if (bestCategory && expenseCategories[bestCategory]) {
    const subCategories = expenseCategories[bestCategory];
    
    for (const subCat of subCategories) {
      const subCatLower = subCat.toLowerCase();
      if (lowercasedDesc.includes(subCatLower)) {
        bestSubCategory = subCat;
        break;
      }
      
      // Check for partial matches
      const subCatWords = subCatLower.split(/\s+/);
      if (subCatWords.some(word => words.includes(word))) {
        bestSubCategory = subCat;
      }
    }
  }
  
  // If we found a reimbursement category, treat it as income
  const isIncomeCategory = bestCategory === 'Reimbursements';
  
  // Calculate confidence based on score
  const confidence = Math.min(highestScore / 10, 1.0);
  
  return { 
    parent: bestCategory, 
    sub: isIncomeCategory ? '' : bestSubCategory, // Income categories don't have subcategories
    confidence,
    source: 'keywords',
    transactionType: isIncomeCategory ? 'income' : 'expense'
  };
};