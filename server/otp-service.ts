import { randomInt } from "crypto";
import { InsertOtpVerification } from "@shared/schema";
import { emailService } from "./email-service";
import { storage } from "./storage";

/**
 * OTP Verification Service
 * Manages the verification flow for user registration
 */
export class OtpService {
  private static instance: OtpService;

  private constructor() {}

  public static getInstance(): OtpService {
    if (!OtpService.instance) {
      OtpService.instance = new OtpService();
    }
    return OtpService.instance;
  }

  /**
   * Generate a new 6-digit OTP
   */
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * Create a new OTP verification record
   * @param email The email to which the OTP will be sent
   * @param userData JSON stringified user data to be saved if OTP is verified
   * @returns The OTP that was generated
   */
  public async createOTP(email: string, userData: string): Promise<string> {
    // Delete any existing OTP for this email
    await storage.deleteOtpByEmail(email);

    // Generate a new OTP
    const otp = this.generateOTP();

    // Set expiration time to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create the OTP verification record
    const otpData: InsertOtpVerification = {
      email,
      otp,
      expiresAt,
      verified: false,
      userData,
    };

    await storage.createOtp(otpData);

    return otp;
  }

  /**
   * Verify an OTP for a given email
   * @param email The email for which the OTP was generated
   * @param otp The OTP to verify
   * @returns True if the OTP is valid and not expired, false otherwise
   */
  public async verifyOTP(email: string, otp: string): Promise<{ valid: boolean; userData?: string }> {
    const now = new Date();
    
    // Find the OTP verification record
    const record = await storage.getOtpByEmail(email);

    // If no record exists or OTP doesn't match or it's expired, return false
    if (!record || record.otp !== otp || record.expiresAt < now) {
      return { valid: false };
    }

    // Mark the OTP as verified
    await storage.updateOtp(record.id, { verified: true });

    return { valid: true, userData: record.userData };
  }

  /**
   * Send an OTP verification email
   * @param email The email to which the OTP will be sent
   * @param otp The OTP to include in the email
   */
  public async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const appName = "FoodExpiry";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0d6a30; text-align: center;">Verify Your Email for ${appName}</h2>
        <p>Thank you for registering with ${appName}! To complete your registration, please use the following verification code:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated email from ${appName}. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    return await emailService.sendEmail(
      email, 
      `${otp} is your ${appName} verification code`, 
      `Your verification code for ${appName} is: ${otp}. This code will expire in 10 minutes.`,
      htmlContent
    );
  }
}

export const otpService = OtpService.getInstance();