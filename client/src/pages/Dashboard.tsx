import DashboardStats from "@/components/DashboardStats";
import ExpirationAlerts from "@/components/ExpirationAlerts";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import { ThemeOverlay } from "@/components/ui/theme-overlay";

export default function Dashboard() {
  return (
    <div className="mb-8">
      <ThemeOverlay variant="header">
        <SectionBackground pattern="dashboard" className="p-6 mb-6">
          <GlassLogoBackground>
            <h1 className="page-header">Dashboard</h1>
            
            <DashboardStats />
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
      
      <ThemeOverlay variant="card">
        <SectionBackground pattern="dashboard" className="p-6">
          <GlassLogoBackground logoOpacity={0.05}>
            <ExpirationAlerts />
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
    </div>
  );
}
