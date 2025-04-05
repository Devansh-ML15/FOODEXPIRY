import { 
  foodItems, 
  recipes, 
  wasteEntries,
  users,
  notificationSettings,
  FOOD_CATEGORIES,
  STORAGE_LOCATIONS,
  QUANTITY_UNITS,
  NOTIFICATION_FREQUENCIES,
  type FoodItem, 
  type InsertFoodItem,
  type Recipe,
  type InsertRecipe,
  type WasteEntry,
  type InsertWasteEntry,
  type User,
  type InsertUser,
  type NotificationSetting,
  type InsertNotificationSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, between, and, desc, sql } from "drizzle-orm";

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
  
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Notification Settings
  getNotificationSettings(userId: number): Promise<NotificationSetting | undefined>;
  createNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting>;
  updateNotificationSettings(id: number, settings: Partial<InsertNotificationSetting>): Promise<NotificationSetting | undefined>;
  getExpiringFoodItemsForNotification(daysThreshold: number): Promise<FoodItem[]>;
  updateLastNotified(id: number, timestamp: Date): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Food Items
  async getAllFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems).orderBy(desc(foodItems.expirationDate));
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    const result = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newItem] = await db.insert(foodItems).values(item).returning();
    return newItem;
  }

  async updateFoodItem(id: number, updates: Partial<InsertFoodItem>): Promise<FoodItem | undefined> {
    // @ts-ignore - Type issues with drizzle-orm
    const [updatedItem] = await db
      .update(foodItems)
      .set(updates)
      .where(eq(foodItems.id, id))
      .returning();
    
    return updatedItem;
  }

  async deleteFoodItem(id: number): Promise<boolean> {
    const result = await db.delete(foodItems).where(eq(foodItems.id, id)).returning();
    return result.length > 0;
  }

  // Recipes
  async getAllRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const result = await db.select().from(recipes).where(eq(recipes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  // Waste Entries
  async createWasteEntry(entry: InsertWasteEntry): Promise<WasteEntry> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newEntry] = await db.insert(wasteEntries).values(entry).returning();
    return newEntry;
  }

  async getWasteEntriesByDateRange(startDate: Date, endDate: Date): Promise<WasteEntry[]> {
    // Convert Date objects to strings in the format PostgreSQL expects
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(wasteEntries)
      .where(
        and(
          // @ts-ignore - Type issues with drizzle-orm
          between(wasteEntries.wasteDate, startDateStr, endDateStr)
        )
      );
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    // @ts-ignore - Type issues with drizzle-orm
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Notification Settings
  async getNotificationSettings(userId: number): Promise<NotificationSetting | undefined> {
    const result = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newSettings] = await db.insert(notificationSettings).values(settings).returning();
    return newSettings;
  }

  async updateNotificationSettings(id: number, updates: Partial<InsertNotificationSetting>): Promise<NotificationSetting | undefined> {
    // @ts-ignore - Type issues with drizzle-orm
    const [updatedSettings] = await db
      .update(notificationSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(notificationSettings.id, id))
      .returning();
    
    return updatedSettings;
  }

  async getExpiringFoodItemsForNotification(daysThreshold: number): Promise<FoodItem[]> {
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + daysThreshold);
    
    const todayStr = today.toISOString().split('T')[0];
    const thresholdStr = threshold.toISOString().split('T')[0];
    
    // Get food items that will expire within the threshold days
    return await db
      .select()
      .from(foodItems)
      .where(
        and(
          // @ts-ignore - Type issues with drizzle-orm
          between(foodItems.expirationDate, todayStr, thresholdStr)
        )
      );
  }

  async updateLastNotified(id: number, timestamp: Date): Promise<void> {
    await db
      .update(notificationSettings)
      .set({
        lastNotified: timestamp,
        updatedAt: new Date()
      })
      .where(eq(notificationSettings.id, id));
  }

  // Initialize sample data for a fresh database
  async initSampleData() {
    // Check if we already have recipes
    const existingRecipes = await db.select().from(recipes);
    
    if (existingRecipes.length === 0) {
      // Add sample recipes
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
      
      for (const recipe of sampleRecipes) {
        // @ts-ignore - Type issues with drizzle-orm
        await db.insert(recipes).values(recipe);
      }
      
      console.log("Initialized sample recipes");
    }
    
    // Check if we already have a default user
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      // Add a default user
      const defaultUser: InsertUser = {
        name: "Demo User",
        email: "demo@freshtrack.app",
      };
      
      // @ts-ignore - Type issues with drizzle-orm
      const [newUser] = await db.insert(users).values(defaultUser).returning();
      
      // Create default notification settings for the user
      const defaultSettings: InsertNotificationSetting = {
        userId: newUser.id,
        expirationAlerts: true,
        expirationFrequency: "daily",
        weeklyReport: true,
        emailEnabled: true,
        emailAddress: "demo@freshtrack.app",
      };
      
      await db.insert(notificationSettings).values(defaultSettings);
      
      console.log("Initialized default user and notification settings");
    }
  }
}

export const storage = new DatabaseStorage();
