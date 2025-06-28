import { expenseCategories, incomeCategories } from "./categories";

const categoryKeywords = {
  "Salary/Wages": ["salary", "payroll", "wages"],
  "Freelance/Side Hustle": ["freelance", "contract", "side hustle"],
  "Investment Income": ["dividend", "interest", "capital gains"],
  "Gifts Received": ["gift", "present"],
  Reimbursements: ["reimbursement"],
  Housing: ["rent", "mortgage", "utilities", "internet", "insurance", "maintenance"],
  Transportation: ["car payment", "car insurance", "fuel", "gas", "public transport", "taxi", "uber", "lyft", "parking", "tolls"],
  "Food & Dining": ["groceries", "restaurant", "coffee", "takeout", "delivery", "alcohol", "bar", "pet food"],
  "Personal Care & Health": ["healthcare", "medical", "insurance", "gym", "fitness", "hair", "beauty", "clothing", "personal care"],
  "Entertainment & Recreation": ["hobbies", "movies", "shows", "concerts", "events", "vacation", "travel", "books", "magazines", "games", "sporting"],
  "Education & Development": ["tuition", "student loan", "books", "supplies", "courses", "workshops"],
  "Debt Payments": ["credit card", "loan"],
  "Giving & Gifts": ["donation", "charity", "gift"],
  "Miscellaneous / Other": ["cash", "atm", "bank fee", "postage", "shipping", "software", "apps", "membership", "tax"],
};

export const suggestCategory = (description) => {
  if (!description) return { parent: "", sub: "" };

  const lowercasedDescription = description.toLowerCase();

  for (const parent in categoryKeywords) {
    for (const keyword of categoryKeywords[parent]) {
      if (lowercasedDescription.includes(keyword)) {
        if (expenseCategories[parent]) {
          // It's an expense category, find a matching sub-category if possible
          for (const sub of expenseCategories[parent]) {
            if (lowercasedDescription.includes(sub.toLowerCase())) {
              return { parent, sub };
            }
          }
          // If no sub-category matches, return the parent
          return { parent, sub: "" };
        } else {
          // It's an income category
          return { parent, sub: "" };
        }
      }
    }
  }

  return { parent: "", sub: "" };
};