import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFoodItemSchema, 
  insertWasteEntrySchema, 
  insertUserSchema,
  insertNotificationSettingsSchema,
  FoodItemWithStatus 
} from "@shared/schema";
import { differenceInDays, isAfter } from "date-fns";
import { setupAuth } from "./auth";
import { emailService } from "./email-service";
import { ENABLE_EMAIL_FALLBACK } from "./email-service";
import { aiService } from "./ai-service";

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
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteFoodItem(id);
      if (!success) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
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
      
      // Estimate waste saved (in a real app, this would compare to previous periods)
      const wasteSaved = foodItems.length * 0.1; // Simple placeholder calculation
      
      res.json({
        totalItems: foodItems.length,
        expiringCount: expiringItems.length,
        wasteSavedKg: parseFloat(wasteSaved.toFixed(1))
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
  
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
