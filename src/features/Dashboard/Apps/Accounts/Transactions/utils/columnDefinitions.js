// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format currency with proper sign and color
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  const formatted = Math.abs(amount).toFixed(2);
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}$${formatted}`;
};

// Format location by combining address components
const formatLocation = (location) => {
  if (!location) return '';
  return location.length > 30 ? location.substring(0, 30) + '...' : location;
};

export const getColumnDefinitions = () => [
  {
    label: "Date",
    key: "transaction_date",
    sortable: true,
    formatter: formatDate,
    width: "100px"
  },
  {
    label: "Merchant",
    key: "merchant_name",
    sortable: true,
    width: "140px"
  },
  {
    label: "Location", 
    key: "location",
    formatter: formatLocation,
    width: "120px"
  },
  {
    label: "Description",
    key: "description",
    width: "180px"
  },
  {
    label: "Type",
    key: "type",
    sortable: true,
    formatter: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '',
    width: "80px"
  },
  {
    label: "Category",
    key: "category_id",
    sortable: true,
    width: "130px"
  },
  {
    label: "Sub-Category",
    key: "subCategory",
    width: "130px"
  },
  {
    label: "Recurring",
    key: "is_recurring",
    formatter: (value) => value ? '✓' : '',
    width: "80px"
  },
  {
    label: "Amount",
    key: "amount",
    sortable: true,
    formatter: (value) => formatCurrency(value),
    width: "100px",
    align: "right"
  },
  {
    label: "Notes",
    key: "notes",
    width: "100px"
  }
];