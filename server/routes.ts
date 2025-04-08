import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertFoodItemSchema, 
  insertWasteEntrySchema, 
  insertConsumptionEntrySchema,
  insertUserSchema,
  insertNotificationSettingsSchema,
  insertMealPlanSchema,
  insertChatMessageSchema,
  insertSharedRecipeSchema,
  insertRecipeCommentSchema,
  FoodItemWithStatus,
  ChatMessageWithUser
} from "@shared/schema";
import { differenceInDays, isAfter } from "date-fns";
import { setupAuth } from "./auth";
import { emailService } from "./email-service";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { ENABLE_EMAIL_FALLBACK } from "./email-service";
import { aiService } from "./ai-service";
import { ZodError } from "zod";

// Helper function to format Zod validation errors
function formatZodError(error: ZodError): string {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  const apiRouter = express.Router();
  
  // Food Items
  apiRouter.get("/food-items", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const items = await storage.getFoodItemsByUserId(userId);
      
      // Add expiration status to each item
      const itemsWithStatus: FoodItemWithStatus[] = items.map(item => {
        const expirationDate = new Date(item.expirationDate);
        const today = new Date();
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        
        let status: 'expired' | 'expiring-soon' | 'fresh';
        if (!isAfter(expirationDate, today)) {
          status = 'expired';
        } else if (daysUntilExpiration <= 3) {
          status = 'expiring-soon';
        } else {
          status = 'fresh';
        }
        
        return {
          ...item,
          status,
          daysUntilExpiration
        };
      });
      
      res.json(itemsWithStatus);
    } catch (error) {
      console.error("Error fetching food items:", error);
      res.status(500).json({ message: "Failed to retrieve food items" });
    }
  });
  
  apiRouter.get("/food-items/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const item = await storage.getFoodItem(id);
      if (!item) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      // Check if the food item belongs to the authenticated user
      if (item.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to access this food item" });
      }
      
      // Add expiration status
      const expirationDate = new Date(item.expirationDate);
      const today = new Date();
      const daysUntilExpiration = differenceInDays(expirationDate, today);
      
      let status: 'expired' | 'expiring-soon' | 'fresh';
      if (!isAfter(expirationDate, today)) {
        status = 'expired';
      } else if (daysUntilExpiration <= 3) {
        status = 'expiring-soon';
      } else {
        status = 'fresh';
      }
      
      const itemWithStatus: FoodItemWithStatus = {
        ...item,
        status,
        daysUntilExpiration
      };
      
      res.json(itemWithStatus);
    } catch (error) {
      console.error("Error retrieving food item:", error);
      res.status(500).json({ message: "Failed to retrieve food item" });
    }
  });
  
  apiRouter.post("/food-items", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validation = insertFoodItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid food item data", 
          errors: validation.error.format() 
        });
      }
      
      // Add the user ID from the authenticated session
      const itemData = {
        ...validation.data,
        userId: req.user!.id
      };
      
      const newItem = await storage.createFoodItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating food item:", error);
      res.status(500).json({ message: "Failed to create food item" });
    }
  });
  
  apiRouter.patch("/food-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partially validate the update fields
      const validation = insertFoodItemSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid food item update data", 
          errors: validation.error.format() 
        });
      }
      
      const updatedItem = await storage.updateFoodItem(id, validation.data);
      if (!updatedItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update food item" });
    }
  });
  
  apiRouter.delete("/food-items/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get the food item to check if it belongs to the authenticated user
      const foodItem = await storage.getFoodItem(id);
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      // Make sure the food item belongs to the authenticated user
      if (foodItem.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this food item" });
      }
      
      console.log(`Attempting to delete food item ${id} for user ${req.user!.id}`);
      const success = await storage.deleteFoodItem(id);
      if (!success) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      console.log(`Successfully deleted food item ${id}`);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });
  
  // Recipes
  apiRouter.get("/recipes", async (req: Request, res: Response) => {
    try {
      const recipes = await storage.getAllRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve recipes" });
    }
  });
  
  apiRouter.get("/recipes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve recipe" });
    }
  });
  
  // AI Recipe suggestions based on food items
  apiRouter.get("/recipe-suggestions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if OpenAI is configured
      if (!aiService.isConfigured()) {
        return res.status(503).json({ message: "AI recipe suggestions are not available at the moment" });
      }
      
      const userId = req.user!.id;
      
      // Get user's food items with expiration status
      const items = await storage.getFoodItemsByUserId(userId);
      
      // If no items, return empty array
      if (items.length === 0) {
        return res.json({ recipes: [] });
      }
      
      // Add expiration status to each item
      const itemsWithStatus: FoodItemWithStatus[] = items.map(item => {
        const expirationDate = new Date(item.expirationDate);
        const today = new Date();
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        
        let status: 'expired' | 'expiring-soon' | 'fresh';
        if (!isAfter(expirationDate, today)) {
          status = 'expired';
        } else if (daysUntilExpiration <= 3) {
          status = 'expiring-soon';
        } else {
          status = 'fresh';
        }
        
        return {
          ...item,
          status,
          daysUntilExpiration
        };
      });
      
      // Get priority parameter (whether to prioritize expiring items)
      const useExpiring = req.query.expiring !== 'false';
      
      // Get limit parameter (number of recipes to generate)
      const limit = parseInt(req.query.limit as string) || 3;
      
      // Generate AI recipe suggestions
      const suggestions = await aiService.generateRecipeSuggestions(
        itemsWithStatus,
        useExpiring, 
        Math.min(limit, 5) // Cap at 5 recipes max
      );
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating AI recipe suggestions:", error);
      res.status(500).json({ 
        message: "Failed to generate recipe suggestions",
        error: (error as Error).message
      });
    }
  });
  
  // Generate detailed AI recipe based on selected ingredients
  apiRouter.post("/recipe-details", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if OpenAI is configured
      if (!aiService.isConfigured()) {
        return res.status(503).json({ message: "AI recipe generation is not available at the moment" });
      }
      
      const { ingredients, dietary } = req.body;
      
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: "At least one ingredient is required" });
      }
      
      // Generate detailed recipe
      const recipe = await aiService.generateDetailedRecipe(ingredients, dietary);
      
      res.json(recipe);
    } catch (error) {
      console.error("Error generating detailed recipe:", error);
      res.status(500).json({ 
        message: "Failed to generate detailed recipe",
        error: (error as Error).message
      });
    }
  });
  
  // Waste Entries
  apiRouter.post("/waste-entries", async (req: Request, res: Response) => {
    try {
      const validation = insertWasteEntrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid waste entry data", 
          errors: validation.error.format() 
        });
      }
      
      const newEntry = await storage.createWasteEntry(validation.data);
      res.status(201).json(newEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create waste entry" });
    }
  });
  
  apiRouter.get("/waste-insights", async (req: Request, res: Response) => {
    try {
      // Default to last 6 months if not specified
      const months = parseInt(req.query.months as string) || 6;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);
      
      const entries = await storage.getWasteEntriesByDateRange(startDate, endDate);
      
      // Group by month
      const monthlyData: Record<string, number> = {};
      
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(endDate.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyData[monthKey] = 0;
      }
      
      // Calculate waste weight per month
      entries.forEach(entry => {
        const wasteDate = new Date(entry.wasteDate);
        const monthKey = `${wasteDate.getFullYear()}-${wasteDate.getMonth() + 1}`;
        
        // Use wasteWeight if available, otherwise estimate based on quantity
        const weight = entry.wasteWeight || (entry.quantity * 0.25); // Rough estimate if weight not provided
        
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += weight;
        }
      });
      
      // Format for chart display
      const labels = Object.keys(monthlyData)
        .sort()
        .map(key => {
          const [year, month] = key.split('-').map(Number);
          return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
        });
      
      const data = Object.keys(monthlyData)
        .sort()
        .map(key => parseFloat(monthlyData[key].toFixed(2)));
      
      // Calculate trend
      let trend = 0;
      if (data.length >= 2) {
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        
        if (previous > 0) {
          trend = ((latest - previous) / previous) * 100;
        }
      }
      
      res.json({
        labels,
        data,
        trend: parseFloat(trend.toFixed(2))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate waste insights" });
    }
  });
  
  // Consumption Entries
  apiRouter.post("/consumption-entries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log("Received consumption entry data:", req.body);
      
      const validation = insertConsumptionEntrySchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Validation error:", validation.error.format());
        return res.status(400).json({ 
          message: "Invalid consumption entry data", 
          errors: validation.error.format() 
        });
      }
      
      // Add the user ID from the authenticated session
      const entryData = {
        ...validation.data,
        userId: req.user!.id
      };
      
      console.log("Validated entry data:", entryData);
      
      const newEntry = await storage.createConsumptionEntry(entryData);
      res.status(201).json(newEntry);
    } catch (error) {
      console.error("Error creating consumption entry:", error);
      res.status(500).json({ message: "Failed to create consumption entry" });
    }
  });
  
  apiRouter.get("/consumption-entries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const entries = await storage.getConsumptionEntriesByUserId(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching consumption entries:", error);
      res.status(500).json({ message: "Failed to retrieve consumption entries" });
    }
  });
  
  apiRouter.get("/consumption-insights", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Default to last 6 months if not specified
      const months = parseInt(req.query.months as string) || 6;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);
      
      const userId = req.user!.id;
      const entries = await storage.getConsumptionEntriesByDateRange(userId, startDate, endDate);
      
      // Group by month
      const monthlyData: Record<string, { count: number, value: number }> = {};
      
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(endDate.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyData[monthKey] = { count: 0, value: 0 };
      }
      
      // Calculate consumption per month
      entries.forEach(entry => {
        const consumptionDate = new Date(entry.consumptionDate);
        const monthKey = `${consumptionDate.getFullYear()}-${consumptionDate.getMonth() + 1}`;
        
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey].count += 1;
          monthlyData[monthKey].value += (entry.estimatedValue || 0);
        }
      });
      
      // Format for chart display
      const labels = Object.keys(monthlyData)
        .sort()
        .map(key => {
          const [year, month] = key.split('-').map(Number);
          return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
        });
      
      const countData = Object.keys(monthlyData)
        .sort()
        .map(key => monthlyData[key].count);
        
      const valueData = Object.keys(monthlyData)
        .sort()
        .map(key => parseFloat(monthlyData[key].value.toFixed(2)));
      
      // Calculate trend for consumption value
      let trend = 0;
      if (valueData.length >= 2) {
        const latest = valueData[valueData.length - 1];
        const previous = valueData[valueData.length - 2];
        
        if (previous > 0) {
          trend = ((latest - previous) / previous) * 100;
        }
      }
      
      res.json({
        labels,
        countData,
        valueData,
        trend: parseFloat(trend.toFixed(2))
      });
    } catch (error) {
      console.error("Error calculating consumption insights:", error);
      res.status(500).json({ message: "Failed to calculate consumption insights" });
    }
  });
  
  // Meal Plan endpoints
  apiRouter.get("/meal-plans", async (req: Request, res: Response) => {
    try {
      // Make sure the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const mealPlans = await storage.getMealPlansByUserId(userId);
      
      res.json(mealPlans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ error: "Failed to fetch meal plans" });
    }
  });
  
  apiRouter.get("/meal-plans/date-range", async (req: Request, res: Response) => {
    try {
      // Make sure the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const mealPlans = await storage.getMealPlansByDateRange(userId, start, end);
      
      res.json(mealPlans);
    } catch (error) {
      console.error("Error fetching meal plans by date range:", error);
      res.status(500).json({ error: "Failed to fetch meal plans" });
    }
  });
  
  apiRouter.get("/meal-plans/:id", async (req: Request, res: Response) => {
    try {
      // Make sure the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const mealPlanId = parseInt(req.params.id);
      
      if (isNaN(mealPlanId)) {
        return res.status(400).json({ error: "Invalid meal plan ID" });
      }
      
      const mealPlan = await storage.getMealPlan(mealPlanId);
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      // Make sure the meal plan belongs to the authenticated user
      if (mealPlan.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this meal plan" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({ error: "Failed to fetch meal plan" });
    }
  });
  
  apiRouter.post("/meal-plans", async (req: Request, res: Response) => {
    try {
      // Make sure the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      
      // Validate the meal plan data using the insert schema
      const validation = insertMealPlanSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid meal plan data", 
          details: formatZodError(validation.error)
        });
      }
      
      // Create the meal plan
      const mealPlan = await storage.createMealPlan(validation.data);
      
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: formatZodError(error) });
      }
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  });
  
  apiRouter.patch("/meal-plans/:id", async (req: Request, res: Response) => {
    try {
      // Make sure the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const mealPlanId = parseInt(req.params.id);
      
      if (isNaN(mealPlanId)) {
        return res.status(400).json({ error: "Invalid meal plan ID" });
      }
      
      // Get the current meal plan
      const existingMealPlan = await storage.getMealPlan(mealPlanId);
      
      if (!existingMealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      // Make sure the meal plan belongs to the authenticated user
      if (existingMealPlan.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this meal plan" });
      }
      
      // Update the meal plan
      const updatedMealPlan = await storage.updateMealPlan(mealPlanId, req.body);
      
      res.json(updatedMealPlan);
    } catch (error) {
      console.error("Error updating meal plan:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: formatZodError(error) });
      }
      res.status(500).json({ error: "Failed to update meal plan" });
    }
  });
  
  apiRouter.delete("/meal-plans/:id", async (req: Request, res: Response) => {
    try {
      // Make sure the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const mealPlanId = parseInt(req.params.id);
      
      if (isNaN(mealPlanId)) {
        return res.status(400).json({ error: "Invalid meal plan ID" });
      }
      
      // Get the current meal plan
      const existingMealPlan = await storage.getMealPlan(mealPlanId);
      
      if (!existingMealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      // Make sure the meal plan belongs to the authenticated user
      if (existingMealPlan.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this meal plan" });
      }
      
      // Delete the meal plan
      const success = await storage.deleteMealPlan(mealPlanId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete meal plan" });
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      res.status(500).json({ error: "Failed to delete meal plan" });
    }
  });
  
  // Dashboard stats
  apiRouter.get("/dashboard-stats", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const foodItems = await storage.getFoodItemsByUserId(userId);
      
      const today = new Date();
      
      // Count expiring items (expiring in 3 days or less)
      const expiringItems = foodItems.filter(item => {
        const expirationDate = new Date(item.expirationDate);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        return daysUntilExpiration <= 3 && isAfter(expirationDate, today);
      });
      
      // Calculate total waste saved (placeholder logic for MVP)
      const wasteEntries = await storage.getWasteEntriesByDateRange(
        new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
        today
      );
      
      // Calculate recent waste weight
      const wasteWeight = wasteEntries.reduce((total, entry) => {
        return total + (entry.wasteWeight || 0);
      }, 0);
      
      // Get consumption entries for the last 3 months
      const consumptionEntries = await storage.getConsumptionEntriesByDateRange(
        userId,
        new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
        today
      );
      
      // Calculate consumption metrics
      const consumedCount = consumptionEntries.length;
      const consumedValue = consumptionEntries.reduce((total, entry) => {
        return total + (entry.estimatedValue || 0);
      }, 0);
      
      // Estimate waste saved (in a real app, this would compare to previous periods)
      const wasteSaved = foodItems.length * 0.1; // Simple placeholder calculation
      
      res.json({
        totalItems: foodItems.length,
        expiringCount: expiringItems.length,
        wasteSavedKg: parseFloat(wasteSaved.toFixed(1)),
        consumedCount,
        consumedValue: parseFloat(consumedValue.toFixed(2))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate dashboard stats" });
    }
  });
  
  // Sustainability tips
  apiRouter.get("/sustainability-tips", (_req: Request, res: Response) => {
    const tips = [
      {
        id: 1,
        title: "Store food properly",
        content: "Learn the optimal storage conditions for different types of food to extend their shelf life."
      },
      {
        id: 2,
        title: "Practice FIFO (First In, First Out)",
        content: "Place newly purchased items at the back and move older items to the front to use them first."
      },
      {
        id: 3,
        title: "Cook with leftovers",
        content: "Get creative with leftovers instead of throwing them away. Many dishes taste even better the next day."
      },
      {
        id: 4,
        title: "Freeze excess food",
        content: "Most foods can be frozen to extend their life. Portion them before freezing for easier use later."
      },
      {
        id: 5,
        title: "Plan your meals",
        content: "Plan your meals for the week and shop with a list to avoid buying more than you need."
      },
      {
        id: 6,
        title: "Understand date labels",
        content: "'Best by' doesn't mean 'bad after'. Many foods are still good to eat after their best-by date."
      },
      {
        id: 7,
        title: "Compost food scraps",
        content: "If you can't use food scraps in cooking, compost them instead of sending them to landfill."
      }
    ];
    
    res.json(tips);
  });

  // User Management
  apiRouter.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user" });
    }
  });

  apiRouter.post("/users", async (req: Request, res: Response) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: validation.error.format() 
        });
      }
      
      // Check if email already exists (if email is provided)
      if (validation.data.email) {
        const existingUser = await storage.getUserByEmail(validation.data.email);
        if (existingUser) {
          return res.status(409).json({ message: "User with this email already exists" });
        }
      }
      
      const newUser = await storage.createUser(validation.data);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  apiRouter.patch("/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partially validate the update fields
      const validation = insertUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid user update data", 
          errors: validation.error.format() 
        });
      }
      
      // If email is being updated, check if it already exists
      if (validation.data.email) {
        const existingUser = await storage.getUserByEmail(validation.data.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({ message: "User with this email already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(id, validation.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  apiRouter.delete("/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Verify the user exists first
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is deleting their own account
      if (req.user && req.user.id !== id) {
        return res.status(403).json({ message: "Not authorized to delete this account" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      // Logout the user if they deleted their own account
      if (req.user && req.user.id === id) {
        req.logout((err) => {
          if (err) {
            console.error("Error logging out after account deletion:", err);
          }
        });
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Notification Settings
  apiRouter.get("/notification-settings/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      let settings = await storage.getNotificationSettings(userId);
      
      // If settings don't exist, create default settings for this user
      if (!settings) {
        // Check if user exists
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Create default notification settings
        const defaultSettings = {
          userId,
          expirationAlerts: true,
          expirationFrequency: 'weekly' as 'daily' | 'weekly' | 'never',
          weeklySummary: false,
          emailEnabled: true,
          emailAddress: user.email
        };
        
        settings = await storage.createNotificationSettings(defaultSettings);
        console.log(`Created default notification settings for user ${userId}`);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error in notification settings retrieval:", error);
      res.status(500).json({ message: "Failed to retrieve notification settings" });
    }
  });

  apiRouter.post("/notification-settings", async (req: Request, res: Response) => {
    try {
      const validation = insertNotificationSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid notification settings data", 
          errors: validation.error.format() 
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(validation.data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if settings already exist for this user
      const existingSettings = await storage.getNotificationSettings(validation.data.userId);
      if (existingSettings) {
        return res.status(409).json({ message: "Notification settings already exist for this user" });
      }
      
      const newSettings = await storage.createNotificationSettings(validation.data);
      res.status(201).json(newSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification settings" });
    }
  });

  apiRouter.patch("/notification-settings/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partially validate the update fields
      const validation = insertNotificationSettingsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid notification settings update data", 
          errors: validation.error.format() 
        });
      }
      
      const updatedSettings = await storage.updateNotificationSettings(id, validation.data);
      if (!updatedSettings) {
        return res.status(404).json({ message: "Notification settings not found" });
      }
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Email Notification Endpoints
  apiRouter.post("/notifications/send-test", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get user and their notification settings
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        // Create default notification settings if they don't exist
        const defaultSettings = {
          userId,
          expirationAlerts: true,
          expirationFrequency: 'weekly' as 'daily' | 'weekly' | 'never',
          weeklySummary: false,
          emailEnabled: true,
          emailAddress: user.email
        };
        
        settings = await storage.createNotificationSettings(defaultSettings);
        console.log(`Created default notification settings for user ${userId} during test notification`);
      }
      
      if (!settings.emailEnabled || !settings.emailAddress) {
        return res.status(400).json({ message: "Email notifications are not enabled or email address is missing" });
      }
      
      // Send test email via SendGrid with the user's ID to filter food items
      const emailSent = await emailService.sendTestNotification(settings.emailAddress, userId);
      
      // Update last notified timestamp regardless of whether the email was sent
      // as we want to track when notification was attempted
      await storage.updateLastNotified(settings.id, new Date());
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Test notification sent successfully",
          emailAddress: settings.emailAddress
        });
      } else {
        // Handle the fallback case where email functionality is in development mode
        if (process.env.NODE_ENV === 'development') {
          res.json({ 
            success: true, 
            message: "Test notification processed (development mode - check server logs)",
            emailAddress: settings.emailAddress,
            devMode: true
          });
        } else {
          res.status(500).json({ 
            success: false,
            message: "Failed to send test notification email. Check your SendGrid configuration."
          });
        }
      }
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send test notification", 
        error: (error as Error).message 
      });
    }
  });
  
  apiRouter.post("/notifications/expiring-items", async (req: Request, res: Response) => {
    try {
      const { userId, daysThreshold = 3 } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get user and their notification settings
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        // Create default notification settings if they don't exist
        const defaultSettings = {
          userId,
          expirationAlerts: true,
          expirationFrequency: 'weekly' as 'daily' | 'weekly' | 'never',
          weeklySummary: false,
          emailEnabled: true,
          emailAddress: user.email
        };
        
        settings = await storage.createNotificationSettings(defaultSettings);
        console.log(`Created default notification settings for user ${userId} in expiring-items endpoint`);
      }
      
      if (!settings.emailEnabled || !settings.emailAddress || !settings.expirationAlerts) {
        return res.status(400).json({ message: "Expiration alerts are not enabled" });
      }
      
      // Get expiring items within the threshold for this specific user
      const expiringItems = await storage.getExpiringFoodItemsForNotification(daysThreshold, userId);
      
      // Convert to FoodItemWithStatus format
      const today = new Date();
      const expiringItemsWithStatus = expiringItems.map(item => {
        const expirationDate = new Date(item.expirationDate);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        
        let status: 'expired' | 'expiring-soon' | 'fresh';
        if (!isAfter(expirationDate, today)) {
          status = 'expired';
        } else if (daysUntilExpiration <= 3) {
          status = 'expiring-soon';
        } else {
          status = 'fresh';
        }
        
        return {
          ...item,
          status,
          daysUntilExpiration
        };
      });
      
      // Update last notified timestamp regardless of whether the email was sent
      await storage.updateLastNotified(settings.id, new Date());
      
      let emailSent = false;
      
      // Only send notification if there are expiring items
      if (expiringItemsWithStatus.length > 0) {
        // Filter items that are actually expiring soon or expired
        const relevantItems = expiringItemsWithStatus.filter(
          item => item.status === 'expired' || item.status === 'expiring-soon'
        );
        
        if (relevantItems.length > 0) {
          // Send notification via SendGrid
          emailSent = await emailService.sendExpirationNotification(
            settings.emailAddress, 
            relevantItems
          );
        }
      }
      
      // If there are no relevant items or we have our fallback in place
      if (emailSent || (process.env.NODE_ENV === 'development' && ENABLE_EMAIL_FALLBACK)) {
        res.json({ 
          success: true, 
          message: "Expiration notification processed successfully",
          emailAddress: settings.emailAddress,
          itemCount: expiringItems.length,
          items: expiringItems,
          devMode: process.env.NODE_ENV === 'development' && !emailSent
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to send expiration notification email. Check your SendGrid configuration."
        });
      }
    } catch (error) {
      console.error("Expiration notification error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process expiration notification",
        error: (error as Error).message
      });
    }
  });
  
  // Weekly summary email
  apiRouter.post("/notifications/weekly-summary", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get user and their notification settings
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        // Create default notification settings if they don't exist
        const defaultSettings = {
          userId,
          expirationAlerts: true,
          expirationFrequency: 'weekly' as 'daily' | 'weekly' | 'never',
          weeklySummary: false,
          emailEnabled: true,
          emailAddress: user.email
        };
        
        settings = await storage.createNotificationSettings(defaultSettings);
        console.log(`Created default notification settings for user ${userId} in weekly-summary endpoint`);
      }
      
      if (!settings.emailEnabled || !settings.emailAddress || !settings.weeklySummary) {
        return res.status(400).json({ message: "Weekly summary emails are not enabled" });
      }
      
      // Get all food items for the user
      const foodItems = await storage.getFoodItemsByUserId(userId);
      
      // Convert to FoodItemWithStatus format
      const today = new Date();
      const foodItemsWithStatus = foodItems.map(item => {
        const expirationDate = new Date(item.expirationDate);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        
        let status: 'expired' | 'expiring-soon' | 'fresh';
        if (!isAfter(expirationDate, today)) {
          status = 'expired';
        } else if (daysUntilExpiration <= 3) {
          status = 'expiring-soon';
        } else {
          status = 'fresh';
        }
        
        return {
          ...item,
          status,
          daysUntilExpiration
        };
      });
      
      // Send weekly summary via SendGrid
      const emailSent = await emailService.sendWeeklySummary(
        settings.emailAddress, 
        foodItemsWithStatus
      );
      
      // Update last notified timestamp regardless of whether the email was sent
      await storage.updateLastNotified(settings.id, new Date());
      
      if (emailSent || (process.env.NODE_ENV === 'development' && ENABLE_EMAIL_FALLBACK)) {
        res.json({ 
          success: true, 
          message: "Weekly summary processed successfully",
          emailAddress: settings.emailAddress,
          itemCount: foodItems.length,
          devMode: process.env.NODE_ENV === 'development' && !emailSent
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to send weekly summary email. Check your SendGrid configuration."
        });
      }
    } catch (error) {
      console.error("Weekly summary error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send weekly summary", 
        error: (error as Error).message 
      });
    }
  });
  
  // Community chat and recipe sharing endpoints
  
  // Get chat messages
  apiRouter.get("/chat-messages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(limit);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to retrieve chat messages" });
    }
  });
  
  // Delete a chat message
  apiRouter.delete("/chat-messages/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      // Get the message to verify ownership
      const message = await storage.getChatMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if user owns this message
      if (message.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own messages" });
      }
      
      // Delete the message
      await storage.deleteChatMessage(messageId);
      
      // Broadcast the deletion to all clients
      broadcastToClients(JSON.stringify({
        type: 'message_deleted',
        data: { messageId }
      }));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat message:", error);
      res.status(500).json({ message: "Failed to delete chat message" });
    }
  });
  
  // Post a new chat message
  apiRouter.post("/chat-messages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validation = insertChatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid chat message data", 
          errors: validation.error.format() 
        });
      }
      
      // Add the user ID from the authenticated session
      const messageData = {
        ...validation.data,
        userId: req.user!.id
      };
      
      const newMessage = await storage.createChatMessage(messageData);
      
      // Get full message with user details for broadcasting
      const user = await storage.getUser(req.user!.id);
      const messageWithUser: ChatMessageWithUser = {
        ...newMessage,
        user: {
          id: user!.id,
          username: user!.username
        }
      };
      
      // If this is a recipe share, get the recipe details
      if (newMessage.messageType === 'recipe_share' && newMessage.attachmentId) {
        const recipe = await storage.getSharedRecipe(newMessage.attachmentId);
        if (recipe) {
          messageWithUser.sharedRecipe = recipe;
        }
      }
      
      // Broadcast to all connected WebSocket clients
      broadcastToClients(JSON.stringify({
        type: 'new_message',
        data: messageWithUser
      }));
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });
  
  // Get shared recipes
  apiRouter.get("/shared-recipes", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const recipes = await storage.getSharedRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching shared recipes:", error);
      res.status(500).json({ message: "Failed to retrieve shared recipes" });
    }
  });
  
  // Get a single shared recipe
  apiRouter.get("/shared-recipes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const recipe = await storage.getSharedRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Shared recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Error retrieving shared recipe:", error);
      res.status(500).json({ message: "Failed to retrieve shared recipe" });
    }
  });
  
  // Share a new recipe
  apiRouter.post("/shared-recipes", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validation = insertSharedRecipeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid recipe data", 
          errors: validation.error.format() 
        });
      }
      
      // Add the user ID from the authenticated session
      const recipeData = {
        ...validation.data,
        userId: req.user!.id
      };
      
      const newRecipe = await storage.createSharedRecipe(recipeData);
      
      // Create a chat message about the new shared recipe
      const chatMessage = await storage.createChatMessage({
        userId: req.user!.id,
        content: `Shared a new recipe: ${newRecipe.name}`,
        messageType: 'recipe_share',
        attachmentId: newRecipe.id
      });
      
      // Get user details for broadcasting
      const user = await storage.getUser(req.user!.id);
      const messageWithUser: ChatMessageWithUser = {
        ...chatMessage,
        user: {
          id: user!.id,
          username: user!.username
        },
        sharedRecipe: newRecipe
      };
      
      // Broadcast to all connected WebSocket clients
      broadcastToClients(JSON.stringify({
        type: 'new_recipe',
        data: {
          message: messageWithUser,
          recipe: newRecipe
        }
      }));
      
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error("Error creating shared recipe:", error);
      res.status(500).json({ message: "Failed to create shared recipe" });
    }
  });
  
  // Comment on a shared recipe
  apiRouter.post("/recipe-comments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validation = insertRecipeCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid comment data", 
          errors: validation.error.format() 
        });
      }
      
      // Add the user ID from the authenticated session
      const commentData = {
        ...validation.data,
        userId: req.user!.id
      };
      
      const newComment = await storage.createRecipeComment(commentData);
      
      // Get the recipe and update its popularity if there's a rating
      if (newComment.rating) {
        const recipe = await storage.getSharedRecipe(newComment.recipeId);
        if (recipe) {
          // Increment likes if rating is 4 or 5
          if (newComment.rating >= 4) {
            // Create a SQL-safe update since direct property access would cause type error
            const updatedRecipe = await storage.updateSharedRecipe(recipe.id, { 
              // Using any to bypass type checking since 'likes' exists in the database but not in the type
              ...({"likes": recipe.likes + 1} as any)
            });
            
            // Broadcast rating update
            broadcastToClients(JSON.stringify({
              type: 'recipe_rated',
              data: {
                recipeId: recipe.id,
                likes: recipe.likes + 1
              }
            }));
          }
        }
      }
      
      // Get the comments for the recipe
      const comments = await storage.getRecipeComments(newComment.recipeId);
      
      // Broadcast to all connected WebSocket clients
      broadcastToClients(JSON.stringify({
        type: 'new_comment',
        data: {
          recipeId: newComment.recipeId,
          comment: newComment,
          commentCount: comments.length
        }
      }));
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating recipe comment:", error);
      res.status(500).json({ message: "Failed to create recipe comment" });
    }
  });
  
  // Get comments for a recipe
  apiRouter.get("/recipe-comments/:recipeId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalid recipe ID format" });
      }
      
      const comments = await storage.getRecipeComments(recipeId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching recipe comments:", error);
      res.status(500).json({ message: "Failed to retrieve recipe comments" });
    }
  });
  
  // Delete a shared recipe
  apiRouter.delete("/shared-recipes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const recipeId = parseInt(req.params.id);
      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      // Get the recipe to verify ownership
      const recipe = await storage.getSharedRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if user owns this recipe
      if (recipe.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own recipes" });
      }
      
      // Find related chat message for this recipe
      const relatedMessages = await storage.getChatMessagesByAttachmentId(recipeId);
      
      // Delete the recipe
      await storage.deleteSharedRecipe(recipeId);
      
      // Delete associated messages
      for (const message of relatedMessages) {
        await storage.deleteChatMessage(message.id);
      }
      
      // Broadcast the deletion to all clients
      broadcastToClients(JSON.stringify({
        type: 'recipe_deleted',
        data: { 
          recipeId,
          messageIds: relatedMessages.map(m => m.id)
        }
      }));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shared recipe:", error);
      res.status(500).json({ message: "Failed to delete shared recipe" });
    }
  });

  // Configure multer for image uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Configure multer storage
  const uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Generate a random filename to prevent collisions
      const uniqueSuffix = randomBytes(8).toString('hex');
      const extension = path.extname(file.originalname);
      cb(null, `${Date.now()}-${uniqueSuffix}${extension}`);
    }
  });
  
  // Create multer upload middleware
  const upload = multer({ 
    storage: uploadStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    }
  });
  
  // Image upload endpoint
  apiRouter.post('/upload-image', upload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return the path to the uploaded file
      const imagePath = `/uploads/${req.file.filename}`;
      res.status(201).json({ 
        message: "Image uploaded successfully",
        imagePath 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));
  
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  // Broadcast message to all connected clients
  function broadcastToClients(message: string) {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to chat WebSocket');
    
    // Add client to our set
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system',
      data: {
        message: 'Connected to FoodExpiry Community Chat',
        timestamp: new Date().toISOString()
      }
    }));
    
    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);
        
        // Handle different types of messages here if needed
        // Most message handling is done through the REST API endpoints
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from chat WebSocket');
      clients.delete(ws);
    });
  });
  
  return httpServer;
}
