import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Cog, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FoodItemWithStatus } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from "@/assets/logo.png";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  
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

  const handleSettingsClick = () => {
    // Navigate to settings page
  };

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
    { href: "/insights", label: "Insights" },
    { href: "/meal-planning", label: "Meal Planning" },
    { href: "/tips", label: "Tips" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-50 transition-all duration-300">
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
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link, index) => (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`${
                      location === link.href
                        ? "border-primary text-gray-900 font-semibold"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    } nav-link inline-flex items-center px-3 pt-1 border-b-2 text-sm transition-all duration-300 ease-in-out cursor-pointer`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {link.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <Button
              onClick={handleNotificationClick}
              variant={notificationCount > 0 ? "destructive" : "ghost"}
              className={`p-2 mr-3 rounded-full transition-all duration-300 ${
                notificationCount > 0 
                  ? "bg-gradient-to-r from-red-500 to-orange-400 hover:from-red-600 hover:to-orange-500 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="sr-only">View notifications</span>
              <div className="relative">
                <Bell className={`h-5 w-5 ${notificationCount > 0 ? "text-white animate-bounce" : "icon-animated"}`} />
                {notificationCount > 0 && (
                  <span className="badge-animated absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 border-2 border-white rounded-full pulse-animation">
                    {notificationCount}
                  </span>
                )}
              </div>
            </Button>
            <Link href="/settings">
              <Button
                variant="ghost"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-300"
              >
                <span className="sr-only">Settings</span>
                <Cog className="h-5 w-5 icon-animated" />
              </Button>
            </Link>
            <div className="ml-3 relative">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full p-1 hover:bg-gray-100 transition-all duration-300">
                      <span className="sr-only">Open user menu</span>
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-green-600 to-green-400 shadow-md transform transition-all duration-300 hover:scale-110">
                        <AvatarFallback className="text-white font-bold">
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
                    <Link href="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
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
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6 icon-animated" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu with animation */}
      <div 
        className={`sm:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-2 pb-3 space-y-1">
          {navLinks.map((link, index) => (
            <Link key={link.href} href={link.href}>
              <div
                className={`${
                  location === link.href
                    ? "bg-green-50 border-primary text-primary"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-green-300 hover:text-gray-800"
                } block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-all duration-300 hover:translate-x-1 animated-section cursor-pointer`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ 
                  animationDelay: `${index * 75}ms`,
                  opacity: 0,
                  animation: isMobileMenuOpen ? `fadeIn 0.3s ease-out ${index * 0.075}s forwards` : 'none' 
                }}
              >
                {link.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
