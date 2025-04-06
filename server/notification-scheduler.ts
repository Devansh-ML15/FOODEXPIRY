import cron from 'node-cron';
import { differenceInDays, isAfter, sub } from 'date-fns';
import { storage } from './storage';
import { emailService } from './email-service';
import { FoodItemWithStatus } from '@shared/schema';

// Logging helper
const log = (message: string) => {
  console.log(`[notification-scheduler] ${message}`);
};

/**
 * Notification scheduler service
 * Handles scheduled notifications based on user preferences
 */
export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private dailyExpirationJob: cron.ScheduledTask | null = null;
  private weeklyExpirationJob: cron.ScheduledTask | null = null;
  private weeklySummaryJob: cron.ScheduledTask | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Initialize all notification schedules
   */
  public initialize(): void {
    log('Initializing notification scheduler');
    
    // Schedule daily expiration notifications - run at 8:00 AM every day
    this.dailyExpirationJob = cron.schedule('0 8 * * *', () => {
      this.sendExpirationNotifications('daily');
    });
    
    // Schedule weekly expiration notifications - run at 8:00 AM every Monday
    this.weeklyExpirationJob = cron.schedule('0 8 * * 1', () => {
      this.sendExpirationNotifications('weekly');
    });
    
    // Schedule weekly summary emails - run at 9:00 AM every Sunday
    this.weeklySummaryJob = cron.schedule('0 9 * * 0', () => {
      this.sendWeeklySummaries();
    });
    
    log('All notification schedules initialized');
  }

  /**
   * Stop all scheduled jobs
   */
  public stop(): void {
    if (this.dailyExpirationJob) {
      this.dailyExpirationJob.stop();
    }
    
    if (this.weeklyExpirationJob) {
      this.weeklyExpirationJob.stop();
    }
    
    if (this.weeklySummaryJob) {
      this.weeklySummaryJob.stop();
    }
    
    log('All notification schedules stopped');
  }

  /**
   * Send expiration notifications to users based on frequency preference
   */
  private async sendExpirationNotifications(frequency: 'daily' | 'weekly'): Promise<void> {
    try {
      log(`Processing ${frequency} expiration notifications`);
      
      // Get all users with notification settings
      const users = await this.getUsersWithExpirationAlerts(frequency);
      log(`Found ${users.length} users with ${frequency} expiration alerts enabled`);
      
      const daysThreshold = 3; // Items expiring within 3 days
      
      for (const user of users) {
        try {
          // Get expiring items
          const expiringItems = await storage.getExpiringFoodItemsForNotification(daysThreshold);
          
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
            } as FoodItemWithStatus;
          });
          
          // Filter to only expired or expiring soon items
          const relevantItems = expiringItemsWithStatus.filter(
            item => item.status === 'expired' || item.status === 'expiring-soon'
          );
          
          if (relevantItems.length > 0) {
            const result = await emailService.sendExpirationNotification(
              user.emailAddress!, 
              relevantItems
            );
            
            // Update last notified timestamp
            await storage.updateLastNotified(user.id, new Date());
            
            log(`Sent ${frequency} expiration notification to user ${user.userId} (${user.emailAddress}): ${result ? 'success' : 'failed'}`);
          } else {
            log(`No relevant expiring items for user ${user.userId}`);
          }
        } catch (error) {
          log(`Error processing user ${user.userId}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      log(`Error sending ${frequency} expiration notifications: ${(error as Error).message}`);
    }
  }

  /**
   * Send weekly summary notifications to users who have it enabled
   */
  private async sendWeeklySummaries(): Promise<void> {
    try {
      log('Processing weekly summary notifications');
      
      // Get all users with weekly summary enabled
      const users = await this.getUsersWithWeeklySummaryEnabled();
      log(`Found ${users.length} users with weekly summary enabled`);
      
      for (const user of users) {
        try {
          // Get all food items for this user
          const foodItems = await storage.getAllFoodItems();
          
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
            } as FoodItemWithStatus;
          });
          
          // Send weekly summary email
          const result = await emailService.sendWeeklySummary(
            user.emailAddress!, 
            foodItemsWithStatus
          );
          
          // Update last notified timestamp
          await storage.updateLastNotified(user.id, new Date());
          
          log(`Sent weekly summary to user ${user.userId} (${user.emailAddress}): ${result ? 'success' : 'failed'}`);
        } catch (error) {
          log(`Error processing user ${user.userId}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      log(`Error sending weekly summaries: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to get users with expiration alerts enabled for the specified frequency
   */
  private async getUsersWithExpirationAlerts(frequency: 'daily' | 'weekly'): Promise<any[]> {
    // In an actual implementation, this would query the database
    // For now, we'll query all notification settings and filter in memory
    const settings = await this.getAllNotificationSettings();
    
    return settings.filter(setting => 
      setting.emailEnabled && 
      setting.emailAddress && 
      setting.expirationAlerts && 
      setting.expirationFrequency === frequency
    );
  }

  /**
   * Helper method to get users with weekly summary enabled
   */
  private async getUsersWithWeeklySummaryEnabled(): Promise<any[]> {
    // In an actual implementation, this would query the database
    // For now, we'll query all notification settings and filter in memory
    const settings = await this.getAllNotificationSettings();
    
    return settings.filter(setting => 
      setting.emailEnabled && 
      setting.emailAddress && 
      setting.weeklySummary
    );
  }

  /**
   * Helper method to get all notification settings
   * In a real application with many users, this would need to be paginated
   */
  private async getAllNotificationSettings(): Promise<any[]> {
    // For demo purposes, we'll just get settings for user 1
    // In a real app, we would query all users with their settings
    try {
      const settings = await storage.getNotificationSettings(1);
      return settings ? [settings] : [];
    } catch (error) {
      log(`Error getting notification settings: ${(error as Error).message}`);
      return [];
    }
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();