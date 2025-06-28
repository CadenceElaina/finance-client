/**
 * Simple test file to verify merchant cleaning and categorization improvements
 */

import { cleanMerchantName } from './dataCleaning.js';
import { suggestCategory } from './suggestionUtils.js';

// Test cases from user examples
const testCases = [
  {
    original: "CIRCLE K /CIRCHARLOTTE NC",
    location: "10000 NORTH TRYON ST, CHARLOTTENC, 28262",
    expected: "CIRCLE K"
  },
  {
    original: "TO THE STARS THERAPYRALEIGH NC",
    location: "9205 SULKIRK DR, RALEIGHNC, 27617",
    expected: "TO THE STARS THERAPY"
  },
  {
    original: "WAL-MART SUPERCENTERCHARLOTTE NC",
    location: "",
    expected: "WAL-MART SUPERCENTER"
  }
];

console.log("Testing merchant name cleaning:");
testCases.forEach((testCase, index) => {
  const cleaned = cleanMerchantName(testCase.original, testCase.location);
  const suggested = suggestCategory("", cleaned, "debt");
  
  console.log(`\nTest ${index + 1}:`);
  console.log(`Original: ${testCase.original}`);
  console.log(`Cleaned: ${cleaned}`);
  console.log(`Expected: ${testCase.expected}`);
  console.log(`Match: ${cleaned === testCase.expected ? "✓" : "✗"}`);
  console.log(`Category suggestion: ${suggested.parent} > ${suggested.sub}`);
  console.log(`Confidence: ${suggested.confidence || 'N/A'}`);
});

// Test specific category suggestions
console.log("\n\nTesting category suggestions:");
const categoryTests = [
  { merchant: "TO THE STARS THERAPY", description: "", accountType: "debt" },
  { merchant: "WAL-MART SUPERCENTER", description: "", accountType: "debt" },
  { merchant: "CIRCLE K", description: "", accountType: "debt" }
];

categoryTests.forEach((test, index) => {
  const suggestion = suggestCategory(test.description, test.merchant, test.accountType);
  console.log(`\nCategory Test ${index + 1}:`);
  console.log(`Merchant: ${test.merchant}`);
  console.log(`Suggestion: ${suggestion.parent} > ${suggestion.sub}`);
  console.log(`Source: ${suggestion.source || 'N/A'}`);
  console.log(`Confidence: ${suggestion.confidence || 'N/A'}`);
});
