export const getColumnDefinitions = (currency) => [
  {
    label: "Date",
    key: "date",
  },
  {
    label: "Description",
    key: "description",
  },
  {
    label: "Category",
    key: "category",
  },
  {
    label: "Amount",
    key: "amount",
    formatter: (value) => `${currency}${value}`,
  },
  {
    label: "Type",
    key: "type",
  },
];