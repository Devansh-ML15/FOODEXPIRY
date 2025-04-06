import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Recipes from "@/pages/Recipes";
import Insights from "@/pages/Insights";
import Tips from "@/pages/Tips";
import Settings from "@/pages/Settings";
import BarcodeScannerPage from "@/pages/BarcodeScannerPage";
import AddFoodItemPage from "@/pages/AddFoodItemPage";
import AuthPage from "@/pages/auth-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/recipes" component={Recipes} />
      <ProtectedRoute path="/insights" component={Insights} />
      <ProtectedRoute path="/tips" component={Tips} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/barcode-scanner" component={BarcodeScannerPage} />
      <ProtectedRoute path="/add-food-item" component={AddFoodItemPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  // Include proper conditional rendering for Navbar based on authentication state
  return (
    <div className="flex flex-col h-screen">
      {user && <Navbar />}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Router />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
