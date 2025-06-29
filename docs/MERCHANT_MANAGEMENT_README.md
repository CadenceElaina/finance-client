# Merchant Management System

## Overview

The enhanced merchant management system provides comprehensive control over how merchant names are recognized, cleaned, and categorized during transaction imports. This system combines custom merchant naming with flexible categorization defaults.

## Key Components

### 1. Custom Merchant Names

**Purpose**: Override system-generated merchant names with user-preferred names
**Storage**: `customMerchantNames` in localStorage

#### Features:

- **Raw to Custom Mapping**: Map complex merchant strings to clean, recognizable names
- **Location-Aware**: Different names for the same merchant at different locations
- **Smart Suggestions**: AI-powered suggestions for common merchants
- **Usage Tracking**: Monitor how often custom names are used

#### Examples:

- `WAL-MART SUPERCENTERCHARLOTTE NC` → `Walmart`
- `SQ *CICFOODCOURT 2246 CHARLOTTE NC` → `CIC Food Court`
- `AMAZON.COM*RF3H72KF3 AMZN.COM/BILL WA` → `Amazon`

### 2. Named Defaults System

**Purpose**: Create multiple categorization defaults per merchant
**Storage**: `merchantNamedDefaults` in localStorage

#### Features:

- **Multiple Defaults**: Several named defaults per merchant
- **Context-Aware**: Different defaults for different purchase types
- **Usage Statistics**: Track which defaults are most commonly used
- **Notes Support**: Add contextual notes to defaults

#### Examples:

**Circle K**:

- "Gas" → Transportation > Fuel (Gas/Petrol)
- "Convenience" → Food > Convenience/Other
- "Beer Run" → Food > Alcohol

**Walmart**:

- "Groceries" → Food > Groceries
- "Household" → Housing > Other
- "Electronics" → Shopping > Electronics

### 3. Transaction Import Process

#### Enhanced Workflow:

1. **CSV Import**: User selects account and uploads CSV file
2. **Account Type Detection**: System determines transaction type meanings based on account
3. **Raw Merchant Processing**: Extract merchant name and location from CSV
4. **Custom Name Lookup**: Check if user has custom name for this merchant
5. **Name Resolution**: Use custom name if available, otherwise clean the raw name
6. **Category Suggestion**: Suggest categories based on merchant patterns
7. **Defaults Integration**: Show available named defaults for selection
8. **User Review**: Allow manual adjustment of all fields
9. **Learning**: Save user choices for future imports

#### Priority Order for Merchant Names:

1. **User Custom Name** (highest priority)
2. **System Cleaned Name** (fallback)

#### Priority Order for Categories:

