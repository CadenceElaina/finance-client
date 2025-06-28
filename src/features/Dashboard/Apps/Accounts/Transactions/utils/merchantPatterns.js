/**
 * Merchant pattern recognition and default category suggestions
 */

export const merchantPatterns = [
  // Income - Cash Back & Reimbursements
  {
    patterns: [
      /redeem cash back/i,
      /cash back/i,
      /cashback/i,
      /rebate/i,
      /refund/i,
      /reimbursement/i,
      /credit adjustment/i,
      /reward/i,
    ],
    defaultCategory: 'Reimbursements',
    defaultSubCategory: null, // Income categories don't have subcategories
    confidence: 0.9,
    transactionType: 'income',
  },

  // Grocery Stores
  {
    patterns: [
      /wal-?mart/i,
      /walmart/i,
      /target\b/i,
      /kroger/i,
      /publix/i,
      /harris teeter/i,
      /food lion/i,
      /ingles/i,
      /safeway/i,
      /giant\s+food/i,
      /whole foods/i,
      /trader joe/i,
      /costco/i,
      /sam'?s club/i,
    ],
    defaultCategory: 'Food',
    defaultSubCategory: 'Groceries',
    confidence: 0.8,
  },
  
  // Gas Stations (but lower confidence to allow convenience store override)
  {
    patterns: [
      /shell\b/i,
      /exxon/i,
      /bp\b/i,
      /chevron/i,
      /citgo/i,
      /marathon/i,
      /mobil/i,
      /sunoco/i,
    ],
    defaultCategory: 'Transportation',
    defaultSubCategory: 'Fuel (Gas/Petrol)',
    confidence: 0.9,
  },
  
  // Gas Stations with convenience indicators (lower confidence for fuel)
  {
    patterns: [
      /circle k/i,
      /7-eleven/i,
      /speedway/i,
      /wawa/i,
      /sheetz/i,
    ],
    defaultCategory: 'Transportation',
    defaultSubCategory: 'Fuel (Gas/Petrol)',
    confidence: 0.7, // Lower confidence to allow convenience override
  },
  
  // Convenience Stores (override gas station default when convenience keywords present)
  {
    patterns: [
      /circle k.*convenience/i,
      /7-eleven.*convenience/i,
      /speedway.*convenience/i,
      /wawa.*convenience/i,
      /sheetz.*convenience/i,
    ],
    contextKeywords: [
      'convenience', 'convenienci', 'convenient', 'conv store', 'c-store',
      'snack', 'snacks', 'drink', 'beverage', 'soda', 'beer', 'alcohol',
      'lottery', 'cigarette', 'tobacco', 'candy', 'chips'
    ],
    defaultCategory: 'Food',
    defaultSubCategory: 'Convenience/Other',
    confidence: 0.8, // Higher than gas station confidence
  },
  
  // Restaurants & Fast Food
  {
    patterns: [
      /mcdonald'?s/i,
      /burger king/i,
      /wendy'?s/i,
      /taco bell/i,
      /kfc\b/i,
      /subway\b/i,
      /chick-fil-a/i,
      /starbucks/i,
      /dunkin/i,
      /pizza hut/i,
      /domino'?s/i,
      /papa john/i,
    ],
    defaultCategory: 'Food',
    defaultSubCategory: 'Restaurants / Dining Out',
    confidence: 0.9,
  },

  // Coffee Shops
  {
    patterns: [
      /starbucks/i,
      /dunkin/i,
      /coffee/i,
      /cafe\b/i,
      /espresso/i,
    ],
    defaultCategory: 'Food',
    defaultSubCategory: 'Coffee Shops',
    confidence: 0.7,
  },

  // Healthcare & Therapy
  {
    patterns: [
      /therapy/i,
      /therapist/i,
      /counseling/i,
      /counselor/i,
      /psychology/i,
      /psychologist/i,
      /psychiatr/i,
      /mental health/i,
      /behavioral health/i,
    ],
    defaultCategory: 'Personal Care & Health',
    defaultSubCategory: 'Healthcare - Mental Health',
    confidence: 0.9,
  },

  // Medical
  {
    patterns: [
      /medical/i,
      /hospital/i,
      /clinic/i,
      /urgent care/i,
      /doctor/i,
      /physician/i,
      /dentist/i,
      /dental/i,
      /pharmacy/i,
      /cvs\b/i,
      /walgreens/i,
      /rite aid/i,
    ],
    defaultCategory: 'Personal Care & Health',
    defaultSubCategory: 'Healthcare - Medical Expenses',
    confidence: 0.8,
  },

  // Fitness & Gym
  {
    patterns: [
      /gym\b/i,
      /fitness/i,
      /planet fitness/i,
      /la fitness/i,
      /gold'?s gym/i,
      /ymca/i,
      /anytime fitness/i,
      /crossfit/i,
    ],
    defaultCategory: 'Personal Care & Health',
    defaultSubCategory: 'Gym / Fitness',
    confidence: 0.9,
  },

  // Hair & Beauty
  {
    patterns: [
      /salon/i,
      /barber/i,
      /hair/i,
      /nail/i,
      /spa\b/i,
      /beauty/i,
      /massage/i,
    ],
    defaultCategory: 'Personal Care & Health',
    defaultSubCategory: 'Hair & Beauty',
    confidence: 0.8,
  },

  // Online Services
  {
    patterns: [
      /amazon/i,
      /netflix/i,
      /spotify/i,
      /apple music/i,
      /hulu/i,
      /disney/i,
      /google/i,
      /microsoft/i,
      /adobe/i,
    ],
    defaultCategory: 'Miscellaneous / Other',
    defaultSubCategory: 'Software & Apps',
    confidence: 0.7,
  },

  // Transportation
  {
    patterns: [
      /uber/i,
      /lyft/i,
      /taxi/i,
      /parking/i,
      /toll/i,
      /metro/i,
      /bus\b/i,
      /train/i,
      /airline/i,
      /airport/i,
    ],
    defaultCategory: 'Transportation',
    defaultSubCategory: 'Ride-sharing / Taxi',
    confidence: 0.8,
  },

  // Food Courts & Markets
  {
    patterns: [
      /foodcourt/i,
      /food court/i,
      /365 market/i,
      /market/i,
    ],
    defaultCategory: 'Food',
    defaultSubCategory: 'Restaurants / Dining Out',
    confidence: 0.8,
  },

  // Gaming & Entertainment
  {
    patterns: [
      /riot games/i,
      /steam/i,
      /playstation/i,
      /xbox/i,
      /nintendo/i,
      /blizzard/i,
      /epic games/i,
    ],
    defaultCategory: 'Entertainment & Recreation',
    defaultSubCategory: 'Video Games',
    confidence: 0.9,
  },
];

