import OpenAI from "openai";
import { FoodItemWithStatus } from "@shared/schema";

// Initialize the OpenAI client if an API key is available
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn("OPENAI_API_KEY not found. AI recipe features will be disabled.");
  }
} catch (error) {
  console.error("Error initializing OpenAI:", error);
}

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
    return !!process.env.OPENAI_API_KEY && !!openai;
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
        // Return a friendly error message for the frontend
        return {
          error: "AI recipe generation is currently disabled. Please configure the OpenAI API key to enable this feature.",
          recipes: []
        };
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

      // We know openai is not null here because isConfigured() checks for it
      const response = await openai!.chat.completions.create({
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
      // Return a user-friendly error instead of throwing, so the app continues to run
      return {
        error: `Failed to generate recipe suggestions: ${(error as Error).message}`,
        recipes: []
      };
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
        // Return a friendly error message for the frontend
        return {
          error: "AI recipe generation is currently disabled. Please configure the OpenAI API key to enable this feature.",
          title: "Recipe Generation Unavailable",
          description: "The AI recipe feature is currently unavailable.",
          ingredients: [],
          instructions: ["AI recipe generation is disabled."],
          preparationTime: 0,
          difficulty: "N/A",
          nutritionalInfo: {
            calories: "N/A",
            protein: "N/A",
            carbs: "N/A",
            fat: "N/A"
          },
          tips: ["Configure the OpenAI API key to enable this feature."]
        };
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

      // We know openai is not null here because isConfigured() checks for it
      const response = await openai!.chat.completions.create({
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
      // Return a user-friendly error instead of throwing, so the app continues to run
      return {
        error: `Failed to generate detailed recipe: ${(error as Error).message}`,
        title: "Recipe Generation Failed",
        description: "Unable to generate a recipe at this time.",
        ingredients: [],
        instructions: ["Recipe generation failed."],
        preparationTime: 0,
        difficulty: "N/A",
        nutritionalInfo: {
          calories: "N/A",
          protein: "N/A",
          carbs: "N/A",
          fat: "N/A"
        },
        tips: ["Please try again later."]
      };
    }
  }
}

export const aiService = AIService.getInstance();
