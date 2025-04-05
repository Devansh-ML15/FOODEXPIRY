import { Request, Response, NextFunction } from "express";

// Authentication middleware to protect routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Optional auth middleware for routes that can work with or without authentication
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Allow the request to continue regardless of authentication status
  next();
}