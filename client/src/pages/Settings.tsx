import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Bell, Mail, ShieldAlert, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SectionBackground } from "@/components/ui/section-background";

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

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  // For demo purposes, we'll use the default user with ID 1
  const userId = 1;

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

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information and email address.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateProfileMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

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
                          {sendTestNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
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
      </Tabs>
      </SectionBackground>
    </div>
  );
}