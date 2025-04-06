import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobileDetector } from "@/hooks/use-mobile-detector";
import MobileNavBar from "./MobileNavBar";
import Navbar from "./Navbar";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { user } = useAuth();
  const { isMobile } = useMobileDetector();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show traditional navbar on desktop, hide on mobile */}
      {(user && !isMobile) && <Navbar />}
      
      <main className={`flex-1 ${isMobile ? 'pb-22' : ''}`}>
        {children}
      </main>
      
      {/* Show the mobile navigation bar only on mobile */}
      {(user && isMobile) && <MobileNavBar />}
    </div>
  );
}