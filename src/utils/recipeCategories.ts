
export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'snack', label: 'Snack' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'side', label: 'Side Dish' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' }
];

export const KEYWORDS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'low-carb', label: 'Low-Carb' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'quick', label: 'Quick & Easy' },
  { value: 'slow-cooker', label: 'Slow Cooker' },
  { value: 'one-pot', label: 'One Pot' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'bbq', label: 'BBQ' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'comfort-food', label: 'Comfort Food' },
  { value: 'family-friendly', label: 'Family Friendly' },
  { value: 'gourmet', label: 'Gourmet' },
  { value: 'budget-friendly', label: 'Budget Friendly' },
  { value: 'high-protein', label: 'High Protein' },
  { value: 'sugar-free', label: 'Sugar-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'egg-free', label: 'Egg-Free' },
  { value: 'soy-free', label: 'Soy-Free' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'asian', label: 'Asian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'italian', label: 'Italian' },
  { value: 'indian', label: 'Indian' },
  { value: 'french', label: 'French' }
];

export function getKeywordLabel(value: string): string {
  const keyword = KEYWORDS.find(k => k.value === value);
  return keyword ? keyword.label : value;
}

export function getMealTypeLabel(value: string): string {
  const mealType = MEAL_TYPES.find(m => m.value === value);
  return mealType ? mealType.label : value;
}
