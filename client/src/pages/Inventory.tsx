import InventoryGrid from "@/components/InventoryGrid";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import { ThemeOverlay } from "@/components/ui/theme-overlay";
import { Plus } from "lucide-react";

export default function Inventory() {
  return (
    <div className="mb-8">
      <ThemeOverlay variant="full">
        <SectionBackground pattern="inventory" className="p-6">
          <GlassLogoBackground logoOpacity={0.07}>
            <div className="flex justify-between items-center mb-6">
              <h1 className="page-header">Inventory</h1>
            </div>
            <InventoryGrid />
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
    </div>
  );
}
