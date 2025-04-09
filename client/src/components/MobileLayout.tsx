import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobileDetector } from "@/hooks/use-mobile-detector";
import MobileNavBar from "./MobileNavBar";
import MobileTopBar from "./MobileTopBar";
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
      
      {/* Show the mobile top bar with hamburger menu only on mobile */}
      {(user && isMobile) && <MobileTopBar />}
      
      <main className={`flex-1 ${isMobile ? 'pb-20 pt-16' : ''}`}>
        {children}
      </main>
      
      {/* Show the mobile bottom navigation bar only on mobile */}
      {(user && isMobile) && <MobileNavBar />}
    </div>
  );
}