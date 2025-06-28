/**
 * Test script to verify transaction categorization improvements
 */

import { cleanMerchantName } from './src/features/Dashboard/Apps/Accounts/Transactions/utils/dataCleaning.js';
import { suggestCategory } from './src/features/Dashboard/Apps/Accounts/Transactions/utils/suggestionUtils.js';
import { recordMerchantChoice, getMerchantPreference, isValidMerchantChoice, removeMerchantChoice } from './src/features/Dashboard/Apps/Accounts/Transactions/utils/merchantHistory.js';

// Test cases for the improvements
const testCases = [
  {
    name: "CICFOODCOURT with RESTAURANT in extended details",
    merchant: "CICFOODCOURT 2246 CHARLOTTE NC",
    description: "CICFOODCOURT 2246 CHARLOTTE NC", 
    extendedDetails: "276198 276198 28262 RESTAURANT CICFOODCOURT 2246 CHARLOTTE NC RESTAURANT 276198 28262",
    expected: {
      category: "Food",
      subCategory: "Restaurants & Dining Out"
    }
  },
  {
    name: "365 MARKET with empty defaults bug test",
    merchant: "365 MARKET M 888 432TROY MI",
    description: "365 MARKET M 888 432 TROY MI",
    extendedDetails: "8883657392 276198 276198 CICFOODCOU CHARLOTTE NC RESTAURANT",
    expected: {
      category: "Food",
      subCategory: "Groceries"
    }
  },
  {
    name: "Cash back transaction",
    merchant: "AMAZON.COM CREDIT",
    description: "REDEEM CASH BACK",
    extendedDetails: "CASH BACK REWARD CREDIT",
    expected: {
      category: "Reimbursements",
      transactionType: "income"
    }
  }
];

console.log("=== Testing Transaction Categorization Improvements ===\n");

// Test merchant name cleaning
console.log("1. Testing Merchant Name Cleaning:");
testCases.forEach(test => {
  const cleaned = cleanMerchantName(test.merchant);
  console.log(`  ${test.name}:`);
  console.log(`    Original: "${test.merchant}"`);
  console.log(`    Cleaned:  "${cleaned}"`);
  console.log("");
});

// Test category suggestion with extended details
console.log("2. Testing Category Suggestions with Extended Details:");
testCases.forEach(test => {
  const cleaned = cleanMerchantName(test.merchant);
  const suggestion = suggestCategory(test.description, cleaned, test.extendedDetails);
  console.log(`  ${test.name}:`);
  console.log(`    Merchant: "${cleaned}"`);
  console.log(`    Description: "${test.description}"`);
  console.log(`    Extended: "${test.extendedDetails}"`);
  console.log(`    Suggested: ${suggestion.parent} → ${suggestion.sub || 'None'}`);
  console.log(`    Type: ${suggestion.transactionType || 'expense'}`);
  console.log(`    Confidence: ${suggestion.confidence || 0}`);
  console.log(`    Source: ${suggestion.source || 'unknown'}`);
  console.log("");
});

// Test validation logic
console.log("3. Testing Validation Logic:");

// Test invalid choices
const invalidCases = [
  { merchant: "TEST", category: "", subCategory: "", type: "expense", should: false },
  { merchant: "TEST", category: "Select Category", subCategory: "", type: "expense", should: false },
  { merchant: "TEST", category: "Food", subCategory: "", type: "expense", should: false },
  { merchant: "TEST", category: "Food", subCategory: "Select Sub-Category", type: "expense", should: false },
  { merchant: "TEST", category: "Reimbursements", subCategory: "", type: "income", should: true },
  { merchant: "TEST", category: "Food", subCategory: "Restaurants & Dining Out", type: "expense", should: true }
];

invalidCases.forEach((testCase, index) => {
  const isValid = isValidMerchantChoice(testCase.merchant, testCase.category, testCase.subCategory, testCase.type);
  const status = isValid === testCase.should ? "✓ PASS" : "✗ FAIL";
  console.log(`  Test ${index + 1}: ${status}`);
  console.log(`    Category: "${testCase.category}", Sub: "${testCase.subCategory}", Type: ${testCase.type}`);
  console.log(`    Expected: ${testCase.should}, Got: ${isValid}`);
  console.log("");
});

// Test merchant learning with validation
console.log("4. Testing Merchant Learning with Validation:");

// Clear any existing data for test merchant
const testMerchant = "TEST MERCHANT FOR VALIDATION";
removeMerchantChoice(testMerchant);

// Try to record invalid choice
console.log("  Attempting to record invalid choice (empty category):");
const result1 = recordMerchantChoice(testMerchant, "", "", "", "expense");
console.log(`    Result: ${result1 ? "Recorded" : "Rejected"} (should be Rejected)`);

// Try to record valid choice
console.log("  Attempting to record valid choice:");
const result2 = recordMerchantChoice(testMerchant, "Food", "Restaurants & Dining Out", "", "expense");
console.log(`    Result: ${result2 ? "Recorded" : "Rejected"} (should be Recorded)`);

// Check if preference was saved correctly
const preference = getMerchantPreference(testMerchant);
console.log("  Retrieved preference:");
console.log(`    Category: ${preference?.parent || "None"}`);
console.log(`    Sub-category: ${preference?.sub || "None"}`);
console.log(`    Confidence: ${preference?.confidence || 0}`);

// Clean up
removeMerchantChoice(testMerchant);

console.log("\n=== Test Complete ===");
