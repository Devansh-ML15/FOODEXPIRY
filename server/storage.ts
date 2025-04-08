import { 
  foodItems, 
  recipes, 
  wasteEntries,
  consumptionEntries,
  users,
  notificationSettings,
  mealPlans,
  otpVerifications,
  chatMessages,
  sharedRecipes,
  recipeComments,
  FOOD_CATEGORIES,
  STORAGE_LOCATIONS,
  QUANTITY_UNITS,
  NOTIFICATION_FREQUENCIES,
  MEAL_TYPES,
  MESSAGE_TYPES,
  type FoodItem, 
  type InsertFoodItem,
  type Recipe,
  type InsertRecipe,
  type WasteEntry,
  type InsertWasteEntry,
  type ConsumptionEntry,
  type InsertConsumptionEntry,
  type User,
  type InsertUser,
  type NotificationSetting,
  type InsertNotificationSetting,
  type MealPlan,
  type InsertMealPlan,
  type OtpVerification,
  type InsertOtpVerification,
  type ChatMessage,
  type InsertChatMessage,
  type ChatMessageWithUser,
  type SharedRecipe,
  type InsertSharedRecipe,
  type RecipeComment,
  type InsertRecipeComment
} from "@shared/schema";
import { db } from "./db";
import { eq, between, and, desc, sql, gt } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // Food Items
  getAllFoodItems(): Promise<FoodItem[]>;
  getFoodItemsByUserId(userId: number): Promise<FoodItem[]>;
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
  
  // Consumption Entries
  createConsumptionEntry(entry: InsertConsumptionEntry): Promise<ConsumptionEntry>;
  getConsumptionEntriesByUserId(userId: number): Promise<ConsumptionEntry[]>;
  getConsumptionEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ConsumptionEntry[]>;

  // Meal Plans
  getMealPlansByUserId(userId: number): Promise<MealPlan[]>;
  getMealPlansByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MealPlan[]>;
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: number): Promise<boolean>;
  
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Notification Settings
  getNotificationSettings(userId: number): Promise<NotificationSetting | undefined>;
  createNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting>;
  updateNotificationSettings(id: number, settings: Partial<InsertNotificationSetting>): Promise<NotificationSetting | undefined>;
  getExpiringFoodItemsForNotification(daysThreshold: number, userId?: number): Promise<FoodItem[]>;
  updateLastNotified(id: number, timestamp: Date): Promise<void>;
  
  // OTP Verification
  getOtpByEmail(email: string): Promise<OtpVerification | undefined>;
  createOtp(otpData: InsertOtpVerification): Promise<OtpVerification>;
  updateOtp(id: number, updates: Partial<InsertOtpVerification>): Promise<OtpVerification | undefined>;
  deleteOtpByEmail(email: string): Promise<boolean>;
  
  // Chat and Recipe Sharing
  getChatMessages(limit?: number): Promise<ChatMessageWithUser[]>;
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByAttachmentId(attachmentId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: number): Promise<boolean>;
  getSharedRecipes(): Promise<SharedRecipe[]>;
  getSharedRecipe(id: number): Promise<SharedRecipe | undefined>;
  createSharedRecipe(recipe: InsertSharedRecipe): Promise<SharedRecipe>;
  updateSharedRecipe(id: number, updates: Partial<InsertSharedRecipe>): Promise<SharedRecipe | undefined>;
  deleteSharedRecipe(id: number): Promise<boolean>;
  getRecipeComments(recipeId: number): Promise<RecipeComment[]>;
  createRecipeComment(comment: InsertRecipeComment): Promise<RecipeComment>;
  
  // Session Management
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create postgres session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      // Table name defaults to 'session'
    });
  }
  // Food Items
  async getAllFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems).orderBy(desc(foodItems.expirationDate));
  }
  
  async getFoodItemsByUserId(userId: number): Promise<FoodItem[]> {
    const result = await db.select()
      .from(foodItems)
      .where(eq(foodItems.userId, userId))
      .orderBy(desc(foodItems.expirationDate));
    
    // Filter out consumed items (quantity = 0) in memory
    return result.filter(item => item.quantity > 0);
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
    // Handle type-safe category updates
    const typeCheckedUpdates: any = { ...updates };
    
    // For proper type checking, ensure category is one of the allowed values
    if (updates.category && typeof updates.category === 'string') {
      if (FOOD_CATEGORIES.includes(updates.category as any)) {
        typeCheckedUpdates.category = updates.category;
      } else {
        throw new Error(`Invalid category: ${updates.category}`);
      }
    }
    
    const [updatedItem] = await db
      .update(foodItems)
      .set(typeCheckedUpdates)
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
  
  // Consumption Entries
  async createConsumptionEntry(entry: InsertConsumptionEntry): Promise<ConsumptionEntry> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newEntry] = await db.insert(consumptionEntries).values(entry).returning();
    return newEntry;
  }

  async getConsumptionEntriesByUserId(userId: number): Promise<ConsumptionEntry[]> {
    return await db
      .select()
      .from(consumptionEntries)
      .where(eq(consumptionEntries.userId, userId))
      .orderBy(desc(consumptionEntries.consumptionDate));
  }

  async getConsumptionEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ConsumptionEntry[]> {
    // Convert Date objects to strings in the format PostgreSQL expects
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(consumptionEntries)
      .where(
        and(
          // @ts-ignore - Type issues with drizzle-orm
          between(consumptionEntries.consumptionDate, startDateStr, endDateStr),
          eq(consumptionEntries.userId, userId)
        )
      )
      .orderBy(desc(consumptionEntries.consumptionDate));
  }
  
  // Meal Plans
  async getMealPlansByUserId(userId: number): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(mealPlans.date);
  }
  
  async getMealPlansByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MealPlan[]> {
    // Convert Date objects to strings in the format PostgreSQL expects
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(mealPlans)
      .where(
        and(
          // @ts-ignore - Type issues with drizzle-orm
          between(mealPlans.date, startDateStr, endDateStr),
          eq(mealPlans.userId, userId)
        )
      )
      .orderBy(mealPlans.date);
  }
  
  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    const result = await db.select().from(mealPlans).where(eq(mealPlans.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newMealPlan] = await db.insert(mealPlans).values(mealPlan).returning();
    return newMealPlan;
  }
  
  async updateMealPlan(id: number, updates: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    // Handle type-safe mealType updates
    const typeCheckedUpdates: any = { ...updates };
    
    // For proper type checking, ensure mealType is one of the allowed values
    if (updates.mealType && typeof updates.mealType === 'string') {
      if (MEAL_TYPES.includes(updates.mealType as any)) {
        typeCheckedUpdates.mealType = updates.mealType;
      } else {
        throw new Error(`Invalid meal type: ${updates.mealType}`);
      }
    }
    
    const [updatedMealPlan] = await db
      .update(mealPlans)
      .set(typeCheckedUpdates)
      .where(eq(mealPlans.id, id))
      .returning();
    
    return updatedMealPlan;
  }
  
  async deleteMealPlan(id: number): Promise<boolean> {
    const result = await db.delete(mealPlans).where(eq(mealPlans.id, id)).returning();
    return result.length > 0;
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
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
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
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First, delete all related data
      
      // Delete food items
      await db.delete(foodItems).where(eq(foodItems.userId, id));
      
      // Delete notification settings
      await db.delete(notificationSettings).where(eq(notificationSettings.userId, id));
      
      // Delete waste entries
      await db.delete(wasteEntries).where(eq(wasteEntries.userId, id));
      
      // Delete consumption entries
      await db.delete(consumptionEntries).where(eq(consumptionEntries.userId, id));
      
      // Delete meal plans
      await db.delete(mealPlans).where(eq(mealPlans.userId, id));
      
      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
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
    // Handle type-safe expirationFrequency updates
    const typeCheckedUpdates: any = { ...updates };
    
    // For proper type checking, ensure expirationFrequency is one of the allowed values
    if (updates.expirationFrequency && typeof updates.expirationFrequency === 'string') {
      if (NOTIFICATION_FREQUENCIES.includes(updates.expirationFrequency as any)) {
        typeCheckedUpdates.expirationFrequency = updates.expirationFrequency;
      } else {
        throw new Error(`Invalid frequency: ${updates.expirationFrequency}`);
      }
    }
    
    const [updatedSettings] = await db
      .update(notificationSettings)
      .set({
        ...typeCheckedUpdates,
        updatedAt: new Date()
      })
      .where(eq(notificationSettings.id, id))
      .returning();
    
    return updatedSettings;
  }

  async getExpiringFoodItemsForNotification(daysThreshold: number, userId?: number): Promise<FoodItem[]> {
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + daysThreshold);
    
    const todayStr = today.toISOString().split('T')[0];
    const thresholdStr = threshold.toISOString().split('T')[0];
    
    // Get food items that will expire within the threshold days
    // Filter by userId if provided
    let result: FoodItem[];
    if (userId !== undefined) {
      result = await db
        .select()
        .from(foodItems)
        .where(
          and(
            // @ts-ignore - Type issues with drizzle-orm
            between(foodItems.expirationDate, todayStr, thresholdStr),
            eq(foodItems.userId, userId)
          )
        );
    } else {
      result = await db
        .select()
        .from(foodItems)
        .where(
          and(
            // @ts-ignore - Type issues with drizzle-orm
            between(foodItems.expirationDate, todayStr, thresholdStr)
          )
        );
    }
    
    // Filter out consumed items (quantity = 0) in memory
    return result.filter(item => item.quantity > 0);
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
  
  // OTP Verification
  async getOtpByEmail(email: string): Promise<OtpVerification | undefined> {
    const result = await db
      .select()
      .from(otpVerifications)
      .where(eq(otpVerifications.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createOtp(otpData: InsertOtpVerification): Promise<OtpVerification> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newOtp] = await db.insert(otpVerifications).values(otpData).returning();
    return newOtp;
  }

  async updateOtp(id: number, updates: Partial<InsertOtpVerification>): Promise<OtpVerification | undefined> {
    // @ts-ignore - Type issues with drizzle-orm
    const [updatedOtp] = await db
      .update(otpVerifications)
      .set(updates)
      .where(eq(otpVerifications.id, id))
      .returning();
    
    return updatedOtp;
  }

  async deleteOtpByEmail(email: string): Promise<boolean> {
    const result = await db.delete(otpVerifications).where(eq(otpVerifications.email, email)).returning();
    return result.length > 0;
  }
  
  // Chat and Recipe Sharing
  async getChatMessages(limit: number = 50): Promise<ChatMessageWithUser[]> {
    const messagesRaw = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
      
    // Get all unique user IDs from the messages
    const userIds = Array.from(new Set(messagesRaw.map(msg => msg.userId)));
    
    // Create a map of user IDs to users for quick lookups
    const userMap = new Map<number, User>();
    
    // Fetch each user individually instead of using IN clause
    for (const userId of userIds) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (userResult.length > 0) {
        userMap.set(userId, userResult[0]);
      }
    }
    
    // For recipe share messages, get the shared recipes too
    const recipeMessageIds = messagesRaw
      .filter(msg => msg.messageType === 'recipe_share' && msg.attachmentId !== null)
      .map(msg => msg.attachmentId as number);
    
    // Get all recipes in one query
    const recipesMap = new Map<number, SharedRecipe>();
    
    // Fetch each recipe individually instead of using IN clause
    for (const recipeId of recipeMessageIds) {
      const recipeResult = await db
        .select()
        .from(sharedRecipes)
        .where(eq(sharedRecipes.id, recipeId));
      
      if (recipeResult.length > 0) {
        recipesMap.set(recipeId, recipeResult[0]);
      }
    }
    
    // Map messages to include user details
    const messagesWithUser: ChatMessageWithUser[] = messagesRaw.map(msg => {
      const user = userMap.get(msg.userId);
      const recipe = msg.attachmentId ? recipesMap.get(msg.attachmentId) : undefined;
      
      return {
        ...msg,
        user: {
          id: user?.id || 0,
          username: user?.username || 'Unknown User'
        },
        sharedRecipe: recipe
      };
    });
    
    return messagesWithUser;
  }
  
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const result = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getChatMessagesByAttachmentId(attachmentId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.attachmentId, attachmentId));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Type-safe messageType check
    const typeCheckedMessage: any = { ...message };
    if (message.messageType && typeof message.messageType === 'string') {
      if (!MESSAGE_TYPES.includes(message.messageType as any)) {
        throw new Error(`Invalid message type: ${message.messageType}`);
      }
    }
    
    // @ts-ignore - Type issues with drizzle-orm
    const [newMessage] = await db.insert(chatMessages).values(typeCheckedMessage).returning();
    return newMessage;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.id, id)).returning();
    return result.length > 0;
  }
  
  async getSharedRecipes(): Promise<SharedRecipe[]> {
    return await db.select().from(sharedRecipes).orderBy(desc(sharedRecipes.createdAt));
  }
  
  async getSharedRecipe(id: number): Promise<SharedRecipe | undefined> {
    const result = await db.select().from(sharedRecipes).where(eq(sharedRecipes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createSharedRecipe(recipe: InsertSharedRecipe): Promise<SharedRecipe> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newRecipe] = await db.insert(sharedRecipes).values(recipe).returning();
    return newRecipe;
  }
  
  async updateSharedRecipe(id: number, updates: Partial<InsertSharedRecipe>): Promise<SharedRecipe | undefined> {
    // @ts-ignore - Type issues with drizzle-orm
    const [updatedRecipe] = await db
      .update(sharedRecipes)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(sharedRecipes.id, id))
      .returning();
      
    return updatedRecipe;
  }
  
  async deleteSharedRecipe(id: number): Promise<boolean> {
    // Delete the recipe
    const result = await db.delete(sharedRecipes).where(eq(sharedRecipes.id, id)).returning();
    return result.length > 0;
  }
  
  async getRecipeComments(recipeId: number): Promise<RecipeComment[]> {
    return await db
      .select()
      .from(recipeComments)
      .where(eq(recipeComments.recipeId, recipeId))
      .orderBy(desc(recipeComments.createdAt));
  }
  
  async createRecipeComment(comment: InsertRecipeComment): Promise<RecipeComment> {
    // @ts-ignore - Type issues with drizzle-orm
    const [newComment] = await db.insert(recipeComments).values(comment).returning();
    return newComment;
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
        username: "demo",
        password: "password123", // This will be hashed in a real scenario
        name: "Demo User",
        email: "demo@freshtrack.app",
      };
      
      // @ts-ignore - Type issues with drizzle-orm
      const [newUser] = await db.insert(users).values(defaultUser).returning();
      
      // Create default notification settings for the user
      const defaultSettings = {
        userId: newUser.id,
        expirationAlerts: true,
        expirationFrequency: "daily" as const, // Type-safe frequency
        weeklyReport: true,
        emailEnabled: true,
        emailAddress: "demo@freshtrack.app",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(notificationSettings).values([defaultSettings]);
      
      console.log("Initialized default user and notification settings");
    }
  }
}

export const storage = new DatabaseStorage();
