import { 
  foodItems, 
  recipes, 
  wasteEntries, 
  type FoodItem, 
  type InsertFoodItem,
  type Recipe,
  type InsertRecipe,
  type WasteEntry,
  type InsertWasteEntry
} from "@shared/schema";

export interface IStorage {
  // Food Items
  getAllFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, item: Partial<InsertFoodItem>): Promise<FoodItem | undefined>;
  deleteFoodItem(id: number): Promise<boolean>;
  
  // Recipes
  getAllRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  
  // Waste Entries
  createWasteEntry(entry: InsertWasteEntry): Promise<WasteEntry>;
  getWasteEntriesByDateRange(startDate: Date, endDate: Date): Promise<WasteEntry[]>;
}

export class MemStorage implements IStorage {
  private foodItems: Map<number, FoodItem>;
  private recipes: Map<number, Recipe>;
  private wasteEntries: Map<number, WasteEntry>;
  
  private foodItemsId: number;
  private recipesId: number;
  private wasteEntriesId: number;

  constructor() {
    this.foodItems = new Map();
    this.recipes = new Map();
    this.wasteEntries = new Map();
    
    this.foodItemsId = 1;
    this.recipesId = 1;
    this.wasteEntriesId = 1;
    
    // Initialize with sample recipes
    this.initSampleRecipes();
  }

  // Food Items
  async getAllFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const id = this.foodItemsId++;
    const now = new Date();
    const foodItem: FoodItem = { 
      ...item, 
      id, 
      createdAt: now
    };
    this.foodItems.set(id, foodItem);
    return foodItem;
  }

  async updateFoodItem(id: number, updates: Partial<InsertFoodItem>): Promise<FoodItem | undefined> {
    const existingItem = this.foodItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...updates };
    this.foodItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteFoodItem(id: number): Promise<boolean> {
    return this.foodItems.delete(id);
  }

  // Recipes
  async getAllRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = this.recipesId++;
    const newRecipe: Recipe = { ...recipe, id };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  // Waste Entries
  async createWasteEntry(entry: InsertWasteEntry): Promise<WasteEntry> {
    const id = this.wasteEntriesId++;
    const now = new Date();
    const wasteEntry: WasteEntry = { 
      ...entry, 
      id, 
      createdAt: now
    };
    this.wasteEntries.set(id, wasteEntry);
    return wasteEntry;
  }

  async getWasteEntriesByDateRange(startDate: Date, endDate: Date): Promise<WasteEntry[]> {
    return Array.from(this.wasteEntries.values()).filter(entry => {
      const wasteDate = new Date(entry.wasteDate);
      return wasteDate >= startDate && wasteDate <= endDate;
    });
  }

  // Initialize sample recipes
  private initSampleRecipes() {
    const sampleRecipes: InsertRecipe[] = [
      {
        name: "Greek Yogurt Parfait",
        ingredients: ["Greek Yogurt", "Strawberries", "Honey", "Granola"],
        preparationTime: 15,
        instructions: "Layer Greek yogurt, strawberries, and granola in a glass. Drizzle with honey.",
        imageUrl: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "French Toast",
        ingredients: ["Whole Wheat Bread", "Eggs", "Milk", "Cinnamon", "Maple Syrup"],
        preparationTime: 20,
        instructions: "Beat eggs with milk and cinnamon. Soak bread slices and cook on a griddle until golden brown.",
        imageUrl: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "Vegetable Stir Fry",
        ingredients: ["Spinach", "Carrots", "Bell Peppers", "Broccoli", "Soy Sauce", "Garlic"],
        preparationTime: 25,
        instructions: "Sauté garlic in oil. Add vegetables and stir-fry until tender-crisp. Season with soy sauce.",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "Egg and Spinach Omelette",
        ingredients: ["Eggs", "Spinach", "Cheese", "Salt", "Pepper"],
        preparationTime: 15,
        instructions: "Beat eggs, pour into a hot pan. Add spinach and cheese. Fold and cook until set.",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "Avocado Toast",
        ingredients: ["Whole Wheat Bread", "Avocado", "Lemon Juice", "Salt", "Red Pepper Flakes"],
        preparationTime: 10,
        instructions: "Toast bread. Mash avocado with lemon juice, salt, and red pepper flakes. Spread on toast.",
        imageUrl: "https://images.unsplash.com/photo-1508032995-009c8686afb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "Fruit Smoothie",
        ingredients: ["Strawberries", "Banana", "Greek Yogurt", "Honey", "Ice"],
        preparationTime: 5,
        instructions: "Blend all ingredients together until smooth.",
        imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      }
    ];

    sampleRecipes.forEach(recipe => {
      this.createRecipe(recipe);
    });
  }
}

export const storage = new MemStorage();
