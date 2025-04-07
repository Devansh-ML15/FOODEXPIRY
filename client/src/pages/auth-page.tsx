import { useState, useEffect } from "react";
import { Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import foodSvgPath from "@assets/your-logo.png";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema (extends the insertUserSchema)
const registerSchema = insertUserSchema
  .extend({
    passwordConfirm: z.string().min(6, "Password confirmation must be at least 6 characters"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

// OTP verification schema
const otpVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

// Password reset request schema
const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// Password reset verification schema
const passwordResetVerifySchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type OtpVerificationFormValues = z.infer<typeof otpVerificationSchema>;
type PasswordResetRequestValues = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetVerifyValues = z.infer<typeof passwordResetVerifySchema>;

export default function AuthPage() {
  const { 
    user, 
    isLoading, 
    loginMutation, 
    registerMutation, 
    verifyOTPMutation,
    requestPasswordResetMutation,
    verifyPasswordResetMutation
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>("login");
  const [verificationState, setVerificationState] = useState<{
    isVerifying: boolean;
    email: string;
    type: 'registration' | 'password-reset';
  } | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);

  // Handle successful registration by showing verification form
  useEffect(() => {
    if (registerMutation.isSuccess && registerMutation.data?.email) {
      setVerificationState({
        isVerifying: true,
        email: registerMutation.data.email,
        type: 'registration'
      });
    }
  }, [registerMutation.isSuccess, registerMutation.data]);

  // Handle successful password reset request by showing verification form
  useEffect(() => {
    if (requestPasswordResetMutation.isSuccess && requestPasswordResetMutation.data?.email) {
      setVerificationState({
        isVerifying: true,
        email: requestPasswordResetMutation.data.email,
        type: 'password-reset'
      });
      setShowForgotPassword(false);
    }
  }, [requestPasswordResetMutation.isSuccess, requestPasswordResetMutation.data]);

  // Handle successful verification by switching to login tab
  useEffect(() => {
    if (verifyOTPMutation.isSuccess) {
      setVerificationState(null);
    }
  }, [verifyOTPMutation.isSuccess]);

  // Handle successful password reset verification
  useEffect(() => {
    if (verifyPasswordResetMutation.isSuccess) {
      setVerificationState(null);
      setActiveTab("login");
    }
  }, [verifyPasswordResetMutation.isSuccess]);
  
  // Redirect if user is already logged in - move this after all hooks are called
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-card">
      {/* Left side - Auth Form */}
      <div className="flex items-center justify-center p-4 md:p-8">
        {verificationState?.isVerifying ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">
                {verificationState.type === 'registration' ? 'Verify Your Email' : 'Reset Your Password'}
              </CardTitle>
              <CardDescription>
                We've sent a verification code to {verificationState.email}. 
                Please enter it below to {verificationState.type === 'registration' ? 'complete your registration' : 'reset your password'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationState.type === 'registration' ? (
                <VerifyOTPForm 
                  email={verificationState.email} 
                  onCancel={() => setVerificationState(null)}
                />
              ) : (
                <PasswordResetVerifyForm
                  email={verificationState.email}
                  onCancel={() => setVerificationState(null)}
                />
              )}
            </CardContent>
          </Card>
        ) : showForgotPassword ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a code to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordResetRequestForm
                onCancel={() => setShowForgotPassword(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-md mx-auto"
          >
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>Login to manage your food inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab("register")}
                    className="text-sm"
                  >
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>Sign up to start tracking your food inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <RegisterForm />
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab("login")}
                    className="text-sm"
                  >
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Right side - Hero Image and Marketing */}
      <div className="hidden md:flex md:flex-col md:bg-primary/5 p-8 items-center justify-center relative">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{
          backgroundImage: `url(${foodSvgPath})`,
          backgroundSize: '20%',
          backgroundRepeat: 'repeat'
        }}></div>
        
        <div className="text-center z-10 max-w-md space-y-6">
          <img 
            src={foodSvgPath} 
            alt="FoodExpiry Logo" 
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
            FoodExpiry
          </h1>
          <p className="text-xl">
            Your smart food inventory manager
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <FeatureCard
              title="Track Expiration"
              description="Never waste food again by tracking expiration dates"
            />
            <FeatureCard
              title="Reduce Waste"
              description="Track your progress in reducing food waste"
            />
            <FeatureCard
              title="Easy Inventory"
              description="Quickly add items with a clean, simple interface"
            />
            <FeatureCard
              title="Data Insights"
              description="Get insights about your food consumption patterns"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { loginMutation } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
              <div className="text-right">
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 text-xs text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPassword();
                  }}
                >
                  Forgot password?
                </Button>
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      email: "",
      name: "",
    },
  });
  
  const onSubmit = (values: RegisterFormValues) => {
    // Remove passwordConfirm before submitting
    const { passwordConfirm, ...registerData } = values;
    registerMutation.mutate(registerData);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </Form>
  );
}

