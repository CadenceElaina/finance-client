# Named Defaults for Merchant Transactions

## Overview

The named defaults system allows users to create multiple, named default categorizations for recurring merchants instead of having just one auto-selected default. This provides much more flexibility for merchants that serve multiple purposes.

## Key Features

### Multiple Named Defaults Per Merchant

- Create different defaults for the same merchant based on purchase context
- Example: Circle K can have "Gas", "Convenience Store", and "Beer Run" defaults
- Example: Walmart can have "Groceries", "Household Items", and "Electronics" defaults

### Named Default Structure

Each named default includes:

- **Name**: User-friendly identifier (e.g., "Gas", "Groceries", "Apartment Supplies")
- **Category**: Primary transaction category
- **Sub-category**: Secondary classification (required for expenses)
- **Notes**: Optional contextual information
- **Usage Statistics**: Track how often each default is used

### User Workflow

1. **Import Transactions**: When importing CSV transactions, merchants are detected
2. **View Available Defaults**: Click the "Use X Saved Defaults" or "Create New Default" button
3. **Select or Create**:
   - Choose from existing named defaults for quick categorization
   - Create new named defaults for future use
4. **Apply Default**: Selected default automatically fills category, subcategory, and notes
5. **Manage Defaults**: Remove or update existing defaults as needed

### Example Use Cases

#### Circle K

- **"Gas"**: Transportation > Fuel (Gas/Petrol) | "Regular fuel purchases"
- **"Convenience"**: Food > Convenience/Other | "Snacks and drinks"
- **"Beer Run"**: Food > Alcohol | "Weekend beer purchases"

#### Walmart

- **"Groceries"**: Food > Groceries | "Weekly grocery shopping"
- **"Household"**: Housing > Other | "Apartment supplies and cleaning"
- **"Electronics"**: Shopping > Electronics | "Tech and gadgets"

#### Amazon

- **"Household"**: Housing > Other | "Regular household items"
- **"Books"**: Education > Books & Learning | "Educational materials"
- **"Prime Video"**: Entertainment > Streaming | "Monthly subscription"

## Technical Implementation

### Storage

- Named defaults are stored in localStorage under the key `merchantNamedDefaults`
- Separate from the legacy single-default system for backward compatibility

### Data Structure

```javascript
{
  "circle k": {
    "originalName": "CIRCLE K",
    "defaults": {
      "Gas": {
        "category": "Transportation",
        "subCategory": "Fuel (Gas/Petrol)",
        "notes": "Regular fuel purchases",
        "transactionType": "expense",
        "createdAt": 1735420800000,
        "lastUsed": 1735420800000,
        "usageCount": 5
      },
      "Convenience": {
        "category": "Food",
        "subCategory": "Convenience/Other",
        "notes": "Snacks and drinks",
        "transactionType": "expense",
        "createdAt": 1735420800000,
        "lastUsed": 1735420800000,
        "usageCount": 2
      }
    }
  }
}
```

### API Functions

- `createNamedDefault()`: Create a new named default
- `getMerchantNamedDefaults()`: Get all defaults for a merchant
- `applyNamedDefault()`: Use a default and update usage stats
- `removeNamedDefault()`: Delete a named default
- `getAllMerchantsWithDefaults()`: Get all merchants and their defaults

## Benefits

1. **Flexibility**: Handle merchants with multiple use cases
2. **User Control**: No auto-selection, explicit user choice
3. **Context Awareness**: Names and notes provide context
4. **Usage Tracking**: See which defaults are used most
5. **Easy Management**: Create, use, and remove defaults as needed
6. **Backward Compatibility**: Works alongside existing merchant learning

## Testing

Use the provided test CSV file `test-named-defaults.csv` to test the functionality:

- Contains Circle K transactions for both fuel and convenience scenarios
- Contains Walmart transactions for both groceries and household items
- Demonstrates the system's ability to handle context-based categorization

## Future Enhancements

- Auto-suggest default names based on transaction context
- Import/export default configurations
- Shared defaults across multiple users
- Machine learning to suggest which default to use based on transaction details
