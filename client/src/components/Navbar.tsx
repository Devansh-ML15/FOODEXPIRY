import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Cog, Menu, LogOut, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FoodItemWithStatus } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSelector } from "@/components/ThemeSelector";
import { HelpButton } from "@/components/HelpButton";
import { AppTutorial } from "@/components/AppTutorial";
import { useTutorial } from "@/lib/tutorial-context";
import logoImage from "@/assets/logo.png";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const { visualTheme, resolvedTheme } = useTheme();
  
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
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
    { href: "/", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
    { href: "/meal-planning", label: "Meal Planning" },
    { href: "/tips", label: "Tips" },
    { href: "/community", label: "Community" },
    { href: "/settings", label: "Settings" },
  ];

  // Get tutorial dialog state
  const { showTutorial, setShowTutorial } = useTutorial();

  return (
    <>
      {/* Tutorial Dialog */}
      <AppTutorial 
        open={showTutorial} 
        onOpenChange={setShowTutorial} 
        firstTime={false} 
      />
    
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <div className="flex items-center group cursor-pointer">
                    <img 
                      src={logoImage} 
                      alt="FoodExpiry Logo" 
                      className="h-10 w-10 mr-2 float-animation" 
                    />
                    <span className="font-bold text-xl bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                      FoodExpiry
                    </span>
                  </div>
                </Link>
              </div>
              {/* Desktop Navigation - hidden on mobile */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navLinks.map((link, index) => (
                  <Link key={link.href} href={link.href}>
                    <div
                      className={`${
                        location === link.href
                          ? "border-primary text-gray-900 dark:text-gray-50 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                      } nav-link inline-flex items-center px-3 pt-1 border-b-2 text-sm transition-all duration-300 ease-in-out cursor-pointer`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Right side nav icons - hide notifications and settings on mobile */}
            <div className="flex items-center">
              {/* These elements remain visible on both mobile and desktop */}
              <ThemeSelector className="mr-2" />
              <HelpButton className="mr-2" />
              
              {/* Hide these on smaller mobile screens */}
              <div className="hidden sm:flex sm:items-center">
                <Button
                  onClick={handleNotificationClick}
                  variant={notificationCount > 0 ? "destructive" : "ghost"}
                  className={`p-2 mr-2 rounded-full transition-all duration-300 ${
                    notificationCount > 0 
                      ? "bg-gradient-to-r from-red-500 to-orange-400 hover:from-red-600 hover:to-orange-500 text-white shadow-md" 
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="sr-only">View notifications</span>
                  <div className="relative">
                    <Bell className={`h-5 w-5 ${notificationCount > 0 ? "text-white animate-bounce" : "icon-animated"}`} />
                    {notificationCount > 0 && (
                      <span className="badge-animated absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full pulse-animation">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                </Button>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    <span className="sr-only">Settings</span>
                    <Cog className="h-5 w-5 icon-animated" />
                  </Button>
                </Link>
              </div>
              
              {/* User avatar/login button - keep this visible on all screens */}
              <div className="ml-3 relative">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                        <span className="sr-only">Open user menu</span>
                        <Avatar 
                          className={`h-8 w-8 transform transition-all duration-300 hover:scale-110 ring-2 ${getRingColor()} ${getAvatarColor()}`}
                          style={{
                            boxShadow: getAvatarShadow()
                          }}
                        >
                          <AvatarFallback className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-green-900'} font-bold`}>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.username}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        className="cursor-pointer"
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
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/auth">
                    <Button variant="default" size="sm" className="font-semibold">
                      Log in
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Mobile menu button - only visible on small screens */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all duration-300"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className={`h-6 w-6 ${isMobileMenuOpen ? 'text-primary' : ''} transform transition-all duration-300`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown - enhanced animation and styling */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[500px] opacity-100 border-t border-gray-200 dark:border-gray-800' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-2 pb-3 space-y-1 px-2">
            {/* Navigation links */}
            {navLinks.map((link, index) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`${
                    location === link.href
                      ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-primary text-primary"
                      : "border-l-4 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:border-green-300 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  } block pl-3 pr-4 py-3 text-base font-medium transition-all duration-300 rounded-md hover:translate-x-1 cursor-pointer`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    opacity: 0,
                    animation: isMobileMenuOpen ? `fadeIn 0.3s ease-out ${index * 0.05}s forwards` : 'none' 
                  }}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            
            {/* Mobile-only notification and settings links */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-2">
              <div 
                className="flex items-center justify-center p-3 text-sm font-medium rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                onClick={() => {
                  handleNotificationClick();
                  setIsMobileMenuOpen(false);
                }}
                style={{ 
                  animationDelay: `${navLinks.length * 50}ms`,
                  opacity: 0,
                  animation: isMobileMenuOpen ? `fadeIn 0.3s ease-out ${navLinks.length * 0.05}s forwards` : 'none' 
                }}
              >
                <Bell className="mr-2 h-5 w-5" />
                <span>Notifications {notificationCount > 0 && `(${notificationCount})`}</span>
              </div>
              
              <Link href="/settings">
                <div 
                  className="flex items-center justify-center p-3 text-sm font-medium rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ 
                    animationDelay: `${(navLinks.length + 1) * 50}ms`,
                    opacity: 0,
                    animation: isMobileMenuOpen ? `fadeIn 0.3s ease-out ${(navLinks.length + 1) * 0.05}s forwards` : 'none' 
                  }}
                >
                  <Cog className="mr-2 h-5 w-5" />
                  <span>Settings</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