function VerifyOTPForm({ email, onCancel }: { email: string; onCancel: () => void }) {
  const { verifyOTPMutation } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60); // 10 minutes in seconds
  
  const form = useForm<OtpVerificationFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      email: email,
      otp: "",
    },
  });
  
  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [timeLeft]);
  
  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const onSubmit = (values: OtpVerificationFormValues) => {
    verifyOTPMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input readOnly {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter 6-digit code" 
                  {...field} 
                  value={field.value || ''} 
                  maxLength={6} 
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* OTP Expiration Timer */}
        <div className={`text-center text-sm ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {timeLeft > 0 ? (
            <>Code expires in <span className="font-semibold">{formatTimeLeft()}</span></>
          ) : (
            <span className="text-destructive font-semibold">Code expired. Please request a new one.</span>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={verifyOTPMutation.isPending || timeLeft <= 0}
          >
            {verifyOTPMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={verifyOTPMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PasswordResetRequestForm({ onCancel }: { onCancel: () => void }) {
  const { requestPasswordResetMutation } = useAuth();
  
  const form = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmit = (values: PasswordResetRequestValues) => {
    requestPasswordResetMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  {...field} 
                  value={field.value || ''} 
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={requestPasswordResetMutation.isPending}
          >
            {requestPasswordResetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending code...
              </>
            ) : (
              "Send Reset Code"
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={requestPasswordResetMutation.isPending}
          >
            Back to Login
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PasswordResetVerifyForm({ email, onCancel }: { email: string; onCancel: () => void }) {
  const { verifyPasswordResetMutation } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60); // 10 minutes in seconds
  
  const form = useForm<PasswordResetVerifyValues>({
    resolver: zodResolver(passwordResetVerifySchema),
    defaultValues: {
      email: email,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [timeLeft]);
  
  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const onSubmit = (values: PasswordResetVerifyValues) => {
    // Remove confirmPassword before submitting
    const { confirmPassword, ...resetData } = values;
    verifyPasswordResetMutation.mutate(resetData);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input readOnly {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter 6-digit code" 
                  {...field} 
                  value={field.value || ''} 
                  maxLength={6}
                  inputMode="numeric" 
                  autoComplete="one-time-code"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Enter new password" 
                  {...field} 
                  value={field.value || ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Confirm new password" 
                  {...field} 
                  value={field.value || ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* OTP Expiration Timer */}
        <div className={`text-center text-sm ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {timeLeft > 0 ? (
            <>Code expires in <span className="font-semibold">{formatTimeLeft()}</span></>
          ) : (
            <span className="text-destructive font-semibold">Code expired. Please request a new one.</span>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={verifyPasswordResetMutation.isPending || timeLeft <= 0}
          >
            {verifyPasswordResetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={verifyPasswordResetMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card rounded-lg p-4 hover:shadow-md transition duration-200 border border-border">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}