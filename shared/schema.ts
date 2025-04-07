import { pgTable, text, serial, integer, date, timestamp, doublePrecision, boolean, foreignKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Food categories
export const FOOD_CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "bakery",
  "pantry",
  "frozen",
  "other"
] as const;

// Storage locations
export const STORAGE_LOCATIONS = [
  "refrigerator",
  "freezer",
  "pantry",
  "counter",
  "other"
] as const;

// Quantity units
export const QUANTITY_UNITS = [
  "items",
  "lbs",
  "kg",
  "oz",
  "g",
  "package"
] as const;

// Notification frequencies
export const NOTIFICATION_FREQUENCIES = [
  "daily",
  "weekly",
  "never"
] as const;

// Meal types
export const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack"
] as const;

// User profiles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  name: text("name").default(""),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// OTP verification
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userData: text("user_data").notNull(), // JSON stringified user registration data
});

// Food items table
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").$type<typeof FOOD_CATEGORIES[number]>().notNull(),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").$type<typeof QUANTITY_UNITS[number]>().notNull().default("items"),
  purchaseDate: date("purchase_date").notNull(),
  expirationDate: date("expiration_date").notNull(),
  storageLocation: text("storage_location").$type<typeof STORAGE_LOCATIONS[number]>().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// Recipe suggestions
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ingredients: text("ingredients").array().notNull(),
  preparationTime: integer("preparation_time").notNull(), // in minutes
  instructions: text("instructions").notNull(),
  imageUrl: text("image_url"),
});

