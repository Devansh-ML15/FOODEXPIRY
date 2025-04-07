import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Types for auth context
type LoginData = {
  username: string;
  password: string;
};

type RegisterData = z.infer<typeof insertUserSchema>;

type VerifyOTPData = {
  email: string;
  otp: string;
};

type RequestPasswordResetData = {
  email: string;
};

type VerifyPasswordResetData = {
  email: string;
  otp: string;
  newPassword: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ message: string, email: string }, Error, RegisterData>;
  verifyOTPMutation: UseMutationResult<User, Error, VerifyOTPData>;
  requestPasswordResetMutation: UseMutationResult<{ message: string, email: string }, Error, RequestPasswordResetData>;
  verifyPasswordResetMutation: UseMutationResult<{ message: string }, Error, VerifyPasswordResetData>;
};

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Query to fetch current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to log in
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Mutation to register with OTP verification
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register/start", userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification code sent",
        description: "Please check your email for a verification code to complete registration.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Mutation to verify OTP
  const verifyOTPMutation = useMutation({
    mutationFn: async (verifyData: VerifyOTPData) => {
      const res = await apiRequest("POST", "/api/register/verify", verifyData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Verification failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Verification successful",
        description: "Your account has been created and you are now logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    },
  });

  // Mutation to log out
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to request password reset
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (data: RequestPasswordResetData) => {
      const res = await apiRequest("POST", "/api/reset-password/request", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to request password reset");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset code sent",
        description: "Please check your email for a verification code to reset your password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message || "Could not request password reset",
        variant: "destructive",
      });
    },
  });

  // Mutation to verify password reset OTP and update password
  const verifyPasswordResetMutation = useMutation({
    mutationFn: async (data: VerifyPasswordResetData) => {
      const res = await apiRequest("POST", "/api/reset-password/verify", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message || "Could not reset password",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyOTPMutation,
        requestPasswordResetMutation,
        verifyPasswordResetMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}