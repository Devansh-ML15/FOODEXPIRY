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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/insights" component={Insights} />
      <Route path="/tips" component={Tips} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Router />
          </div>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
