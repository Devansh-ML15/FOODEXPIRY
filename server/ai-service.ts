import OpenAI from "openai";
import { FoodItemWithStatus } from "@shared/schema";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Recipe Suggestion Service
 * Uses OpenAI's GPT-4o model to generate personalized recipe suggestions
 */
export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Check if OpenAI API is configured
   */
  public isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Generate recipe suggestions based on food items
   * @param foodItems List of food items in user's inventory
   * @param useExpiring Whether to prioritize expiring items
   * @param limit Number of recipes to generate
   */
  public async generateRecipeSuggestions(
    foodItems: FoodItemWithStatus[],
    useExpiring: boolean = true,
    limit: number = 3
  ): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error("OpenAI API is not configured");
      }

      // Sort items by expiration date if useExpiring is true
      const sortedItems = useExpiring
        ? [...foodItems].sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
        : foodItems;

      // Prepare items information for the prompt
      const itemsList = sortedItems.map(item => 
        `${item.name} (${item.quantity} ${item.unit}, ${item.status === 'expired' ? 'expired' : 
          item.status === 'expiring-soon' ? `expires in ${item.daysUntilExpiration} days` : 
          `fresh, expires in ${item.daysUntilExpiration} days`})`
      ).join("\n");

      // Create a prompt for recipe generation
      const prompt = `You are a helpful AI assistant specializing in recipe suggestions to reduce food waste.

Based on the following food items in the user's inventory, suggest ${limit} creative, easy-to-make recipes that utilize as many of the soon-to-expire items as possible. Prefer recipes that use items that are expiring soon.

Food inventory:
${itemsList}

For each recipe, please provide:
1. Recipe title (creative and appetizing)
2. Brief description of the dish (1-2 sentences)
3. List of ingredients needed (marking which ones the user already has)
4. List of matching items from user's inventory
5. Estimated preparation time in minutes
6. Difficulty level (Easy, Medium, Hard)

Respond with JSON in the following format:
{
  "recipes": [
    {
      "id": "unique-id-1",
      "title": "Creative Recipe Name",
      "description": "Brief appetizing description of the dish",
      "ingredients": ["Ingredient 1", "Ingredient 2", "Ingredient 3"],
      "matchingItems": ["Ingredient 1", "Ingredient 3"],
      "preparationTime": 30,
      "difficulty": "Easy"
    }
  ]
}`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a helpful culinary assistant that specializes in reducing food waste." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Parse response into structured data
      const responseContent = response.choices[0].message.content;
      if (!responseContent) {
        throw new Error("No content in AI response");
      }

      const recipes = JSON.parse(responseContent);
      return recipes;

    } catch (error) {
      console.error("Error generating recipe suggestions:", error);
      throw new Error(`Failed to generate recipe suggestions: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a single detailed recipe based on selected ingredients
   * @param ingredients List of ingredients to include in the recipe
   * @param dietary Optional dietary restrictions (vegetarian, vegan, etc.)
   */
  public async generateDetailedRecipe(
    ingredients: string[],
    dietary?: string
  ): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error("OpenAI API is not configured");
      }

      const dietaryStr = dietary ? `The recipe should be ${dietary}.` : "";

      // Create a prompt for detailed recipe generation
      const prompt = `Create a detailed recipe using primarily these ingredients: ${ingredients.join(", ")}. ${dietaryStr}

Please structure the recipe with:
- A creative title
- Brief description of the dish
- List of ingredients with measurements
- Detailed step-by-step cooking instructions
- Cooking time
- Difficulty level
- Nutritional information (estimate)
- Tips for preparation or substitutions

Respond with JSON in the following format:
{
  "title": "Creative Recipe Name",
  "description": "Brief appetizing description of the dish (1-2 sentences)",
  "ingredients": [
    {"name": "Ingredient", "quantity": "measurement", "isAvailable": true or false}
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "preparationTime": 30,
  "difficulty": "Easy, Medium, or Hard",
  "nutritionalInfo": {
    "calories": "X kcal per serving",
    "protein": "X g",
    "carbs": "X g",
    "fat": "X g"
  },
  "tips": ["Tip 1", "Tip 2"]
}`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a professional chef specializing in creating recipes from available ingredients." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Parse response into structured data
      const responseContent = response.choices[0].message.content;
      if (!responseContent) {
        throw new Error("No content in AI response");
      }

      const recipe = JSON.parse(responseContent);
      return recipe;

    } catch (error) {
      console.error("Error generating detailed recipe:", error);
      throw new Error(`Failed to generate detailed recipe: ${(error as Error).message}`);
    }
  }
}

export const aiService = AIService.getInstance();