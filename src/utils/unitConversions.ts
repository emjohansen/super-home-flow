
// Unit conversion factors
type ConversionFactor = {
  [key: string]: number; // relative to base unit
};

// Unit systems
export type UnitSystem = 'metric' | 'imperial';

// Weight conversions (grams as base unit)
const weightConversions: ConversionFactor = {
  // Metric
  'g': 1, // grams (base unit)
  'kg': 1000, // kilograms
  'mg': 0.001, // milligrams
  // Imperial
  'oz': 28.35, // ounces
  'lb': 453.592, // pounds
};

// Volume conversions (milliliters as base unit)
const volumeConversions: ConversionFactor = {
  // Metric
  'ml': 1, // milliliters (base unit)
  'l': 1000, // liters
  // Imperial
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
  { value: 'g', label: 'g (gram)', category: 'weight', system: 'metric' },
  { value: 'kg', label: 'kg (kilogram)', category: 'weight', system: 'metric' },
  { value: 'mg', label: 'mg (milligram)', category: 'weight', system: 'metric' },
  { value: 'oz', label: 'oz (ounce)', category: 'weight', system: 'imperial' },
  { value: 'lb', label: 'lb (pound)', category: 'weight', system: 'imperial' },
  
  // Volume units
  { value: 'ml', label: 'ml (milliliter)', category: 'volume', system: 'metric' },
  { value: 'l', label: 'l (liter)', category: 'volume', system: 'metric' },
  { value: 'tsp', label: 'tsp (teaspoon)', category: 'volume', system: 'imperial' },
  { value: 'tbsp', label: 'tbsp (tablespoon)', category: 'volume', system: 'imperial' },
  { value: 'cup', label: 'cup', category: 'volume', system: 'imperial' },
  { value: 'pint', label: 'pint', category: 'volume', system: 'imperial' },
  { value: 'quart', label: 'quart', category: 'volume', system: 'imperial' },
  { value: 'gallon', label: 'gallon', category: 'volume', system: 'imperial' },
  { value: 'fl oz', label: 'fl oz (fluid ounce)', category: 'volume', system: 'imperial' },
  
  // Count units (no conversion)
  { value: 'piece', label: 'piece', category: 'count', system: 'none' },
  { value: 'slice', label: 'slice', category: 'count', system: 'none' },
  { value: 'pinch', label: 'pinch', category: 'count', system: 'none' },
  { value: 'bunch', label: 'bunch', category: 'count', system: 'none' },
];

// Determine unit category
export const getUnitCategory = (unit: string | null): UnitCategory => {
  if (!unit) return 'count';
  
  const unitOption = unitOptions.find(option => option.value === unit);
  return (unitOption?.category as UnitCategory) || 'unknown';
};

// Get unit system
export const getUnitSystem = (unit: string | null): UnitSystem | 'none' => {
  if (!unit) return 'none';
  
  const unitOption = unitOptions.find(option => option.value === unit);
  return (unitOption?.system as UnitSystem) || 'none';
};

// Get best equivalent unit in target system
export const getBestEquivalentUnit = (
  sourceUnit: string,
  targetSystem: UnitSystem
): string | null => {
  if (!sourceUnit) return null;
  
  const unitInfo = unitOptions.find(option => option.value === sourceUnit);
  if (!unitInfo || unitInfo.system === 'none' || unitInfo.system === targetSystem) {
    return sourceUnit; // Keep original if no conversion needed or not possible
  }
  
  // Find the most appropriate unit in the target system
  const category = unitInfo.category;
  
  // Get all units of the same category in target system
  const targetUnits = unitOptions.filter(
    u => u.category === category && u.system === targetSystem
  );
  
  if (targetUnits.length === 0) return sourceUnit; // No equivalent units
  
  // For volume
  if (category === 'volume') {
    const amount = volumeConversions[sourceUnit];
    
    // Find the closest appropriate unit
    if (amount <= 15 && targetSystem === 'imperial') return 'tsp';
    if (amount <= 30 && targetSystem === 'imperial') return 'tbsp';
    if (amount <= 60 && targetSystem === 'imperial') return 'fl oz';
    if (amount <= 250 && targetSystem === 'imperial') return 'cup';
    if (amount <= 500 && targetSystem === 'imperial') return 'pint';
    if (amount <= 1000 && targetSystem === 'imperial') return 'quart';
    if (amount > 1000 && targetSystem === 'imperial') return 'gallon';
    
    if (amount < 1000 && targetSystem === 'metric') return 'ml';
    if (amount >= 1000 && targetSystem === 'metric') return 'l';
  }
  
  // For weight
  if (category === 'weight') {
    const amount = weightConversions[sourceUnit];
    
    if (amount < 30 && targetSystem === 'imperial') return 'oz';
    if (amount >= 30 && targetSystem === 'imperial') return 'lb';
    
    if (amount < 1 && targetSystem === 'metric') return 'mg';
    if (amount >= 1000 && targetSystem === 'metric') return 'kg';
    if (amount >= 1 && amount < 1000 && targetSystem === 'metric') return 'g';
  }
  
  // Default to first unit in target system for this category
  return targetUnits[0].value;
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

// Convert all ingredient units to target system
export const convertToSystem = (
  amount: number,
  unit: string,
  targetSystem: UnitSystem
): { amount: number; unit: string } | null => {
  if (!unit) return { amount, unit };
  
  const currentSystem = getUnitSystem(unit);
  
  // No need to convert if already in target system or conversion not applicable
  if (currentSystem === 'none' || currentSystem === targetSystem) {
    return { amount, unit };
  }
  
  // Find best target unit
  const targetUnit = getBestEquivalentUnit(unit, targetSystem);
  if (!targetUnit) return { amount, unit }; // Keep original if no conversion possible
  
  // Convert amount to new unit
  const convertedAmount = convertUnit(amount, unit, targetUnit);
  if (convertedAmount === null) return { amount, unit }; // Keep original if conversion failed
  
  return { amount: convertedAmount, unit: targetUnit };
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
  
  // For decimals, limit to max 2 decimal places and trim trailing zeros
  const formatted = amount.toFixed(2).replace(/\.?0+$/, '');
  return formatted;
};
