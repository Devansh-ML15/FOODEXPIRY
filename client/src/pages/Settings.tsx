import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Bell, Mail, ShieldAlert, Save, Trash2, AlertTriangle, Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SectionBackground } from "@/components/ui/section-background";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type NotificationSettings = {
  id: number;
  userId: number;
  expirationAlerts: boolean;
  expirationFrequency: 'daily' | 'weekly' | 'never';
  weeklySummary: boolean; // Renamed from weeklyReport to match schema
  emailEnabled: boolean;
  emailAddress: string | null;
  lastNotified: string | null;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex flex-col space-y-4">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center p-3 rounded-lg ${
          theme === 'light' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Sun className="h-5 w-5 mr-2" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Light</span>
          <span className="text-xs text-muted-foreground">Use light theme</span>
        </div>
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center p-3 rounded-lg ${
          theme === 'dark' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Moon className="h-5 w-5 mr-2" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Dark</span>
          <span className="text-xs text-muted-foreground">Use dark theme</span>
        </div>
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`flex items-center p-3 rounded-lg ${
          theme === 'system' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Laptop className="h-5 w-5 mr-2" />
        <div className="flex flex-col items-start">
          <span className="font-medium">System</span>
          <span className="text-xs text-muted-foreground">Follow system preference</span>
        </div>
      </button>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('notifications');

  // Get the currently logged in user
  const { user: currentUser } = useAuth();
  const userId = currentUser?.id;

  // Fetch user profile
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<User>({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
  });

  // Fetch notification settings
  const {
    data: notificationSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useQuery<NotificationSettings>({
    queryKey: ['/api/notification-settings', userId],
    queryFn: async () => {
      const response = await fetch(`/api/notification-settings/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }
      return response.json();
    },
  });

  // Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  const [notificationForm, setNotificationForm] = useState({
    expirationAlerts: false,
    expirationFrequency: 'weekly' as 'daily' | 'weekly' | 'never',
    weeklySummary: false, // Renamed from weeklyReport to match schema
    emailEnabled: false,
    emailAddress: '',
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationForm({
        expirationAlerts: notificationSettings.expirationAlerts,
        expirationFrequency: notificationSettings.expirationFrequency,
        weeklySummary: notificationSettings.weeklySummary,
        emailEnabled: notificationSettings.emailEnabled,
        emailAddress: notificationSettings.emailAddress || '',
      });
    }
  }, [notificationSettings]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: {
      expirationAlerts: boolean;
      expirationFrequency: string;
      weeklySummary: boolean; // Renamed from weeklyReport to match schema
      emailEnabled: boolean;
      emailAddress: string;
    }) => {
      if (!notificationSettings) return null;

      const response = await fetch(`/api/notification-settings/${notificationSettings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings', userId] });
      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send test notification mutation
  const sendTestNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send test notification');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        if (data.devMode) {
          // This branch handles our development fallback
          toast({
            title: 'Test notification processed (Dev Mode)',
            description: `Email would have been sent to ${data.emailAddress} - check server logs for details`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Test notification sent',
            description: `A test notification was sent to ${data.emailAddress}`,
          });
        }
      } else {
        toast({
          title: 'Test notification processed',
          description: data.message || 'Email notification was processed but may not have been sent due to configuration.',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error sending notification',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationsMutation.mutate(notificationForm);
  };

  const handleTestNotification = () => {
    sendTestNotificationMutation.mutate();
  };
  
  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      
      // Log out the user
      window.location.href = '/auth';
    },
    onError: (error) => {
      toast({
        title: 'Error deleting account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isUserLoading || isSettingsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userError || settingsError) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg my-6">
        <h3 className="text-lg font-semibold text-red-800">Error loading settings</h3>
        <p className="text-red-600 mt-2">
          {userError ? (userError as Error).message : (settingsError as Error).message}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <SectionBackground pattern="settings" className="p-6">
        <h1 className="page-header">Settings</h1>
        <p className="text-gray-500 mb-4">
          Manage your account settings and notification preferences.
        </p>

        <Tabs defaultValue="notifications" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure when and how you want to receive notifications about your food inventory.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleNotificationsSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Enable email notifications for alerts</p>
                    </div>
                    <Switch
                      checked={notificationForm.emailEnabled}
                      onCheckedChange={(checked) =>
                        setNotificationForm({ ...notificationForm, emailEnabled: checked })
                      }
                    />
                  </div>

                  {notificationForm.emailEnabled && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="emailAddress">Email Address</Label>
                      <Input
                        id="emailAddress"
                        type="email"
                        placeholder="Your email address for notifications"
                        value={notificationForm.emailAddress}
                        onChange={(e) =>
                          setNotificationForm({ ...notificationForm, emailAddress: e.target.value })
                        }
                      />
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={handleTestNotification}
                          disabled={sendTestNotificationMutation.isPending}
                        >
                          {sendTestNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                        </Button>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          <p>Note: In development mode, emails are logged to the console instead of being sent.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
                        <Label className="text-base">Expiration Alerts</Label>
                      </div>
                      <p className="text-sm text-gray-500">Get notified about soon-to-expire items</p>
                    </div>
                    <Switch
                      checked={notificationForm.expirationAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationForm({ ...notificationForm, expirationAlerts: checked })
                      }
                    />
                  </div>

                  {notificationForm.expirationAlerts && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="expirationFrequency">Alert Frequency</Label>
                      <Select
                        value={notificationForm.expirationFrequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'never') =>
                          setNotificationForm({ ...notificationForm, expirationFrequency: value })
                        }
                      >
                        <SelectTrigger id="expirationFrequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-primary" />
                      <Label className="text-base">Weekly Summary</Label>
                    </div>
                    <p className="text-sm text-gray-500">
                      Receive a weekly summary of your inventory and waste statistics
                    </p>
                  </div>
                  <Switch
                    checked={notificationForm.weeklySummary}
                    onCheckedChange={(checked) =>
                      setNotificationForm({ ...notificationForm, weeklySummary: checked })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={updateNotificationsMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateNotificationsMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Theme Mode</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose your preferred color theme</p>
                  
                  <ThemeSelector />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
        {/* Delete Account Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Danger Zone
          </h2>
          <p className="text-gray-500 mb-4">
            Permanently delete your account and all associated data.
          </p>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers, including all food items, 
                  notification settings, and personal information.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteAccountMutation.mutate()}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Deleting...
                    </span>
                  ) : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SectionBackground>
    </div>
  );
}