import DashboardStats from "@/components/DashboardStats";
import ExpirationAlerts from "@/components/ExpirationAlerts";
import WasteInsights from "@/components/WasteInsights";
import RecipeSuggestions from "@/components/RecipeSuggestions";

export default function Dashboard() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      <DashboardStats />
      
      <ExpirationAlerts />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WasteInsights />
        <RecipeSuggestions />
      </div>
    </div>
  );
}
