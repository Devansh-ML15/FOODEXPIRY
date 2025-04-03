import { FoodItemWithStatus } from "@shared/schema";

/**
 * Finds matching recipes based on available ingredients
 * @param recipes - Available recipes
 * @param foodItems - User's food items
 * @returns Sorted array of recipes with match scores
 */
export function findMatchingRecipes(
  recipes: any[],
  foodItems: FoodItemWithStatus[]
): any[] {
  if (!recipes || !foodItems || recipes.length === 0 || foodItems.length === 0) {
    return [];
  }

  // Get food item names for matching (lowercase for case-insensitive matching)
  const itemNames = foodItems.map(item => item.name.toLowerCase());
  
  // Find recipes with ingredients that match food items
  const matchedRecipes = recipes.map(recipe => {
    const matchingIngredients = recipe.ingredients.filter(ingredient => 
      itemNames.some(itemName => 
        ingredient.toLowerCase().includes(itemName) || 
        itemName.includes(ingredient.toLowerCase())
      )
    );
    
    return {
      ...recipe,
      matchingIngredients,
      matchScore: matchingIngredients.length / recipe.ingredients.length
    };
  })
  .filter(recipe => recipe.matchingIngredients.length > 0)
  .sort((a, b) => b.matchScore - a.matchScore);
  
  return matchedRecipes;
}

/**
 * Prioritizes recipes that use soon-to-expire ingredients
 * @param matchedRecipes - Recipes that match available ingredients
 * @param foodItems - User's food items
 * @returns Sorted recipes with priority for soon-to-expire items
 */
export function prioritizeExpiringIngredients(
  matchedRecipes: any[],
  foodItems: FoodItemWithStatus[]
): any[] {
  if (!matchedRecipes || !foodItems || matchedRecipes.length === 0 || foodItems.length === 0) {
    return matchedRecipes;
  }

  // Create a map of ingredient names to expiration info
  const expirationMap = new Map();
  foodItems.forEach(item => {
    expirationMap.set(item.name.toLowerCase(), {
      daysUntilExpiration: item.daysUntilExpiration,
      status: item.status
    });
  });
  
  // Calculate expiration urgency score for each recipe
  return matchedRecipes.map(recipe => {
    let expirationUrgency = 0;
    let expiringIngredientsCount = 0;
    
    recipe.matchingIngredients.forEach(ingredient => {
      const matchedItemName = findMatchingItemName(ingredient, expirationMap);
      if (matchedItemName) {
        const { status, daysUntilExpiration } = expirationMap.get(matchedItemName);
        if (status === 'expired') {
          expirationUrgency += 100;
          expiringIngredientsCount++;
        } else if (status === 'expiring-soon') {
          // Give higher urgency to ingredients expiring sooner
          expirationUrgency += (4 - daysUntilExpiration) * 20;
          expiringIngredientsCount++;
        }
      }
    });
    
    return {
      ...recipe,
      expirationUrgency,
      expiringIngredientsCount
    };
  })
  .sort((a, b) => {
    // Sort first by expiration urgency, then by original match score
    if (b.expirationUrgency !== a.expirationUrgency) {
      return b.expirationUrgency - a.expirationUrgency;
    }
    return b.matchScore - a.matchScore;
  });
}

/**
 * Helper function to find a matching item name in the expiration map
 */
function findMatchingItemName(ingredient: string, expirationMap: Map<string, any>): string | null {
  const ingredientLower = ingredient.toLowerCase();
  
  // First try direct matching
  if (expirationMap.has(ingredientLower)) {
    return ingredientLower;
  }
  
  // Try partial matching
  for (const [itemName] of expirationMap.entries()) {
    if (ingredientLower.includes(itemName) || itemName.includes(ingredientLower)) {
      return itemName;
    }
  }
  
  return null;
}

/**
 * Gets a list of recipe categories based on ingredients
 * @param recipes - All available recipes
 * @returns Array of unique recipe categories
 */
export function getRecipeCategories(recipes: any[]): string[] {
  if (!recipes || recipes.length === 0) {
    return [];
  }
  
  const categories = new Set<string>();
  
  recipes.forEach(recipe => {
    const mainIngredient = recipe.ingredients[0].toLowerCase();
    
    if (mainIngredient.includes('chicken') || mainIngredient.includes('beef') || 
        mainIngredient.includes('pork') || mainIngredient.includes('fish')) {
      categories.add('Meat & Fish');
    } else if (mainIngredient.includes('pasta') || mainIngredient.includes('rice') || 
               mainIngredient.includes('bread') || mainIngredient.includes('grain')) {
      categories.add('Pasta & Grains');
    } else if (mainIngredient.includes('salad') || mainIngredient.includes('vegetable') || 
               mainIngredient.includes('spinach') || mainIngredient.includes('lettuce')) {
      categories.add('Salads & Vegetables');
    } else if (mainIngredient.includes('fruit') || mainIngredient.includes('berry') || 
               mainIngredient.includes('apple') || mainIngredient.includes('banana')) {
      categories.add('Fruits & Desserts');
    } else if (mainIngredient.includes('soup') || mainIngredient.includes('stew')) {
      categories.add('Soups & Stews');
    } else {
      categories.add('Other');
    }
  });
  
  return Array.from(categories);
}

/**
 * Estimates preparation difficulty based on ingredients and preparation time
 * @param recipe - Recipe object
 * @returns Difficulty level: 'easy', 'medium', or 'hard'
 */
export function estimateDifficulty(recipe: any): 'easy' | 'medium' | 'hard' {
  if (!recipe) return 'medium';
  
  const ingredientCount = recipe.ingredients.length;
  const prepTime = recipe.preparationTime;
  
  if (ingredientCount <= 5 && prepTime <= 15) {
    return 'easy';
  } else if (ingredientCount >= 10 || prepTime >= 45) {
    return 'hard';
  } else {
    return 'medium';
  }
}

/**
 * Formats a list of ingredients for display
 * @param ingredients - Array of ingredient strings
 * @param limit - Maximum number of ingredients to show
 * @returns Formatted string
 */
export function formatIngredientList(ingredients: string[], limit = 3): string {
  if (!ingredients || ingredients.length === 0) {
    return 'No ingredients';
  }
  
  if (ingredients.length <= limit) {
    return ingredients.join(', ');
  }
  
  return `${ingredients.slice(0, limit).join(', ')}...`;
}
