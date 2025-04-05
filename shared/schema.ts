import { pgTable, text, serial, integer, date, timestamp, doublePrecision, foreignKey } from "drizzle-orm/pg-core";
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

export const wasteEntriesRelations = relations(wasteEntries, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [wasteEntries.foodItemId],
    references: [foodItems.id],
  }),
}));
