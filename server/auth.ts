import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type User as SelectUser, insertUserSchema } from "@shared/schema";
import MemoryStore from "memorystore";
import { otpService } from "./otp-service";

// Extend Express.User interface to include our user type
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "freshtrack-secret-key", // Use environment variable in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'username', passwordField: 'password' },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Incorrect login or Password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Start registration process by sending OTP
  app.post("/api/register/start", async (req, res, next) => {
    try {
      // Validate user data
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: validationResult.error.format()
        });
      }
      
      const userData = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Store user data in a JSON string for later retrieval
      const userDataString = JSON.stringify(userData);
      
      // Generate and send OTP
      const otp = await otpService.createOTP(userData.email, userDataString);
      const emailSent = await otpService.sendOTPEmail(userData.email, otp);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }
      
      res.status(200).json({
        message: "Verification code sent to your email",
        email: userData.email
      });
    } catch (error) {
      console.error("Registration start error:", error);
      next(error);
    }
  });
  
  // Verify OTP and complete registration
  app.post("/api/register/verify", async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and verification code required" });
      }
      
      // Verify the OTP
      const verification = await otpService.verifyOTP(email, otp);
      
      if (!verification.valid || !verification.userData) {
        return res.status(400).json({ 
          message: "Invalid or expired verification code. Please try again." 
        });
      }
      
      // Parse the user data from the verification
      const userData = JSON.parse(verification.userData);
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create the user with verified flag
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        isVerified: true
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        
        res.status(201).json({
          ...userWithoutPassword,
          message: "Registration successful! Your account has been verified."
        });
      });
    } catch (error) {
      console.error("Registration verification error:", error);
      // Check if the error is a duplicate email constraint error
      if (error instanceof Error && error.message.includes('users_email_unique')) {
        return res.status(400).json({ message: "Email already in use" });
      }
      next(error);
    }
  });
  
  // Legacy registration endpoint (without verification)
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use. Log back in" });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Don't log the user in after registration, just return success
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        ...userWithoutPassword,
        message: "Registration successful. Please log in with your credentials."
      });
    } catch (error) {
      console.error("Registration error:", error);
      // Check if the error is a duplicate email constraint error
      if (error instanceof Error && error.message.includes('users_email_unique')) {
        return res.status(400).json({ message: "Email already in use. Log back in" });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json(userWithoutPassword);
    }
    res.status(401).json({ message: "Not authenticated" });
  });
}