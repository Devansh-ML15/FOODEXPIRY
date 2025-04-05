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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  const apiRouter = express.Router();
  
  // Barcode Service
  const barcodeService = {
    async lookupBarcode(barcode: string) {
      try {
        // In a real application, this would connect to a product database or external API
        // For demonstration, we'll use a mock implementation with some sample products
        
        // Simulated delay to mimic a real API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Sample product database (would be replaced with a real API in production)
        const sampleProducts: Record<string, {name: string, category: string}> = {
          '0123456789012': { name: 'Organic Milk', category: 'dairy' },
          '5901234123457': { name: 'Whole Grain Bread', category: 'bakery' },
          '4000417025005': { name: 'Bananas', category: 'produce' },
          '8888888888888': { name: 'Frozen Pizza', category: 'frozen' },
          '7777777777777': { name: 'Pasta Sauce', category: 'canned' },
          '6666666666666': { name: 'Chicken Breast', category: 'meat' },
        };
        
        // Return the product if found, otherwise return empty object
        return sampleProducts[barcode] || { name: '', category: '' };
      } catch (error) {
        console.error('Barcode lookup error:', error);
        throw new Error('Failed to lookup barcode');
      }
    }
  };
  
  // Barcode lookup endpoint
  apiRouter.get("/barcode-lookup", async (req: Request, res: Response) => {
    const barcode = req.query.code as string;
    
    if (!barcode) {
      return res.status(400).json({ message: "Barcode is required" });
    }
    
    try {
      const product = await barcodeService.lookupBarcode(barcode);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to lookup barcode information" });
    }
  });
  
  // Food Items
  apiRouter.get("/food-items", async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllFoodItems();
      
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
      res.status(500).json({ message: "Failed to retrieve food items" });
    }
  });
  
  apiRouter.get("/food-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const item = await storage.getFoodItem(id);
      if (!item) {
        return res.status(404).json({ message: "Food item not found" });
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
      res.status(500).json({ message: "Failed to retrieve food item" });
    }
  });
  
  apiRouter.post("/food-items", async (req: Request, res: Response) => {
    try {
      const validation = insertFoodItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid food item data", 
          errors: validation.error.format() 
        });
      }
      
      const newItem = await storage.createFoodItem(validation.data);
      res.status(201).json(newItem);
    } catch (error) {
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
  
  // Recipe suggestions based on food items
  apiRouter.get("/recipe-suggestions", async (req: Request, res: Response) => {
    try {
      const foodItems = await storage.getAllFoodItems();
      const recipes = await storage.getAllRecipes();
      
      // Get food item names for matching with recipe ingredients
      const itemNames = foodItems.map(item => item.name.toLowerCase());
      
      // Match recipes with available ingredients
      const suggestions = recipes.map(recipe => {
        const matchingIngredients = recipe.ingredients.filter(ingredient => 
          itemNames.some(item => ingredient.toLowerCase().includes(item))
        );
        
        return {
          ...recipe,
          matchingIngredients,
          matchScore: matchingIngredients.length / recipe.ingredients.length
        };
      })
      .filter(recipe => recipe.matchingIngredients.length > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recipe suggestions" });
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
      const foodItems = await storage.getAllFoodItems();
      const recipes = await storage.getAllRecipes();
      
      const today = new Date();
      
      // Count expiring items (expiring in 3 days or less)
      const expiringItems = foodItems.filter(item => {
        const expirationDate = new Date(item.expirationDate);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        return daysUntilExpiration <= 3 && isAfter(expirationDate, today);
      });
      
      // Get recipe matches count
      const itemNames = foodItems.map(item => item.name.toLowerCase());
      const recipeMatches = recipes.filter(recipe => 
        recipe.ingredients.some(ingredient => 
          itemNames.some(item => ingredient.toLowerCase().includes(item))
        )
      );
      
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
        recipeMatchCount: recipeMatches.length,
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
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validation.data.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
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

  // Notification Settings
  apiRouter.get("/notification-settings/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Notification settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
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
      
      const settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Notification settings not found" });
      }
      
      if (!settings.emailEnabled || !settings.emailAddress) {
        return res.status(400).json({ message: "Email notifications are not enabled or email address is missing" });
      }
      
      // This would send an actual email in a production environment
      // For now, we'll just return a success message
      
      // Update last notified timestamp
      await storage.updateLastNotified(settings.id, new Date());
      
      res.json({ 
        success: true, 
        message: "Test notification sent successfully",
        emailAddress: settings.emailAddress
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send test notification" });
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
      
      const settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Notification settings not found" });
      }
      
      if (!settings.emailEnabled || !settings.emailAddress || !settings.expirationAlerts) {
        return res.status(400).json({ message: "Expiration alerts are not enabled" });
      }
      
      // Get expiring items within the threshold
      const expiringItems = await storage.getExpiringFoodItemsForNotification(daysThreshold);
      
      // Update last notified timestamp
      await storage.updateLastNotified(settings.id, new Date());
      
      res.json({ 
        success: true, 
        message: "Expiration notification processed successfully",
        emailAddress: settings.emailAddress,
        itemCount: expiringItems.length,
        items: expiringItems
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process expiration notification" });
    }
  });
  
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
