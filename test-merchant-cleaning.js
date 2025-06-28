import { cleanMerchantName } from './dataCleaning.js';

// Test the problematic merchants
const testCases = [
  "CICFOODCOURT 2246 CHARLOTTE NC",
  "365 MARKET M 888 432TROY MI", 
  "TO THE STARS THERAPYRALEIGH NC",
  "WAL-MART SUPERCENTERCHARLOTTE NC",
  "CIRCLE K 05112 CHARLOTTE NC",
  "RIOT GAMES INC LOS ANGELES CA"
];

console.log("Testing merchant name cleaning:");
testCases.forEach(merchant => {
  const cleaned = cleanMerchantName(merchant);
  console.log(`${merchant} -> ${cleaned}`);
});
