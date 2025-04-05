import DashboardStats from "@/components/DashboardStats";
import ExpirationAlerts from "@/components/ExpirationAlerts";
import WasteInsights from "@/components/WasteInsights";
import RecipeSuggestions from "@/components/RecipeSuggestions";
import { SectionBackground } from "@/components/ui/section-background";

export default function Dashboard() {
  return (
    <div className="mb-8">
      <SectionBackground pattern="dashboard" className="p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
        
        <DashboardStats />
      </SectionBackground>
      
      <SectionBackground pattern="dashboard" className="p-6 mb-6">
        <ExpirationAlerts />
      </SectionBackground>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionBackground pattern="insights" className="p-6">
          <WasteInsights />
        </SectionBackground>
        
        <SectionBackground pattern="recipes" className="p-6">
          <RecipeSuggestions />
        </SectionBackground>
      </div>
    </div>
  );
}
