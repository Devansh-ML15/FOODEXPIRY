import InventoryGrid from "@/components/InventoryGrid";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import { Button } from "@/components/ui/button";
import { Barcode, Plus } from "lucide-react";
import { Link } from "wouter";
import { useMobileDetector } from "@/hooks/use-mobile-detector";

export default function Inventory() {
  const { isMobile, hasCameraSupport } = useMobileDetector();

  return (
    <div className="mb-8">
      <SectionBackground pattern="inventory" className="p-6">
        <GlassLogoBackground opacity={0.07}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="page-header">Inventory</h1>
            {isMobile && hasCameraSupport && (
              <Link href="/barcode-scanner">
                <Button className="flex items-center bg-gradient-to-r from-primary to-green-400 hover:from-primary-dark hover:to-green-500 text-white font-semibold shadow-lg pulse-subtle animation-delay-300 animate-float">
                  <Barcode className="mr-2 h-5 w-5" />
                  Scan Barcode
                </Button>
              </Link>
            )}
          </div>
          <InventoryGrid showScanButton={isMobile && hasCameraSupport} />
        </GlassLogoBackground>
      </SectionBackground>
    </div>
  );
}
