import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Bell, 
  MessageCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-context";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FoodItemWithStatus } from "@shared/schema";
import { HelpButton } from "@/components/HelpButton";
import logoImage from "@/assets/logo.png";

export default function MobileTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { visualTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();

  // Query for food items to get expired and about-to-expire items
  const { data: foodItems = [] } = useQuery<FoodItemWithStatus[]>({
    queryKey: ["/api/food-items"],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Filter for expired and about-to-expire items
  const alertItems = foodItems.filter(
    item => item.status === 'expired' || item.status === 'expiring-soon'
  );
  
  const notificationCount = alertItems.length;

  const handleNotificationClick = () => {
    const expiredItems = alertItems.filter(item => item.status === 'expired').length;
    const expiringItems = alertItems.filter(item => item.status === 'expiring-soon').length;
    
    let description = "No items need attention.";
    
    if (notificationCount > 0) {
      description = `${expiredItems > 0 ? `${expiredItems} expired` : ''} ${expiredItems > 0 && expiringItems > 0 ? 'and ' : ''}${expiringItems > 0 ? `${expiringItems} expiring soon` : ''}`;
    }
    
    toast({
      title: "Food Status Alert",
      description,
      variant: notificationCount > 0 ? "destructive" : "default",
    });
    setIsMenuOpen(false);
  };

  // Get avatar color based on theme
  const getAvatarColor = () => {
    switch(visualTheme) {
      case 'farm-to-table':
        return 'bg-gradient-to-br from-amber-600 to-amber-400';
      case 'cozy-pantry':
        return 'bg-gradient-to-br from-purple-600 to-purple-400';
      case 'seasonal-harvest':
        return 'bg-gradient-to-br from-rose-600 to-rose-400';
      default: // 'default' theme
        return 'bg-gradient-to-br from-green-600 to-green-400';
    }
  };

  // Get avatar shadow based on theme
  const getAvatarShadow = () => {
    switch(visualTheme) {
      case 'farm-to-table':
        return '0 0 8px rgba(217, 119, 6, 0.5)';
      case 'cozy-pantry':
        return '0 0 8px rgba(147, 51, 234, 0.5)';
      case 'seasonal-harvest':
        return '0 0 8px rgba(225, 29, 72, 0.5)';
      default: // 'default' theme
        return '0 0 8px rgba(34, 197, 94, 0.5)';
    }
  };

  // Get ring color based on theme and mode
  const getRingColor = () => {
    return resolvedTheme === 'dark' ? 'ring-gray-800' : 'ring-white';
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: <ChevronRight className="h-4 w-4" /> },
    { href: "/inventory", label: "Inventory", icon: <ChevronRight className="h-4 w-4" /> },
    { href: "/meal-planning", label: "Meal Planning", icon: <ChevronRight className="h-4 w-4" /> },
    { href: "/tips", label: "Tips", icon: <ChevronRight className="h-4 w-4" /> },
    { href: "/community", label: "Community", icon: <ChevronRight className="h-4 w-4" /> },
    { href: "/settings", label: "Settings", icon: <ChevronRight className="h-4 w-4" /> },
  ];

  const handleLinkClick = (path: string) => {
    setLocation(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md z-50 h-14 flex items-center px-4">
        <div className="flex justify-between items-center w-full">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="FoodExpiry Logo" 
                className="h-8 w-8 mr-2" 
              />
              <span className="font-bold text-lg bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                FoodExpiry
              </span>
            </div>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Notification badge */}
            <Button
              onClick={handleNotificationClick}
              variant={notificationCount > 0 ? "destructive" : "ghost"}
              className={`p-2 rounded-full transition-all duration-300 ${
                notificationCount > 0 
                  ? "bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-md" 
                  : "text-gray-500 dark:text-gray-400"
              }`}
              size="sm"
            >
              <div className="relative">
                <Bell className={`h-5 w-5 ${notificationCount > 0 ? "text-white animate-bounce" : ""}`} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </div>
            </Button>

            {/* Theme Selector */}
            <ThemeSelector />

            {/* Hamburger menu */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-primary" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      <div 
        className={`fixed top-14 left-0 right-0 bg-background border-t border-gray-200 dark:border-gray-800 z-40 shadow-lg transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[calc(100vh-9rem)] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-4">
          {/* User info */}
          {user && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
              <Avatar 
                className={`h-12 w-12 ring-2 ${getRingColor()} ${getAvatarColor()}`}
                style={{ boxShadow: getAvatarShadow() }}
              >
                <AvatarFallback className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-green-900'} font-bold`}>
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <div className="space-y-2">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className={`${
                  location === link.href
                    ? "bg-primary/10 border-l-4 border-primary text-primary"
                    : "border-l-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                } p-3 rounded-md flex items-center justify-between cursor-pointer transition-all duration-200`}
                onClick={() => handleLinkClick(link.href)}
              >
                <span className="font-medium">{link.label}</span>
                {link.icon}
              </div>
            ))}
          </div>

          {/* Notification & Help Section */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div 
              className="flex items-center justify-center p-3 text-sm font-medium rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
              onClick={handleNotificationClick}
            >
              <Bell className="mr-2 h-5 w-5" />
              <span>Alerts {notificationCount > 0 && `(${notificationCount})`}</span>
            </div>
            
            <div className="flex items-center justify-center p-3 text-sm font-medium rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
              <Link href="/community">
                <div className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  <span>Community</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Logout button */}
          {user && (
            <div className="mt-6">
              <Button 
                variant="outline" 
                className="w-full justify-center py-6 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
                onClick={() => {
                  logoutMutation.mutate();
                  setIsMenuOpen(false);
                }}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Help button */}
          <div className="mt-4 flex justify-center">
            <HelpButton className="w-full justify-center" />
          </div>
        </div>
      </div>

      {/* Backdrop/overlay to close the menu when clicked */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 mt-14" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}