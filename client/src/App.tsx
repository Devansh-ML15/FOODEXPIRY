import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import MobileLayout from "@/components/MobileLayout";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Tips from "@/pages/Tips";
import Settings from "@/pages/Settings";
import AddFoodItemPage from "@/pages/AddFoodItemPage";
import MealPlanning from "@/pages/MealPlanning";
import CommunityChat from "@/pages/CommunityChat";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/LandingPage";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/lib/theme-context";
import { TutorialProvider, useTutorial } from "@/lib/tutorial-context";
import { AppTutorial } from "@/components/AppTutorial";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to landing page if not authenticated and not on auth or landing page
  useEffect(() => {
    if (!user && location !== "/auth" && location !== "/") {
      setLocation('/');
    }
  }, [user, location, setLocation]);

  return (
    <Switch>
      <Route path="/">
        {() => !user ? <LandingPage /> : <Dashboard />}
      </Route>
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <Route path="/insights">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <ProtectedRoute path="/meal-planning" component={MealPlanning} />
      <ProtectedRoute path="/tips" component={Tips} />
      <ProtectedRoute path="/community" component={CommunityChat} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/add-food-item" component={AddFoodItemPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { showTutorial, setShowTutorial, isTutorialSeen } = useTutorial();
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isLandingPage = location === "/" && !user;
  
  if (isLandingPage) {
    return (
      <div className="min-h-screen">
        <Router />
      </div>
    );
  }
  
  return (
    <MobileLayout>
      {/* First-time tutorial */}
      <AppTutorial 
        open={showTutorial && !isTutorialSeen} 
        onOpenChange={setShowTutorial} 
        firstTime={true} 
      />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Router />
      </div>
    </MobileLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TutorialProvider>
            <AppContent />
            <Toaster />
          </TutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
