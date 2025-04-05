import InventoryGrid from "@/components/InventoryGrid";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";

export default function Inventory() {
  return (
    <div className="mb-8">
      <SectionBackground pattern="inventory" className="p-6">
        <GlassLogoBackground opacity={0.07}>
          <h1 className="text-2xl font-semibold text-gray-900 mb-6 pt-2">Inventory</h1>
          <InventoryGrid />
        </GlassLogoBackground>
      </SectionBackground>
    </div>
  );
}
