import DashboardStats from "@/components/DashboardStats";
import ExpirationAlerts from "@/components/ExpirationAlerts";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";

export default function Dashboard() {
  return (
    <div className="mb-8">
      <SectionBackground pattern="dashboard" className="p-6 mb-6">
        <GlassLogoBackground>
          <h1 className="page-header">Dashboard</h1>
          
          <DashboardStats />
        </GlassLogoBackground>
      </SectionBackground>
      
      <SectionBackground pattern="dashboard" className="p-6">
        <GlassLogoBackground opacity={0.05}>
          <ExpirationAlerts />
        </GlassLogoBackground>
      </SectionBackground>
    </div>
  );
}
