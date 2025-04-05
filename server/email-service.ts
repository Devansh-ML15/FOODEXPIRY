import { MailService, MailDataRequired } from '@sendgrid/mail';
import { FoodItemWithStatus } from '@shared/schema';
import { formatDistance } from 'date-fns';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email notifications will not work.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = 'notifications@foodexpiry.app';

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Check if SendGrid is configured
   */
  public isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  /**
   * Sends an expiration notification email with a list of expiring food items
   */
  public async sendExpirationNotification(email: string, expiringItems: FoodItemWithStatus[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("SendGrid not configured, skipping email notification");
      return false;
    }

    try {
      const expiredItems = expiringItems.filter(item => item.status === 'expired');
      const expiringSoonItems = expiringItems.filter(item => item.status === 'expiring-soon');

      // Create HTML content with nice styling
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(to right, #4ade80, #22c55e); padding: 20px; color: white; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            h1 { margin: 0; }
            h2 { color: #22c55e; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            .expired { color: #dc2626; }
            .expiring-soon { color: #ea580c; }
            .cta-button { display: inline-block; background-color: #22c55e; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FoodExpiry Notification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We wanted to let you know about the following items in your food inventory:</p>
            
            ${expiredItems.length > 0 ? `
              <h2>🚫 Expired Items (${expiredItems.length})</h2>
              <ul>
                ${expiredItems.map(item => `
                  <li class="expired">
                    <strong>${item.name}</strong> - expired ${formatDistance(new Date(item.expirationDate), new Date(), { addSuffix: true })}
                    (${item.quantity} ${item.unit})
                  </li>
                `).join('')}
              </ul>
            ` : ''}
            
            ${expiringSoonItems.length > 0 ? `
              <h2>⚠️ Expiring Soon (${expiringSoonItems.length})</h2>
              <ul>
                ${expiringSoonItems.map(item => `
                  <li class="expiring-soon">
                    <strong>${item.name}</strong> - expires ${formatDistance(new Date(item.expirationDate), new Date(), { addSuffix: true })}
                    (${item.quantity} ${item.unit})
                  </li>
                `).join('')}
              </ul>
            ` : ''}
            
            <p>
              Please take action on these items to reduce food waste.
            </p>
            
            <a href="https://foodexpiry.app" class="cta-button">View Your Inventory</a>
            
            <p>Thank you for using FoodExpiry!</p>
          </div>
          <div class="footer">
            <p>This is an automated message from FoodExpiry. To change your notification preferences, 
               visit the Settings page in your FoodExpiry account.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
FoodExpiry Notification

Hello,

We wanted to let you know about the following items in your food inventory:

${expiredItems.length > 0 ? `
EXPIRED ITEMS (${expiredItems.length}):
${expiredItems.map(item => `- ${item.name} - expired ${formatDistance(new Date(item.expirationDate), new Date(), { addSuffix: true })} (${item.quantity} ${item.unit})`).join('\n')}
` : ''}

${expiringSoonItems.length > 0 ? `
EXPIRING SOON (${expiringSoonItems.length}):
${expiringSoonItems.map(item => `- ${item.name} - expires ${formatDistance(new Date(item.expirationDate), new Date(), { addSuffix: true })} (${item.quantity} ${item.unit})`).join('\n')}
` : ''}

Please take action on these items to reduce food waste.

Visit your inventory at: https://foodexpiry.app

Thank you for using FoodExpiry!

This is an automated message. To change your notification preferences, visit the Settings page in your FoodExpiry account.
      `;

      const params: MailDataRequired = {
        to: email,
        from: FROM_EMAIL,
        subject: `FoodExpiry Alert: ${expiredItems.length} expired and ${expiringSoonItems.length} expiring soon`,
        text,
        html,
      };

      await mailService.send(params);
      console.log(`Expiration notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Sends a weekly summary email with inventory status
   */
  public async sendWeeklySummary(email: string, foodItems: FoodItemWithStatus[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("SendGrid not configured, skipping weekly summary email");
      return false;
    }

    try {
      const expiredItems = foodItems.filter(item => item.status === 'expired');
      const expiringSoonItems = foodItems.filter(item => item.status === 'expiring-soon');
      const freshItems = foodItems.filter(item => item.status === 'fresh');

      // Create HTML content with nice styling and statistics
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(to right, #4ade80, #22c55e); padding: 20px; color: white; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            h1 { margin: 0; }
            h2 { color: #22c55e; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .stats { display: flex; justify-content: space-between; text-align: center; margin: 20px 0; }
            .stat-box { background-color: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; margin: 0 5px; }
            .stat-value { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .fresh { color: #22c55e; }
            .expired { color: #dc2626; }
            .expiring-soon { color: #ea580c; }
            .cta-button { display: inline-block; background-color: #22c55e; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your Weekly FoodExpiry Summary</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Here's your weekly summary of your food inventory status:</p>
            
            <div class="stats">
              <div class="stat-box">
                <div>Fresh Items</div>
                <div class="stat-value fresh">${freshItems.length}</div>
              </div>
              <div class="stat-box">
                <div>Expiring Soon</div>
                <div class="stat-value expiring-soon">${expiringSoonItems.length}</div>
              </div>
              <div class="stat-box">
                <div>Expired</div>
                <div class="stat-value expired">${expiredItems.length}</div>
              </div>
            </div>
            
            <h2>Inventory Highlights</h2>
            <p>You currently have ${foodItems.length} items in your inventory.</p>
            
            ${expiringSoonItems.length > 0 ? `
              <p>⚠️ <strong>Action needed:</strong> You have ${expiringSoonItems.length} items expiring soon.</p>
            ` : ''}
            
            ${expiredItems.length > 0 ? `
              <p>🚫 <strong>Action needed:</strong> You have ${expiredItems.length} expired items to take care of.</p>
            ` : ''}
            
            <a href="https://foodexpiry.app" class="cta-button">View Your Inventory</a>
            
            <p>Thank you for using FoodExpiry!</p>
          </div>
          <div class="footer">
            <p>This weekly summary is sent based on your notification preferences. 
               To change your preferences, visit the Settings page in your FoodExpiry account.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
Your Weekly FoodExpiry Summary

Hello,

Here's your weekly summary of your food inventory status:

- Fresh Items: ${freshItems.length}
- Expiring Soon: ${expiringSoonItems.length}
- Expired: ${expiredItems.length}

You currently have ${foodItems.length} items in your inventory.

${expiringSoonItems.length > 0 ? `ACTION NEEDED: You have ${expiringSoonItems.length} items expiring soon.\n` : ''}
${expiredItems.length > 0 ? `ACTION NEEDED: You have ${expiredItems.length} expired items to take care of.\n` : ''}

Visit your inventory at: https://foodexpiry.app

Thank you for using FoodExpiry!

This weekly summary is sent based on your notification preferences. To change your preferences, visit the Settings page in your FoodExpiry account.
      `;

      const params: MailDataRequired = {
        to: email,
        from: FROM_EMAIL,
        subject: `Your Weekly FoodExpiry Summary - ${new Date().toLocaleDateString()}`,
        text,
        html,
      };

      await mailService.send(params);
      console.log(`Weekly summary sent to ${email}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Sends a test notification email
   */
  public async sendTestNotification(email: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("SendGrid not configured, skipping test email");
      return false;
    }

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(to right, #4ade80, #22c55e); padding: 20px; color: white; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            h1 { margin: 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FoodExpiry Test Notification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>This is a test email from your FoodExpiry application.</p>
            <p>If you're receiving this, your email notifications are correctly configured!</p>
            <p>Thank you for using FoodExpiry!</p>
          </div>
          <div class="footer">
            <p>This is a test message from FoodExpiry. No action is required.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
FoodExpiry Test Notification

Hello,

This is a test email from your FoodExpiry application.
If you're receiving this, your email notifications are correctly configured!

Thank you for using FoodExpiry!

This is a test message from FoodExpiry. No action is required.
      `;

      const params: MailDataRequired = {
        to: email,
        from: FROM_EMAIL,
        subject: 'FoodExpiry Test Notification',
        text,
        html,
      };

      await mailService.send(params);
      console.log(`Test notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();