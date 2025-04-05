import { pgTable, text, serial, integer, date, timestamp, doublePrecision, boolean, foreignKey } from "drizzle-orm/pg-core";
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
  foodItemId: integer("food_item_id").notNull().references(() => foodItems.id),
  quantity: integer("quantity").notNull(),
  unit: text("unit").$type<typeof QUANTITY_UNITS[number]>().notNull(),
  wasteWeight: doublePrecision("waste_weight"), // in kg
  wasteDate: date("waste_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas
export const insertFoodItemSchema = createInsertSchema(foodItems)
  .omit({ id: true, createdAt: true });

export const insertRecipeSchema = createInsertSchema(recipes)
  .omit({ id: true });

export const insertWasteEntrySchema = createInsertSchema(wasteEntries)
  .omit({ id: true, createdAt: true });

// Types
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type WasteEntry = typeof wasteEntries.$inferSelect;
export type InsertWasteEntry = z.infer<typeof insertWasteEntrySchema>;

// Food item with expiration status
export type FoodItemWithStatus = FoodItem & {
  status: 'expired' | 'expiring-soon' | 'fresh';
  daysUntilExpiration: number;
};

// Define relationships between tables
export const foodItemsRelations = relations(foodItems, ({ many }) => ({
  wasteEntries: many(wasteEntries),
}));

// User profiles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notification settings
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expirationAlerts: boolean("expiration_alerts").notNull().default(true),
  expirationFrequency: text("expiration_frequency").$type<typeof NOTIFICATION_FREQUENCIES[number]>().notNull().default("weekly"),
  weeklyReport: boolean("weekly_report").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  emailAddress: text("email_address"),
  lastNotified: timestamp("last_notified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings)
  .omit({ id: true, createdAt: true, updatedAt: true, lastNotified: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingsSchema>;

export const wasteEntriesRelations = relations(wasteEntries, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [wasteEntries.foodItemId],
    references: [foodItems.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  notificationSetting: one(notificationSettings),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));
