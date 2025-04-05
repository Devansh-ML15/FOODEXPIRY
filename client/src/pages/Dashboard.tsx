import DashboardStats from "@/components/DashboardStats";
import ExpirationAlerts from "@/components/ExpirationAlerts";
import RecipeSuggestions from "@/components/RecipeSuggestions";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";

export default function Dashboard() {
  return (
    <div className="mb-8">
      <SectionBackground pattern="dashboard" className="p-6 mb-6">
        <GlassLogoBackground>
          <h1 className="text-2xl font-semibold text-gray-900 mb-6 pt-2">Dashboard</h1>
          
          <DashboardStats />
        </GlassLogoBackground>
      </SectionBackground>
      
      <SectionBackground pattern="dashboard" className="p-6 mb-6">
        <GlassLogoBackground opacity={0.05}>
          <ExpirationAlerts />
        </GlassLogoBackground>
      </SectionBackground>
      
      <SectionBackground pattern="recipes" className="p-6">
        <GlassLogoBackground opacity={0.06}>
          <RecipeSuggestions />
        </GlassLogoBackground>
      </SectionBackground>
    </div>
  );
}