1. **User Selected** (manual choice during review)
2. **Named Defaults** (user's saved defaults for this merchant)
3. **Pattern Matching** (system suggestions based on merchant patterns)
4. **Fallback Categories** (generic categories)

## User Interface

### Transaction Import Modal

#### Step 1: Account Selection

- Choose account type (affects transaction type interpretation)
- Account type help text explains positive/negative amount meanings

#### Step 2: Transaction Review

**Enhanced Features**:

- **Merchant Name Editing**: Click edit button (✏️) next to merchant names
- **Smart Suggestions**: Inline suggestions for merchant name improvements
- **Named Defaults**: "Use X Saved Defaults" or "Create New Default" buttons
- **Bulk Operations**: "Approve All with Defaults" includes both old and new default systems

#### Merchant Name Editor

- **Suggestions**: Common merchant name improvements
- **Custom Input**: Enter any custom name
- **Context**: Shows original raw merchant name and location
- **Real-time Preview**: See changes immediately

#### Named Defaults Manager

- **View Defaults**: See all saved defaults for a merchant
- **Create New**: Add new named defaults with custom names
- **Usage Stats**: See how often each default is used
- **Quick Apply**: One-click application of saved defaults

### Merchant Management Page

**Access**: "Manage Merchants" button in transaction import

#### Two Main Tabs:

**Custom Names Tab**:

- **View All**: List of all custom merchant name mappings
- **Edit**: Modify existing custom names
- **Remove**: Delete custom name mappings
- **Search**: Find specific merchants
- **Usage Stats**: See how often custom names are used

**Saved Defaults Tab**:

- **View All**: List of all merchants with named defaults
- **Manage Defaults**: View/remove individual defaults per merchant
- **Search**: Find merchants or specific defaults
- **Bulk Operations**: Clean up unused defaults

## Technical Implementation

### Data Structures

#### Custom Merchant Names

```javascript
{
  "normalized_key": {
    "rawMerchant": "WAL-MART SUPERCENTERCHARLOTTE NC",
    "location": "9999 Trade St, Charlotte NC 28206",
    "customName": "Walmart",
    "createdAt": 1735420800000,
    "lastUsed": 1735420800000,
    "usageCount": 15
  }
}
```

#### Named Defaults

```javascript
{
  "walmart": {
    "originalName": "Walmart",
    "defaults": {
      "Groceries": {
        "category": "Food",
        "subCategory": "Groceries",
        "notes": "Weekly grocery shopping",
        "transactionType": "expense",
        "createdAt": 1735420800000,
        "lastUsed": 1735420800000,
        "usageCount": 8
      },
      "Household": {
        "category": "Housing",
        "subCategory": "Other",
        "notes": "Apartment supplies",
        "transactionType": "expense",
        "createdAt": 1735420800000,
        "lastUsed": 1735420800000,
        "usageCount": 3
      }
    }
  }
}
```

### API Functions

#### Custom Merchant Names

- `setCustomMerchantName(raw, location, custom)`: Create/update custom name
- `getCustomMerchantName(raw, location)`: Get custom name if exists
- `getFinalMerchantName(raw, location, cleanFn)`: Get final name (custom or cleaned)
- `getMerchantNameSuggestions(raw)`: Get AI suggestions for improvements
- `getAllCustomMerchantNames()`: Get all custom names for management

#### Named Defaults

- `createNamedDefault(merchant, name, category, subCategory, notes)`: Create new default
- `getMerchantNamedDefaults(merchant)`: Get all defaults for merchant
- `applyNamedDefault(merchant, defaultName)`: Use a default and update stats
- `removeNamedDefault(merchant, defaultName)`: Delete a specific default

### Integration Points

#### Transaction Processing

```javascript
// In CSV import processing
const location = formatLocation(address, cityState, zipCode);
const finalMerchantName = getFinalMerchantName(
  rawMerchant,
  location,
  cleanMerchantName
);

// Category suggestion considers named defaults
const namedDefaults = getMerchantNamedDefaults(finalMerchantName);
const suggested = suggestCategory(description, finalMerchantName, details);
```

#### UI Components

- `InlineMerchantEditor`: Edit merchant names with suggestions
- `NamedDefaultsManager`: Manage defaults per transaction
- `MerchantManager`: Comprehensive merchant management
- `MerchantSuggestion`: Smart suggestions for new merchants

## Benefits

### For Users

1. **Consistency**: Same merchant always shows same name
2. **Flexibility**: Multiple defaults for different use cases
3. **Efficiency**: Quick categorization with saved defaults
4. **Control**: Full control over merchant names and categories
5. **Learning**: System learns and improves over time

### For Data Quality

1. **Cleaner Data**: Consistent merchant names across imports
2. **Better Categorization**: Context-aware defaults
3. **Reduced Manual Work**: Automated suggestions and defaults
4. **Fewer Errors**: Validated inputs and smart suggestions

## Testing Scenarios

### Test CSV Data

Use `test-named-defaults.csv` which includes:

- Circle K transactions (both fuel and convenience scenarios)
- Walmart transactions (groceries vs household)
- Complex merchant names requiring cleanup
- Amazon transactions with cryptic reference codes

### Test Workflow

1. **Import CSV**: Use test file with demo account
2. **Set Custom Names**:
   - "WAL-MART SUPERCENTERCHARLOTTE NC" → "Walmart"
   - "SQ \*CICFOODCOURT 2246 CHARLOTTE NC" → "CIC Food Court"
3. **Create Named Defaults**:
   - Circle K: "Gas", "Convenience", "Beer Run"
   - Walmart: "Groceries", "Household Items"
4. **Test Recognition**: Import similar transactions to verify learning
5. **Manage Merchants**: Use "Manage Merchants" to view and edit

### Edge Cases

- Merchants with no location data
- Very long merchant names
- Special characters in merchant names
- Duplicate merchant patterns
- Merchants with minimal differences

## Future Enhancements

### Short Term

- **Import/Export**: Share merchant configurations
- **Bulk Operations**: Mass update multiple merchants
- **Smart Matching**: Better fuzzy matching for similar merchants
- **Context Detection**: Auto-suggest defaults based on transaction details

### Long Term

- **Machine Learning**: Predict best defaults based on usage patterns
- **Collaborative Filtering**: Learn from other users (privacy-preserving)
- **API Integration**: Real merchant data from external services
- **Mobile Support**: Optimize for mobile transaction entry

## Security & Privacy

### Data Storage

- **Local Only**: All data stored in browser localStorage
- **No Server**: No merchant data sent to external servers
- **User Control**: Complete control over data retention and deletion

### Data Export

- Users can export their merchant configurations
- JSON format for easy backup and sharing
- Clear data structure for transparency

This comprehensive merchant management system provides users with complete control over their transaction import process while maintaining privacy and security.
