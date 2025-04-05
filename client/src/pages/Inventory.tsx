import InventoryGrid from "@/components/InventoryGrid";
import { SectionBackground } from "@/components/ui/section-background";

export default function Inventory() {
  return (
    <div className="mb-8">
      <SectionBackground pattern="inventory" className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Inventory</h1>
        <InventoryGrid />
      </SectionBackground>
    </div>
  );
}