// Waste tracking
export const wasteEntries = pgTable("waste_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  foodItemId: integer("food_item_id").notNull().references(() => foodItems.id),
  quantity: integer("quantity").notNull(),
  unit: text("unit").$type<typeof QUANTITY_UNITS[number]>().notNull(),
  wasteWeight: doublePrecision("waste_weight"), // in kg
  wasteDate: date("waste_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Consumption tracking
export const consumptionEntries = pgTable("consumption_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  foodItemId: integer("food_item_id").notNull().references(() => foodItems.id),
  quantity: integer("quantity").notNull(),
  unit: text("unit").$type<typeof QUANTITY_UNITS[number]>().notNull(),
  consumptionDate: date("consumption_date").notNull(),
  notes: text("notes"),
  estimatedValue: doublePrecision("estimated_value"), // estimated monetary value in user's currency
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Meal planning
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  mealType: text("meal_type").$type<typeof MEAL_TYPES[number]>().notNull(),
  name: text("name").notNull(),
  ingredients: integer("ingredients").array().notNull(), // Array of food item IDs
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notification settings
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expirationAlerts: boolean("expiration_alerts").notNull().default(true),
  expirationFrequency: text("expiration_frequency").$type<typeof NOTIFICATION_FREQUENCIES[number]>().notNull().default("weekly"),
  weeklySummary: boolean("weekly_report").notNull().default(true), // DB column is weekly_report but we'll refer to it as weeklySummary
  emailEnabled: boolean("email_enabled").notNull().default(true),
  emailAddress: text("email_address"),
  lastNotified: timestamp("last_notified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat message types
export const MESSAGE_TYPES = [
  "text",
  "recipe_share",
  "image"
] as const;

// Community chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").$type<typeof MESSAGE_TYPES[number]>().notNull().default("text"),
  attachmentId: integer("attachment_id"), // Optional reference to a shared recipe or other attachment
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shared recipes in the community
export const sharedRecipes = pgTable("shared_recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  ingredients: text("ingredients").array().notNull(),
  preparationTime: integer("preparation_time").notNull(), // in minutes
  instructions: text("instructions").notNull(),
  imageUrl: text("image_url"),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Recipe ratings and comments
export const recipeComments = pgTable("recipe_comments", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => sharedRecipes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  rating: integer("rating"), // 1-5 star rating, optional
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas
export const insertFoodItemSchema = createInsertSchema(foodItems)
  .omit({ id: true, createdAt: true });

export const insertRecipeSchema = createInsertSchema(recipes)
  .omit({ id: true });

export const insertWasteEntrySchema = createInsertSchema(wasteEntries)
  .omit({ id: true, createdAt: true });

export const insertConsumptionEntrySchema = createInsertSchema(consumptionEntries)
  .omit({ id: true, createdAt: true });

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, isVerified: true });

export const insertMealPlanSchema = createInsertSchema(mealPlans)
  .omit({ id: true, createdAt: true });

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings)
  .omit({ id: true, createdAt: true, updatedAt: true, lastNotified: true });

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications)
  .omit({ id: true, createdAt: true });

export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({ id: true, createdAt: true });

export const insertSharedRecipeSchema = createInsertSchema(sharedRecipes)
  .omit({ id: true, createdAt: true, updatedAt: true, likes: true });

export const insertRecipeCommentSchema = createInsertSchema(recipeComments)
  .omit({ id: true, createdAt: true });

// Types
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type WasteEntry = typeof wasteEntries.$inferSelect;
export type InsertWasteEntry = z.infer<typeof insertWasteEntrySchema>;

export type ConsumptionEntry = typeof consumptionEntries.$inferSelect;
export type InsertConsumptionEntry = z.infer<typeof insertConsumptionEntrySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingsSchema>;

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type SharedRecipe = typeof sharedRecipes.$inferSelect;
export type InsertSharedRecipe = z.infer<typeof insertSharedRecipeSchema>;

export type RecipeComment = typeof recipeComments.$inferSelect;
export type InsertRecipeComment = z.infer<typeof insertRecipeCommentSchema>;

// Food item with expiration status
export type FoodItemWithStatus = FoodItem & {
  status: 'expired' | 'expiring-soon' | 'fresh';
  daysUntilExpiration: number;
};

// Chat message with user details
export type ChatMessageWithUser = ChatMessage & {
  user: {
    username: string;
    id: number;
  };
  sharedRecipe?: SharedRecipe;
};

// Define relationships between tables
export const foodItemsRelations = relations(foodItems, ({ many, one }) => ({
  wasteEntries: many(wasteEntries),
  consumptionEntries: many(consumptionEntries),
  user: one(users, {
    fields: [foodItems.userId],
    references: [users.id],
  }),
}));

export const wasteEntriesRelations = relations(wasteEntries, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [wasteEntries.foodItemId],
    references: [foodItems.id],
  }),
  user: one(users, {
    fields: [wasteEntries.userId],
    references: [users.id],
  }),
}));

export const consumptionEntriesRelations = relations(consumptionEntries, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [consumptionEntries.foodItemId],
    references: [foodItems.id],
  }),
  user: one(users, {
    fields: [consumptionEntries.userId],
    references: [users.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  notificationSetting: one(notificationSettings),
  foodItems: many(foodItems),
  wasteEntries: many(wasteEntries),
  consumptionEntries: many(consumptionEntries),
  mealPlans: many(mealPlans),
  chatMessages: many(chatMessages),
  sharedRecipes: many(sharedRecipes),
  recipeComments: many(recipeComments),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  sharedRecipe: one(sharedRecipes, {
    fields: [chatMessages.attachmentId],
    references: [sharedRecipes.id],
  }),
}));

export const sharedRecipesRelations = relations(sharedRecipes, ({ one, many }) => ({
  user: one(users, {
    fields: [sharedRecipes.userId],
    references: [users.id],
  }),
  comments: many(recipeComments),
}));

export const recipeCommentsRelations = relations(recipeComments, ({ one }) => ({
  user: one(users, {
    fields: [recipeComments.userId],
    references: [users.id],
  }),
  recipe: one(sharedRecipes, {
    fields: [recipeComments.recipeId],
    references: [sharedRecipes.id],
  }),
}));