/**
 * Find the best merchant pattern match for a given merchant name
 * @param {string} merchantName - The cleaned merchant name
 * @returns {object|null} - The best matching pattern or null
 */
export const findMerchantPattern = (merchantName) => {
  if (!merchantName) return null;

  let bestMatch = null;
  let highestConfidence = 0;

  for (const pattern of merchantPatterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(merchantName)) {
        if (pattern.confidence > highestConfidence) {
          highestConfidence = pattern.confidence;
          bestMatch = pattern;
        }
        break; // Found a match for this pattern, move to next pattern
      }
    }
  }

  return bestMatch;
};

/**
 * Find the best merchant pattern match with context awareness
 * @param {string} merchantName - The cleaned merchant name
 * @param {string} combinedText - Combined merchant name and description text
 * @returns {object|null} - The best matching pattern or null
 */
export const findMerchantPatternWithContext = (merchantName, combinedText) => {
  if (!merchantName) return null;

  let bestMatch = null;
  let highestConfidence = 0;

  for (const pattern of merchantPatterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(merchantName)) {
        let confidence = pattern.confidence;
        
        // Check if this pattern has context keywords
        if (pattern.contextKeywords) {
          const hasContextKeyword = pattern.contextKeywords.some(keyword => 
            combinedText.includes(keyword.toLowerCase())
          );
          
          // If it has context keywords and they match, boost confidence
          // If it has context keywords but they don't match, reduce confidence
          if (hasContextKeyword) {
            confidence = Math.min(confidence + 0.1, 0.95); // Boost confidence
          } else if (pattern.contextKeywords.length > 0) {
            confidence = Math.max(confidence - 0.2, 0.3); // Reduce confidence
          }
        }
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = { ...pattern, confidence };
        }
        break; // Found a match for this pattern, move to next pattern
      }
    }
  }

  return bestMatch;
};

/**
 * Get merchant-specific category suggestion
 * @param {string} merchantName - The cleaned merchant name
 * @param {string} description - Transaction description
 * @returns {object} - Category suggestion with confidence
 */
export const getMerchantCategorySuggestion = (merchantName, description = '') => {
  // Create combined text for context analysis
  const combinedText = `${merchantName} ${description}`.toLowerCase();
  
  // Check merchant name first with context awareness
  const merchantPattern = findMerchantPatternWithContext(merchantName, combinedText);
  
  if (merchantPattern) {
    return {
      parent: merchantPattern.defaultCategory,
      sub: merchantPattern.defaultSubCategory,
      confidence: merchantPattern.confidence,
      source: 'merchant_pattern',
      transactionType: merchantPattern.transactionType || 'expense',
    };
  }

  // Also check description for income patterns (like "Redeem Cash Back")
  const descriptionPattern = findMerchantPattern(description);
  if (descriptionPattern) {
    return {
      parent: descriptionPattern.defaultCategory,
      sub: descriptionPattern.defaultSubCategory,
      confidence: descriptionPattern.confidence * 0.8, // Lower confidence for description match
      source: 'description_pattern',
      transactionType: descriptionPattern.transactionType || 'expense',
    };
  }

  return {
    parent: 'Miscellaneous / Other',
    sub: 'Other Expenses',
    confidence: 0.1,
    source: 'default',
    transactionType: 'expense',
  };
};
