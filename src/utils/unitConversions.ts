
// Unit conversion factors
type ConversionFactor = {
  [key: string]: number; // relative to base unit
};

// Weight conversions (grams as base unit)
const weightConversions: ConversionFactor = {
  'g': 1, // grams (base unit)
  'kg': 1000, // kilograms
  'mg': 0.001, // milligrams
  'oz': 28.35, // ounces
  'lb': 453.592, // pounds
};

// Volume conversions (milliliters as base unit)
const volumeConversions: ConversionFactor = {
  'ml': 1, // milliliters (base unit)
  'l': 1000, // liters
  'tsp': 4.93, // teaspoon
  'tbsp': 14.79, // tablespoon
  'cup': 236.59, // cup
  'pint': 473.18, // pint
  'quart': 946.35, // quart
  'gallon': 3785.41, // gallon
  'fl oz': 29.57, // fluid ounce
};

// Unit categories
export type UnitCategory = 'weight' | 'volume' | 'count' | 'unknown';

// List of common units for ingredients
export const unitOptions = [
  // Weight units
  { value: 'g', label: 'g (gram)', category: 'weight' },
  { value: 'kg', label: 'kg (kilogram)', category: 'weight' },
  { value: 'mg', label: 'mg (milligram)', category: 'weight' },
  { value: 'oz', label: 'oz (ounce)', category: 'weight' },
  { value: 'lb', label: 'lb (pound)', category: 'weight' },
  
  // Volume units
  { value: 'ml', label: 'ml (milliliter)', category: 'volume' },
  { value: 'l', label: 'l (liter)', category: 'volume' },
  { value: 'tsp', label: 'tsp (teaspoon)', category: 'volume' },
  { value: 'tbsp', label: 'tbsp (tablespoon)', category: 'volume' },
  { value: 'cup', label: 'cup', category: 'volume' },
  { value: 'pint', label: 'pint', category: 'volume' },
  { value: 'quart', label: 'quart', category: 'volume' },
  { value: 'gallon', label: 'gallon', category: 'volume' },
  { value: 'fl oz', label: 'fl oz (fluid ounce)', category: 'volume' },
  
  // Count units (no conversion)
  { value: 'piece', label: 'piece', category: 'count' },
  { value: 'slice', label: 'slice', category: 'count' },
  { value: 'pinch', label: 'pinch', category: 'count' },
  { value: 'bunch', label: 'bunch', category: 'count' },
  { value: '', label: '(no unit)', category: 'count' },
];

// Determine unit category
export const getUnitCategory = (unit: string | null): UnitCategory => {
  if (!unit) return 'count';
  
  const unitOption = unitOptions.find(option => option.value === unit);
  return (unitOption?.category as UnitCategory) || 'unknown';
};

// Convert between units
export const convertUnit = (
  amount: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  // Same unit, no conversion needed
  if (fromUnit === toUnit) return amount;
  
  // Handle empty units (counted items)
  if (!fromUnit || !toUnit) return null;
  
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);
  
  // Can't convert between different categories
  if (fromCategory !== toCategory || fromCategory === 'count' || fromCategory === 'unknown') {
    return null;
  }
  
  if (fromCategory === 'weight') {
    const baseAmount = amount * weightConversions[fromUnit];
    return baseAmount / weightConversions[toUnit];
  } else if (fromCategory === 'volume') {
    const baseAmount = amount * volumeConversions[fromUnit];
    return baseAmount / volumeConversions[toUnit];
  }
  
  return null;
};

// Scale an amount based on serving size
export const scaleAmountByServings = (
  amount: number | null,
  originalServings: number,
  newServings: number
): number | null => {
  if (amount === null || originalServings <= 0) return amount;
  
  const scaleFactor = newServings / originalServings;
  return amount * scaleFactor;
};

// Format amount with appropriate precision
export const formatAmount = (amount: number | null): string => {
  if (amount === null) return '';
  
  // For whole numbers
  if (Number.isInteger(amount)) return amount.toString();
  
  // For decimals, limit to 2 decimal places
  return Number(amount.toFixed(2)).toString();
};
