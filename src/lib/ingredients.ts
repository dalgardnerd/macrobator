export const CATEGORIES = ['meat', 'vegetables', 'fruit', 'grain', 'dairy', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export type CommonIngredient = {
	name: string;
	caloriesPer100g: number;
	category: Category;
	favorite?: boolean;
};

export const STORAGE_KEY = 'macrobator:common-ingredients-v1';

export function isCategory(v: unknown): v is Category {
	return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);
}

export const DEFAULT_INGREDIENTS: CommonIngredient[] = [
	// meat
	{ name: 'Chicken breast', caloriesPer100g: 165, category: 'meat' },
	{ name: 'Ground Beef (80/20)', caloriesPer100g: 250, category: 'meat' },
	{ name: 'Salmon', caloriesPer100g: 208, category: 'meat' },
	{ name: 'Tuna (canned in water)', caloriesPer100g: 116, category: 'meat' },
	{ name: 'Egg (whole)', caloriesPer100g: 155, category: 'meat' },
	{ name: 'Bacon (cooked)', caloriesPer100g: 541, category: 'meat' },

	// grain
	{ name: 'White rice (cooked)', caloriesPer100g: 130, category: 'grain' },
	{ name: 'Brown rice (cooked)', caloriesPer100g: 112, category: 'grain' },
	{ name: 'Pasta (cooked)', caloriesPer100g: 158, category: 'grain' },
	{ name: 'Bread (white)', caloriesPer100g: 265, category: 'grain' },
	{ name: 'Oats (rolled, dry)', caloriesPer100g: 389, category: 'grain' },

	// vegetables
	{ name: 'Potato (boiled)', caloriesPer100g: 87, category: 'vegetables' },
	{ name: 'Sweet potato', caloriesPer100g: 86, category: 'vegetables' },
	{ name: 'Broccoli', caloriesPer100g: 34, category: 'vegetables' },
	{ name: 'Spinach', caloriesPer100g: 23, category: 'vegetables' },
	{ name: 'Carrot', caloriesPer100g: 41, category: 'vegetables' },
	{ name: 'Tomato', caloriesPer100g: 18, category: 'vegetables' },
	{ name: 'Onion', caloriesPer100g: 40, category: 'vegetables' },

	// fruit
	{ name: 'Banana', caloriesPer100g: 89, category: 'fruit' },
	{ name: 'Apple', caloriesPer100g: 52, category: 'fruit' },
	{ name: 'Avocado', caloriesPer100g: 160, category: 'fruit' },
	{ name: 'Blueberries', caloriesPer100g: 57, category: 'fruit' },
	{ name: 'Strawberries', caloriesPer100g: 32, category: 'fruit' },

	// dairy
	{ name: 'Greek yogurt (plain)', caloriesPer100g: 59, category: 'dairy' },
	{ name: 'Milk (whole)', caloriesPer100g: 61, category: 'dairy' },
	{ name: 'Cheddar cheese', caloriesPer100g: 402, category: 'dairy' },
	{ name: 'Butter', caloriesPer100g: 717, category: 'dairy' },
	
	// other
	{ name: 'Almonds', caloriesPer100g: 579, category: 'other' },
	{ name: 'Peanut butter', caloriesPer100g: 588, category: 'other' },
	{ name: 'Olive oil', caloriesPer100g: 884, category: 'other' }
];
