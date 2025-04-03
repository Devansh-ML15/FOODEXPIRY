import { FoodItemWithStatus } from "@shared/schema";

/**
 * Service for handling email notifications related to food items
 */
export class EmailService {
  private static instance: EmailService;
  
  // Get singleton instance
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  /**
   * Sends an expiration notification email (mock function for client-side)
   * @param email - User's email
   * @param expiringItems - Array of soon-to-expire items
   */
  public async sendExpirationNotification(email: string, expiringItems: FoodItemWithStatus[]): Promise<boolean> {
    try {
      // In a real application, this would call an API endpoint
      // Here we simulate the API call that would happen on the server
      const response = await fetch('/api/notifications/expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          expiringItems: expiringItems.map(item => ({
            id: item.id,
            name: item.name,
            expirationDate: item.expirationDate,
            daysUntilExpiration: item.daysUntilExpiration
          }))
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending expiration notification:', error);
      return false;
    }
  }
  
  /**
   * Sends a weekly summary email with inventory status
   * @param email - User's email
   */
  public async sendWeeklySummary(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/weekly-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send weekly summary');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending weekly summary:', error);
      return false;
    }
  }
  
  /**
   * Updates user notification preferences
   * @param email - User's email
   * @param preferences - Notification preferences object
   */
  public async updateNotificationPreferences(
    email: string, 
    preferences: {
      expirationAlerts: boolean;
      daysBeforeExpiration: number;
      weeklySummary: boolean;
      recipeSuggestions: boolean;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          preferences
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
  
  /**
   * Sends a test notification email
   * @param email - User's email to test
   */
  public async sendTestNotification(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }
  
  /**
   * Checks if email notifications are properly configured
   */
  public async checkNotificationStatus(): Promise<{
    enabled: boolean;
    message: string;
  }> {
    try {
      const response = await fetch('/api/notifications/status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to check notification status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking notification status:', error);
      return {
        enabled: false,
        message: 'Could not verify notification status'
      };
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
